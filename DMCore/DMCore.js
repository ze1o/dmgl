(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
        typeof define === 'function' && define.amd ? define(['exports'], factory) :
        (factory((global.DMCore = global.DMCore || {})));
}(this, (function (exports) {

    function Scene(id_canvas) {
        var canvas = document.getElementById(id_canvas);
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        try {
            this.gl = canvas.getContext('experimental-webgl', {
                antialias: true
            });
            this.gl.viewportWidth = canvas.width;
            this.gl.viewportHeight = canvas.height;
        } catch (e) {}
        if (!this.gl) {
            alert("Your Browser does not support webgl");
        }
        this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
        this.pMatrix = mat4.create();
        this.vMatrix = mat4.create();
        this.geometry = [];
    }

    Scene.prototype = {
        constructor: Scene,
        addProgramShader: function () {
            //CREATE SHADOW PROGRAM WHICH DRAW SHADOW MAPPING
            this.ShadowProgram = this.gl.createProgram();

            var _vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
            var _fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
            
            this.gl.shaderSource(_vertexShader, [
				'attribute vec3 aVertexPosition;\n' +
                'uniform mat4 uPMatrix;\n' +
                'uniform mat4 uVMatrix;\n' +
                'uniform mat4 uMVMatrix;\n' +

                'void main(void){\n' +
                '    gl_Position = uPMatrix * uVMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);\n' +

                '}'].join('\n'));

            this.gl.shaderSource(_fragmentShader, [
                'precision mediump float;\n' +
                'void main(void){\n' +
                '  const vec4 bitShift = vec4(1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0);\n' +
                '  const vec4 bitMask = vec4(1.0/256.0, 1.0/256.0, 1.0/256.0, 0.0);\n' +
                '  vec4 rgbaDepth = fract(gl_FragCoord.z * bitShift);\n' + // Calculate the value stored into each byte
                '  rgbaDepth -= rgbaDepth.gbaa * bitMask;\n' +
                '  gl_FragColor = vec4(0.0, 0.0, 0.0, 0.9);\n' +
                '}'].join('\n'));

            this.gl.compileShader(_vertexShader);
            this.gl.compileShader(_fragmentShader);

            this.gl.attachShader(this.ShadowProgram, _vertexShader);
            this.gl.attachShader(this.ShadowProgram, _fragmentShader);

            this.gl.linkProgram(this.ShadowProgram);

            this.ShadowProgram.Position = this.gl.getAttribLocation(this.ShadowProgram, "aVertexPosition");

            this.ShadowProgram.pMatrix = this.gl.getUniformLocation(this.ShadowProgram, "uPMatrix");
            this.ShadowProgram.vMatrix = this.gl.getUniformLocation(this.ShadowProgram, "uVMatrix");
            this.ShadowProgram.mvMatrix = this.gl.getUniformLocation(this.ShadowProgram, "uMVMatrix");
            //CREATE PROGRAM WHICH DRAW SCENE, OBJECT,...
            this.Program = this.gl.createProgram();

            var vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
            var fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);

            this.gl.shaderSource(vertexShader, [
				'attribute vec3 aVertexPosition;\n' +
                'attribute vec2 aVertexTexCoord;\n' +
                'attribute vec3 aVertexNormal;\n' +
                'uniform mat4 uPMatrix;\n' +
                'uniform mat4 uVMatrix;\n' +
                'uniform mat4 uMVMatrix;\n' +
                'uniform mat3 uNMatrix;\n' +

                'uniform vec3 uAmbientColor;\n' +
                'uniform vec3 uLightingPosition;\n' +
                'uniform vec3 uViewPosition;\n' +
                'uniform vec3 uDirectionalColor;\n' +
                'uniform float uShininess;' +

                'varying vec2 vFragTexCoord;\n' +
                'varying vec3 vLightWeighting;\n' +
                
                'void main(void){\n' +
                '    gl_Position = uPMatrix * uVMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);\n' +
                '    vFragTexCoord = aVertexTexCoord;\n' +
                '    vec3 transformedNormal = uNMatrix * aVertexNormal;\n' +
                '    vec4 vertexPosition = uPMatrix * uVMatrix  * uMVMatrix * vec4(aVertexPosition, 1.0);\n' +
                '    vec3 LightingDirection = normalize(uLightingPosition - vec3(vertexPosition));\n' +
                '    vec3 ViewDirection = normalize(uViewPosition - vec3(vertexPosition));\n' +
                '    vec3 HalfVector = normalize(LightingDirection + ViewDirection);\n' +
                '    float nDotL = max(dot(transformedNormal, LightingDirection), 0.0);\n' +
                '    float specular = 0.0;' +
                '    if (nDotL > 0.0){\n' +
                '       specular = pow(max(dot(transformedNormal, HalfVector), 0.0), uShininess);\n' +
                '    }\n' +
                '    vLightWeighting = specular + uAmbientColor + uDirectionalColor * nDotL;\n' +
                '}'].join('\n'));

            this.gl.shaderSource(fragmentShader, [
                'precision mediump float;\n' +
                'varying vec2 vFragTexCoord;\n' +
                'varying vec3 vLightWeighting;\n' +
                
                'uniform sampler2D, usampler;\n' +
                'void main(void){\n' +
                '    vec4 textureColor = texture2D(usampler, vFragTexCoord);\n' +
                '    gl_FragColor = vec4(textureColor.rgb * vLightWeighting, textureColor.a);\n' +
                '}'].join('\n'));

            this.gl.compileShader(vertexShader);
            this.gl.compileShader(fragmentShader);

            this.gl.attachShader(this.Program, vertexShader);
            this.gl.attachShader(this.Program, fragmentShader);

            this.gl.linkProgram(this.Program);
            
            this.Program.Position = this.gl.getAttribLocation(this.Program, "aVertexPosition");

            this.Program.textureCoord = this.gl.getAttribLocation(this.Program, "aVertexTexCoord");
            this.Program.normalCoord = this.gl.getAttribLocation(this.Program, "aVertexNormal");

            this.Program.pMatrix = this.gl.getUniformLocation(this.Program, "uPMatrix");
            this.Program.vMatrix = this.gl.getUniformLocation(this.Program, "uVMatrix");
            this.Program.mvMatrix = this.gl.getUniformLocation(this.Program, "uMVMatrix");
            this.Program.nMatrix = this.gl.getUniformLocation(this.Program, "uNMatrix");
            this.Program.lightPosition = this.gl.getUniformLocation(this.Program, "uLightingPosition");
            this.Program.viewPosition = this.gl.getUniformLocation(this.Program, "uViewPosition");
            this.Program.shininess = this.gl.getUniformLocation(this.Program, "uShininess");
            this.Program.lightColor = this.gl.getUniformLocation(this.Program, "uDirectionalColor");
            this.Program.ambientColor = this.gl.getUniformLocation(this.Program, "uAmbientColor");
            this.Program.sampler = this.gl.getUniformLocation(this.Program, 'usampler');

        },

        add: function (object) {
                // information about Camera
            if (object.Type == 'PerspectiveCamera') {
                this.pMatrix = object.pMatrix;
                this.vMatrix = object.vMatrix;
            } else {
                // information about light
                if (object.Type == 'Light'){
                    this.xLight = object.x;
                    this.yLight = object.y;
                    this.zLight = object.z;
                    this.rColor = object.rColor;
                    this.gColor = object.gColor;
                    this.bColor = object.bColor;
                    this.rAmb = object.rAmb;
                    this.gAmb = object.gAmb;
                    this.bAmb = object.bAmb;
                }else{
                    //Add object in geometry array which contain: buffer object(vertex, texture coordinate, normal, index) and texture object.                    
                if (object.Type == 'Plane') { 
                    // Plane Object
                    object.VertexBuffer = this.gl.createBuffer();
                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, object.VertexBuffer);
                    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(object.Vertices), this.gl.STATIC_DRAW);

                    object.TextureBuffer = this.gl.createBuffer();
                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, object.TextureBuffer);
                    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(object.TextureCoord), this.gl.STATIC_DRAW);

                    object.NormalBuffer = this.gl.createBuffer();
                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, object.NormalBuffer);
                    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(object.Normal), this.gl.STATIC_DRAW);

                } else if (object.Type == 'Cube') { 
                    // Cube Object
                    object.VertexBuffer = this.gl.createBuffer();
                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, object.VertexBuffer);
                    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(object.Vertices), this.gl.STATIC_DRAW);

                    object.TextureBuffer = this.gl.createBuffer();
                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, object.TextureBuffer);
                    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(object.TextureCoord), this.gl.STATIC_DRAW);

                    object.NormalBuffer = this.gl.createBuffer();
                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, object.NormalBuffer);
                    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(object.Normal), this.gl.STATIC_DRAW);

                    object.IndexBuffer = this.gl.createBuffer();
                    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, object.IndexBuffer);
                    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(object.Index), this.gl.STATIC_DRAW);
                } else { 
                    //Spere Object
                    object.TextureBuffer = this.gl.createBuffer();
                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, object.TextureBuffer);
                    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(object.TextureCoord), this.gl.STATIC_DRAW);
                    object.TextureBuffer.itemSize = 2;
                    object.TextureBuffer.numItems = object.TextureCoord.length / 2;

                    object.VertexBuffer = this.gl.createBuffer();
                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, object.VertexBuffer);
                    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(object.Vertices), this.gl.STATIC_DRAW);
                    object.VertexBuffer.itemSize = 3;
                    object.VertexBuffer.numItems = object.Vertices.length / 3;

                    object.NormalBuffer = this.gl.createBuffer();
                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, object.NormalBuffer);
                    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(object.Normal), this.gl.STATIC_DRAW);
                    object.NormalBuffer.itemSize = 3;
                    object.NormalBuffer.numItems = object.Normal.length / 3;

                    object.IndexBuffer = this.gl.createBuffer();
                    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, object.IndexBuffer);
                    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(object.Index), this.gl.STATIC_DRAW);
                    object.IndexBuffer.itemSize = 1;
                    object.IndexBuffer.numItems = object.Index.length;
                }
//-------------------------------CREATE TEXTURE for OBJECT-----------------------------------------
                if (object.imageTexture != undefined) {
                    object.Texture = this.gl.createTexture();
                    object.Texture.image = new Image();
                    object.Texture.image.src = object.imageTexture;
                    _gl = this.gl;
                    object.Texture.image.onload = function () {
                        _gl.bindTexture(_gl.TEXTURE_2D, object.Texture);
                        _gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGBA, _gl.RGBA, _gl.UNSIGNED_BYTE, object.Texture.image);

                        _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_S, _gl.CLAMP_TO_EDGE);
                        _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_T, _gl.CLAMP_TO_EDGE);

                        var width1 = object.Texture.image.width & (object.Texture.image.width - 1);
                        var height1 = object.Texture.image.height & (object.Texture.image.height - 1);
                        if (width1 == 0 && height1 == 0) {
                            _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, _gl.LINEAR_MIPMAP_NEAREST);
                            _gl.generateMipmap(_gl.TEXTURE_2D);
                        } else {
                            _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, _gl.LINEAR);
                        }
                        _gl.bindTexture(_gl.TEXTURE_2D, null);
                    };
                }
                this.geometry.push(object);
                object.indexInGeometry = this.geometry.length - 1;
            }
            }
        },
//-----------------------------------------------RENDER---------------------------------------------------
        renderWebGL: function () {
            //-------------------------------------DRAW SHADOW MAPPING-----------------------------------
            this.gl.useProgram(this.ShadowProgram);
            this.gl.enableVertexAttribArray(this.ShadowProgram.Position);
            //SET CAMERA AND VIEW
            this.gl.uniformMatrix4fv(this.ShadowProgram.pMatrix, false, this.pMatrix);
            this.gl.uniformMatrix4fv(this.ShadowProgram.vMatrix, false, this.vMatrix);
            //Draw shadow mapping
            for (var i = 0; i < this.geometry.length; i++) {
                if (this.geometry[i] === undefined) {
                    continue;
                }
                var temp = mat4.create();
                mat4.set(this.geometry[i].mvMatrix, temp);
                
                if (this.geometry[i].Type == 'Sphere') {
                    if (this.geometry[i].Shadow == false) {
                        continue;
                    }
                    this.geometry[i].VertexBufferShadow = this.geometry[i].VertexBuffer;
                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.geometry[i].VertexBufferShadow);
                    this.gl.vertexAttribPointer(this.ShadowProgram.Position, this.geometry[i].VertexBufferShadow.itemSize, this.gl.FLOAT, false, 0, 0);
                    

                    var tempMVMatrix = this.geometry[i].mvMatrix;
                    this.geometry[i].translate(0.025, 0, -2);
                    this.geometry[i].scale(1, 1, 0.023);
                    this.gl.uniformMatrix4fv(this.ShadowProgram.mvMatrix, false, this.geometry[i].mvMatrix);
                    this.geometry[i].IndexBufferShadow = this.geometry[i].IndexBuffer;
                    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.geometry[i].IndexBuffer);
                    this.gl.drawElements(this.gl.TRIANGLES, this.geometry[i].IndexBufferShadow.numItems, this.gl.UNSIGNED_SHORT, 0);
                    this.geometry[i].mvMatrix = tempMVMatrix;
                } else if (this.geometry[i].Type == 'Cube') {
                    if (this.geometry[i].Shadow == false) {
                        continue;
                    }
                    this.geometry[i].VertexBufferShadow = this.geometry[i].VertexBuffer;
                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.geometry[i].VertexBufferShadow);
                    this.gl.vertexAttribPointer(this.ShadowProgram.Position, 3, this.gl.FLOAT, false, 0, 0);

                    var tempMVMatrix = this.geometry[i].mvMatrix;
                    this.geometry[i].translate(0.025, 0, -1.6);
					this.geometry[i].scale(1, 1, 0.023);                    
					
                    this.gl.uniformMatrix4fv(this.ShadowProgram.mvMatrix, false, this.geometry[i].mvMatrix);
                    this.geometry[i].IndexBufferShadow = this.geometry[i].IndexBuffer;
                    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.geometry[i].IndexBufferShadow);

                    this.gl.drawElements(this.gl.TRIANGLES, 36, this.gl.UNSIGNED_SHORT, 0);
                    this.geometry[i].mvMatrix = tempMVMatrix;
                }
                mat4.set(temp, this.geometry[i].mvMatrix);
            }
            //--------------------------------------------DRAW OBJECT-------------------------------------
            this.gl.useProgram(this.Program);
            this.gl.enableVertexAttribArray(this.Program.Position);
            this.gl.enableVertexAttribArray(this.Program.normalCoord);
            this.gl.enableVertexAttribArray(this.Program.textureCoord);
            //Set light position, color, ambient color, shininess.
            this.gl.uniform3fv(this.Program.lightPosition, [this.xLight, this.yLight, this.zLight]);
            this.gl.uniform3fv(this.Program.viewPosition, [this.vMatrix[12], this.vMatrix[13], this.vMatrix[14]]);
            this.gl.uniform3fv(this.Program.lightColor, [this.rColor, this.gColor, this.bColor]);
            this.gl.uniform1f(this.Program.shininess, 0.3);
            this.gl.uniform3fv(this.Program.ambientColor, [this.rAmb, this.gAmb, this.bAmb]);
            //set camera and view
            this.gl.uniformMatrix4fv(this.Program.pMatrix, false, this.pMatrix);
            this.gl.uniformMatrix4fv(this.Program.vMatrix, false, this.vMatrix);
            // draw
            for (var i = 0; i < this.geometry.length; i++) {
                if (this.geometry[i] === undefined) {
                    continue;
                }
                if (this.geometry[i].Type == 'Plane') {

                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.geometry[i].VertexBuffer);
                    this.gl.vertexAttribPointer(this.Program.Position, 3, this.gl.FLOAT, false, 0, 0);

                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.geometry[i].NormalBuffer);
                    this.gl.vertexAttribPointer(this.Program.normalCoord, 3, this.gl.FLOAT, false, 0, 0);

                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.geometry[i].TextureBuffer);
                    this.gl.vertexAttribPointer(this.Program.textureCoord, 2, this.gl.FLOAT, false, 0, 0);
                    this.gl.bindTexture(this.gl.TEXTURE_2D, this.geometry[i].Texture);
                    this.gl.activeTexture(this.gl.TEXTURE0);
                    this.gl.uniform1i(this.Program.sampler, 0.2);
                    
                    this.gl.uniformMatrix4fv(this.Program.mvMatrix, false, this.geometry[i].mvMatrix);
                    var normalMatrix = mat3.create();
                    mat4.toInverseMat3(this.geometry[i].mvMatrix, normalMatrix);
                    mat3.transpose(normalMatrix);
                    this.gl.uniformMatrix3fv(this.Program.nMatrix, false, normalMatrix);

                    this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, 4);
                } else if (this.geometry[i].Type == 'Sphere') {

                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.geometry[i].VertexBuffer);
                    this.gl.vertexAttribPointer(this.Program.Position, this.geometry[i].VertexBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.geometry[i].NormalBuffer);
                    this.gl.vertexAttribPointer(this.Program.normalCoord, this.geometry[i].NormalBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.geometry[i].TextureBuffer);
                    this.gl.vertexAttribPointer(this.Program.textureCoord, this.geometry[i].TextureBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
                    this.gl.activeTexture(this.gl.TEXTURE0);
                    this.gl.bindTexture(this.gl.TEXTURE_2D, this.geometry[i].Texture);
                    this.gl.uniform1i(this.Program.sampler, 0);
                    this.gl.uniformMatrix4fv(this.Program.mvMatrix, false, this.geometry[i].mvMatrix);
                    var normalMatrix = mat3.create();
                    mat4.toInverseMat3(this.geometry[i].mvMatrix, normalMatrix);
                    mat3.transpose(normalMatrix);
                    this.gl.uniformMatrix3fv(this.Program.nMatrix, false, normalMatrix);
                    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.geometry[i].IndexBuffer);
                    this.gl.drawElements(this.gl.TRIANGLES, this.geometry[i].IndexBuffer.numItems, this.gl.UNSIGNED_SHORT, 0);
                } else if (this.geometry[i].Type == 'Cube') {

                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.geometry[i].VertexBuffer);
                    this.gl.vertexAttribPointer(this.Program.Position, 3, this.gl.FLOAT, false, 0, 0);

                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.geometry[i].NormalBuffer);
                    this.gl.vertexAttribPointer(this.Program.normalCoord, 3, this.gl.FLOAT, false, 0, 0);

                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.geometry[i].TextureBuffer);
                    this.gl.vertexAttribPointer(this.Program.textureCoord, 2, this.gl.FLOAT, false, 0, 0);

                    this.gl.bindTexture(this.gl.TEXTURE_2D, this.geometry[i].Texture);
                    this.gl.activeTexture(this.gl.TEXTURE0);
                    this.gl.uniform1i(this.Program.sampler, 0);
                    this.gl.uniformMatrix4fv(this.Program.mvMatrix, false, this.geometry[i].mvMatrix);
                    var normalMatrix = mat3.create();
                    mat4.toInverseMat3(this.geometry[i].mvMatrix, normalMatrix);
                    mat3.transpose(normalMatrix);
                    this.gl.uniformMatrix3fv(this.Program.nMatrix, false, normalMatrix);
                    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.geometry[i].IndexBuffer);

                    this.gl.drawElements(this.gl.TRIANGLES, 36, this.gl.UNSIGNED_SHORT, 0);
                }
                
            }
        }
    }
    //---------------------------------------LIGHT OBJECT--------------------------------------------
    function Light(x, y, z, rColor, gColor, bColor, rAmb, gAmb, bAmb){
        this.Type = 'Light';
        this.x = x !== undefined ? x : 0;
        this.y = y !== undefined ? y : 0;
        this.z = z !== undefined ? z : 0;
        this.rColor = rColor !== undefined ? rColor : 0.2;
        this.gColor = gColor !== undefined ? gColor : 0.2;
        this.bColor = bColor !== undefined ? bColor : 0.2;
        this.rAmb = rAmb !== undefined ? rAmb : 0.5;
        this.gAmb = gAmb !== undefined ? gAmb : 0.5;
        this.bAmb = bAmb !== undefined ? bAmb : 0.5;
    }
    Light.prototype = {
        constructor: Light,
        position: function(x, y, z){
            this.x = x;
            this.y = y;
            this.z = z;
        },
        color: function(red, green, blue){
            this.rColor = red;
            this.gColor = green;
            this.bColor = blue;
        },
        ambient: function(red, green, blue){
            this.rAmb = red;
            this.gAmb = green;
            this.bAmb = blue;
        }
    }
    //---
    //--------------------PERSPECTIVE CAMERA OBJECT---------------------------------------
    function PerspectiveCamera(fov, aspect, near, far) {
        this.pMatrix = mat4.create();
        this.vMatrix = mat4.create();
        this.Type = 'PerspectiveCamera';
        this.fov = fov !== undefined ? fov : 50;
        this.aspect = aspect !== undefined ? aspect : 1;
        this.near = near !== undefined ? near : 0.1;
        this.far = far !== undefined ? far : 2000;
        mat4.perspective(fov, aspect, near, far, this.pMatrix);
        
    }

    PerspectiveCamera.prototype = {
        constructor: PerspectiveCamera,
        translate: function (x, y, z) {
            mat4.translate(this.pMatrix, [x, y, z]);
            
        },
        rotate: function (a, b, c, d) {
            mat4.rotate(this.pMatrix, a, [b, c, d]);
            
        },
        lookat: function (ex, ey, ez, x, y, z, ax, ay, az) {
            mat4.lookAt([ex, ey, ez], [x, y, z], [ax, ay, az], this.vMatrix );
        }
    }
//    --------------------OBJECT 3D------------------------------------------------------------
    function Object3D() {
        this.Type,
            this.Vertices = [],
            this.TextureCoord = [],
            this.Index = [],
            this.Normal = [],
            this.imageTexture,
            this.Texture,
            this.VertexBuffer,
            this.VertexBufferShadow,
            this.TextureBuffer,
            this.NormalBuffer,
            this.IndexBuffer,
            this.IndexBufferShadow,
            this.mvMatrix = mat4.create(),
            this.indexInGeometry,
            this.position,
            this.Shadow = false;
        mat4.identity(this.mvMatrix);
            

    }
    Object3D.prototype = {
        constructor: Object3D,
        getVertices: function () {
            return this.Vertices;
        },
       
        rotate: function (a, b, c, d) {
            
            mat4.rotate(this.mvMatrix, a, [b, c, d]);
            
        },
        scale: function (x, y, z) {
            
            mat4.scale(this.mvMatrix, [x, y, z]);
            
        },
        translate: function (x, y, z) {
            
            mat4.translate(this.mvMatrix, [x, y, z]);
            
        },
        addTexture: function (img_src) {
            this.imageTexture = img_src;
        },
        getPositionX: function () {
            return this.mvMatrix[12];
        },
        getPositionY: function () {
            return this.mvMatrix[13];
        },
        castShadow: function(bool){
            return (this.Shadow = bool);
        }
    }
//----------------------------PLANE OBJECT --------------------------------------------------------
    function Plane() {
        Object3D.call(this);
        this.Type = 'Plane';
        this.Vertices = [
           -1.0, 1.0, 0.0,
            1.0, 1.0, 0.0,
            1.0, -1.0, 0.0,
            -1.0, -1.0, 0.0
        ];
        this.TextureCoord = [
            0.0, 1.0,
            1.0, 1.0,
            1.0, 0.0,
            0.0, 0.0,
        ];
        this.Normal = [
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,
        ];
    }
    Plane.prototype = Object.create(Object3D.prototype);
//---------------------------------CUBE OBJECT-------------------------------------------------------
    function Cube() {
        Object3D.call(this);
        this.Type = 'Cube';
        this.Vertices = [
            // Front face
            -1.0, -1.0, 1.0,
            1.0, -1.0, 1.0,
            1.0, 1.0, 1.0,
            -1.0, 1.0, 1.0,

            // Back face
            -1.0, -1.0, -1.0,
            -1.0, 1.0, -1.0,
            1.0, 1.0, -1.0,
            1.0, -1.0, -1.0,

            // Top face
            -1.0, 1.0, -1.0,
            -1.0, 1.0, 1.0,
            1.0, 1.0, 1.0,
            1.0, 1.0, -1.0,

            // Bottom face
            -1.0, -1.0, -1.0,
            1.0, -1.0, -1.0,
            1.0, -1.0, 1.0,
            -1.0, -1.0, 1.0,

             // Right face
            1.0, -1.0, -1.0,
            1.0, 1.0, -1.0,
            1.0, 1.0, 1.0,
            1.0, -1.0, 1.0,

            // Left face
            -1.0, -1.0, -1.0,
            -1.0, -1.0, 1.0,
            -1.0, 1.0, 1.0,
            -1.0, 1.0, -1.0,
        ];
        this.TextureCoord = [
            // Front face
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,

            // Back face
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,

            // Top face
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,

            // Bottom face
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,

            // Right face
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,

            // Left face
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,
        ];
        this.Index = [
            0, 1, 2, 0, 2, 3, // Front face
            4, 5, 6, 4, 6, 7, // Back face
            8, 9, 10, 8, 10, 11, // Top face
            12, 13, 14, 12, 14, 15, // Bottom face
            16, 17, 18, 16, 18, 19, // Right face
            20, 21, 22, 20, 22, 23 // Left face
        ];
        this.Normal = [
            //front face
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,
            //back face
            0.0, 0.0, -1.0,
            0.0, 0.0, -1.0,
            0.0, 0.0, -1.0,
            0.0, 0.0, -1.0,
            //top face
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,
            //bottom face
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,
            //right face
            1.0, 0.0, 0.0,
            1.0, 0.0, 0.0,
            1.0, 0.0, 0.0,
            1.0, 0.0, 0.0,
            //left face
            -1.0, 0.0, 0.0,
            -1.0, 0.0, 0.0,
            -1.0, 0.0, 0.0,
            -1.0, 0.0, 0.0,
        ]
    }
    Cube.prototype = Object.create(Object3D.prototype);
//------------------------------------SPHERE OBJECT----------------------------------------------
    function Sphere() {
        Object3D.call(this);
        this.Type = 'Sphere';
        var latitudeBands = 30;
        var longitudeBands = 30;
        var radius = 2;
        for (var latNumber = 0; latNumber <= latitudeBands; latNumber++) {
            var theta = latNumber * Math.PI / latitudeBands;
            var sinTheta = Math.sin(theta);
            var cosTheta = Math.cos(theta);

            for (var longNumber = 0; longNumber <= longitudeBands; longNumber++) {
                var phi = longNumber * 2 * Math.PI / longitudeBands;
                var sinPhi = Math.sin(phi);
                var cosPhi = Math.cos(phi);

                var x = cosPhi * sinTheta;
                var y = cosTheta;
                var z = sinPhi * sinTheta;
                var u = 1 - (longNumber / longitudeBands);
                var v = 1 - (latNumber / latitudeBands);
                this.Normal.push(x);
                this.Normal.push(y);
                this.Normal.push(z);
                this.TextureCoord.push(u);
                this.TextureCoord.push(v);
                this.Vertices.push(radius * x);
                this.Vertices.push(radius * y);
                this.Vertices.push(radius * z);
            }
        }

        for (var latNumber = 0; latNumber < latitudeBands; latNumber++) {
            for (var longNumber = 0; longNumber < longitudeBands; longNumber++) {
                var first = (latNumber * (longitudeBands + 1)) + longNumber;
                var second = first + longitudeBands + 1;
                this.Index.push(first);
                this.Index.push(second);
                this.Index.push(first + 1);

                this.Index.push(second);
                this.Index.push(second + 1);
                this.Index.push(first + 1);
            }
        }
    }
    Sphere.prototype = Object.create(Object3D.prototype);

    

    exports.Scene = Scene;
    exports.PerspectiveCamera = PerspectiveCamera;
    exports.Light = Light;
    exports.Object3D = Object3D;
    exports.Plane = Plane;
    exports.Cube = Cube;
    exports.Sphere = Sphere;


    Object.defineProperty(exports, '__esModule', {
        value: true
    });
})));
