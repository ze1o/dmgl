navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
window.URL = window.URL || window.webkitURL;
var camvideo = document.getElementById('camera');

function callCamera(){
	if (!navigator.getUserMedia) 
	{
		document.getElementById('messageError').innerHTML = 
			'Sorry. <code>navigator.getUserMedia()</code> is not available.';
	}
	navigator.getUserMedia({video: true}, gotStream, noStream);

}
function gotStream(stream) 
{
	if (window.URL) 
	{   camvideo.src = window.URL.createObjectURL(stream);   } 
	else // Opera
	{   camvideo.src = stream;   }

	camvideo.onerror = function(e) 
	{   stream.stop();   };

	stream.onended = noStream;
}

function noStream(e) 
{
	var msg = 'No camera available.';
	if (e.code == 1) 
	{   msg = 'User denied access to use camera.';   }
	console.info(msg);
}

// assign global variables to HTML elements
var video = document.getElementById( 'camera' );
var videoCanvas = document.getElementById( 'videoCanvas' );
var videoContext = videoCanvas.getContext( '2d' );

var layer2Canvas = document.getElementById( 'layer2' );
var layer2Context = layer2Canvas.getContext( '2d' );

var blendCanvas  = document.getElementById( "blendCanvas" );
var blendContext = blendCanvas.getContext('2d');

// these changes are permanent
videoContext.translate(320, 0);
videoContext.scale(-1, 1);
		
// background color if no video present
videoContext.fillStyle = '#005337';
videoContext.fillRect( 0, 0, videoCanvas.width, videoCanvas.height );				

var buttons = [];

var button1 = new Image();
button1.src ="image/leap-motion/left.png";
var buttonData1 = { name:1, image:button1, x:5, y:5, w:32, h:32 };
buttons.push( buttonData1 );

var button2 = new Image();
button2.src ="image/leap-motion/up.png";
var buttonData2 = { name:2, image:button2, x:100, y:5, w:32, h:32 };
buttons.push( buttonData2 );

var button3 = new Image();
button3.src ="image/leap-motion/down.png";
var buttonData3 = { name:4, image:button3, x:200, y:5, w:32, h:32 };
buttons.push( buttonData3 );

var button4 = new Image();
button4.src ="image/leap-motion/right.png";
var buttonData4 = { name:3, image:button4, x:285, y:5, w:32, h:32 };
buttons.push( buttonData4 );

// start the loop				
_animate();

function _animate() {
    requestAnimationFrame( _animate );
	
	render();	
	blend();	
	checkAreas();
}

function render() 
{	
	if ( video.readyState === video.HAVE_ENOUGH_DATA ) 
	{
		// mirror video
		videoContext.drawImage( video, 0, 0, videoCanvas.width, videoCanvas.height );
		for ( var i = 0; i < buttons.length; i++ )
			layer2Context.drawImage( buttons[i].image, buttons[i].x, buttons[i].y, buttons[i].w, buttons[i].h );		
	}
}

var lastImageData;

function blend() 
{
	var width  = videoCanvas.width;
	var height = videoCanvas.height;
	// get current webcam image data
	var sourceData = videoContext.getImageData(0, 0, width, height);
	// create an image if the previous image doesn�t exist
	if (!lastImageData) lastImageData = videoContext.getImageData(0, 0, width, height);
	// create a ImageData instance to receive the blended result
	var blendedData = videoContext.createImageData(width, height);
	// blend the 2 images
	differenceAccuracy(blendedData.data, sourceData.data, lastImageData.data);
	// draw the result in a canvas
	blendContext.putImageData(blendedData, 0, 0);
	// store the current webcam image
	lastImageData = sourceData;
}
function differenceAccuracy(target, data1, data2) 
{
	if (data1.length != data2.length) return null;
	var i = 0;
	while (i < (data1.length * 0.25)) 
	{
		var average1 = (data1[4*i] + data1[4*i+1] + data1[4*i+2]) / 3;
		var average2 = (data2[4*i] + data2[4*i+1] + data2[4*i+2]) / 3;
		var diff = threshold(fastAbs(average1 - average2));
		target[4*i]   = diff;
		target[4*i+1] = diff;
		target[4*i+2] = diff;
		target[4*i+3] = 0xFF;
		++i;
	}
}
function fastAbs(value) 
{
	return (value ^ (value >> 31)) - (value >> 31);
}
function threshold(value) 
{
	return (value > 0x15) ? 0xFF : 0;
}

var checkCount = 0;

// check if white region from blend overlaps area of interest (e.g. triggers)
function checkAreas() 
{
	for (var b = 0; b < buttons.length; b++)
	{
		// get the pixels in a note area from the blended image
		var blendedData = blendContext.getImageData( buttons[b].x, buttons[b].y, buttons[b].w, buttons[b].h );
			
		// calculate the average lightness of the blended data
		var i = 0;
		var sum = 0;
		var countPixels = blendedData.data.length * 0.25;
		while (i < countPixels) 
		{
			sum += (blendedData.data[i*4] + blendedData.data[i*4+1] + blendedData.data[i*4+2]);
			++i;
		}
		// calculate an average between of the color values of the note area [0-255]
		var average = Math.round(sum / (3 * countPixels));
		if (average > 30) // more than 20% movement detected
		{
			checkCount++;
			if(checkCount > 4)
			{ 
			control_leapmotion = buttons[b].name;
			}
		}
	}
}