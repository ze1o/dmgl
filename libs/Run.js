var gl = [],
    Test,
    Plane,
    Cube,
    Sphere,
    Space,
    Camera;

var imgPathTex = [];
//[0]: Sphere, [1]:Cube, [2]:Plane
var defineSPHERE = 0,
    defineCUBE = 1,
    definePLANE = 2;
var Hud;
var ctx;
var score = 0;

var pMatrix = mat4.create();
var mvMatrix = mat4.create();
mat4.identity(mvMatrix);

var xCube = [];
var yCube = [];

var Cube = [];
var Cube2 = [];

function webGLStart() {
    Test = new DMCore.Scene('mycanvas');
    Test.addProgramShader();
    
    Hud = document.getElementById('hud');
    ctx = Hud.getContext('2d');
    Hud.height = window.innerHeight;
    Hud.width = window.innerWidth;    
    
    Camera = new DMCore.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000.0);
    Camera.translate(0.0, 1.0, -4);
    Camera.rotate((-1 / 3) * Math.PI, 1, 0, 0);
    Camera.lookat(0, 0, 1, 0, 0, 0, 0, 1, 0);
    Test.add(Camera);

    Plane = new DMCore.Plane();
    Plane.addTexture(imgPathTex[definePLANE]);
    Plane.scale(2.4, 1.2, 1.2);
    Test.add(Plane);

    Sphere = new DMCore.Sphere();
    Sphere.addTexture(imgPathTex[defineSPHERE]);
    Sphere.scale(0.043, 0.043, 0.043);
    Sphere.translate(0, 0, 2);
    Sphere.castShadow(true);
    Test.add(Sphere);

    Space = new DMCore.Sphere();
    Space.addTexture('image/bg/Space.jpg');
    Space.scale(4, 4, 5);
    Space.translate(0, 0, 0);
    Test.add(Space);


    latitudeBands = 6;
    var i = 0;
    for (var latNumber = 0; latNumber < latitudeBands * 2; latNumber++) {
        var theta = latNumber * Math.PI / latitudeBands;
        xCube[i] = Math.sin(theta) * 1;
        yCube[i] = Math.cos(theta) * 1;
        Cube[i] = new DMCore.Cube();
        Cube[i].addTexture(imgPathTex[defineCUBE]);
        Cube[i].translate(xCube[i], yCube[i], 0.1);
        Cube[i].scale(0.06, 0.06, 0.06);
        Cube[i].castShadow(true);
        Test.add(Cube[i]);
        i++;
    }
    n = i;

    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;
    gl = Test.gl;
    loop();
}
var currentlyPressedKeys = {};

function handleKeyDown(event) {
    currentlyPressedKeys[event.keyCode] = true;
}

function handleKeyUp(event) {
    currentlyPressedKeys[event.keyCode] = false;
}

var x = 0,
    y = 0;
var giatoc = 0;

function handleKeys() {
    if (currentlyPressedKeys[37]) {
        // left key
        if (Sphere.getPositionX() > -2) {
            Sphere.translate(-0.2, 0, 0);
        }
    }
    if (currentlyPressedKeys[38]) {
        // up key
        if (Sphere.getPositionY() < 1) {
            Sphere.translate(0, 0.2, 0);
        }
    }
    if (currentlyPressedKeys[39]) {
        // right key
        if (Sphere.getPositionX() < 2) {
            Sphere.translate(0.2, 0, 0);
        }

    }
    if (currentlyPressedKeys[40]) {
        // down key
        if (Sphere.getPositionY() > -1) {
            Sphere.translate(0, -0.2, 0);
        }
    }
}
var i = 0;

function check() {
    x = Sphere.getPositionX();
    y = Sphere.getPositionY();
    for (var i = 0; i < Cube.length; i++) {
        Cube[i].rotate(Math.PI / 320, 0, 0, 1);
        if (x >= xCube[i] - 0.14 && x <= xCube[i] + 0.14 && y >= yCube[i] - 0.14 && y <= yCube[i] + 0.14) {
            
            if(Test.geometry[Cube[i].indexInGeometry] != undefined){
                delete Test.geometry[Cube[i].indexInGeometry];
                score += 10;
            }
        }
    }

}
function draw2D(ctx) {
    ctx.clearRect(0, 0, 400, 400);
    ctx.font = ' 500 40px SFUIDisplay-Regular';
    ctx.fillStyle = '#fff';
    ctx.fillText("Your Score: ", 40, 75);
    ctx.fillText(score, 250, 75);
    if (score == Cube.length * 10) {
        ctx.font = ' 60px SFUIDisplay-Regular';
        ctx.fillText("YOU WIN", window.innerWidth / 2 - 110, window.innerHeight / 4);
    }

}
function loop() {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    check();
    Test.renderWebGL();
    handleKeys();
    
    draw2D(ctx);
    requestAnimationFrame(loop);
}
