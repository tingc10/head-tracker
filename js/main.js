/***************** DEFINING ENUMS AND INIT ***********************/
// add some custom messaging
statusMessages = {
	"whitebalance" : "checking for stability of camera whitebalance",
	"detecting" : "Detecting face",
	"hints" : "Hmm. Detecting the face is taking a long time",
	"redetecting" : "Lost track of face, redetecting",
	"lost" : "Lost track of face",
	"found" : "Tracking face"
};

supportMessages = {
	"no getUserMedia" : "Unfortunately, <a href='http://dev.w3.org/2011/webrtc/editor/getusermedia.html'>getUserMedia</a> is not supported in your browser. Try <a href='http://www.opera.com/browser/'>downloading Opera 12</a> or <a href='http://caniuse.com/stream'>another browser that supports getUserMedia</a>. Now using fallback video for facedetection.",
	"no camera" : "No camera found. Using fallback video for facedetection."
};

// canvas and video init
// set up video and canvas elements needed
var videoInput = document.getElementById('vid');
var canvasOverlay = document.getElementById('overlay');
var overlayContext = canvasOverlay.getContext('2d');
canvasOverlay.width = 800;
canvasOverlay.height = 600;

var transitionOverlay1 = document.getElementById('transition_overlay1');
var transitionOverlay2 = document.getElementById('transition_overlay2');
var transitionContext1 = transitionOverlay1.getContext('2d');
var transitionContext2 = transitionOverlay2.getContext('2d');
transitionOverlay2.width = transitionOverlay1.width = 800;
transitionOverlay2.height = transitionOverlay1.height = 600;


// the face tracking init
var htracker = new headtrackr.Tracker({altVideo : { ogv : "./media/capture5.ogv", mp4 : "./media/capture5.mp4"}, calcAngles : true, ui : false, headPosition : false});
console.log(canvasOverlay.width + "x" + canvasOverlay.height);
htracker.init(videoInput, canvasOverlay);

htracker.start();


/********Comparison Video Init*************/
var video = document.getElementById("comparison-vid");
var stream;
navigator.getUserMedia = navigator.getUserMedia ||
  navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
// successCallback runs when camera is allowed by browser
function successCallback(stream) {
  window.stream = stream; // stream available to console
  video.src = window.URL.createObjectURL(stream);
}

function errorCallback(error){
  console.log("navigator.getUserMedia error: ", error);
}

var webcamConstraints  = {
  video: {
    mandatory: { minAspectRatio: 4/3, maxAspectRatio: 4/3 }
  }
};

function getMedia(constraints){
  navigator.getUserMedia(constraints, successCallback, errorCallback);
}
/******************************************/

// boolean init
var sharpeningImage = false;
var brighteningImage = false;
var contrastingImage = false;
var following_face = true;
var onTransition1 = true;
var sqwiggleOn = false;
var faceBorderOn = true;
var faceBorderRunOnce = true;
var noSqwiggleFilter = false;
var sqwiggleInterval;
var currentZoomScale = 1;
var goldenRatio = 1.618;
/*************** FACEDETECTION HELPER FUNCTIONS ******************/
function resetFaceDetect() {
	stopFaceDetect();
	htracker.start();
	seeFacePosition();
}

function seeFacePosition(){
	faceBorderRunOnce = true;
	faceBorderOn = true;
}

function centerVideo(){
	var faceCoordinate = {
		"x" : $(".window-size").width()/2,
		"y" : $(".window-size").height()/2
	};
	centerInFace($(".container"), null, faceCoordinate);
}

function stopFaceDetect() {
	htracker.stop();
	$(".window-size").css("width","800");
	centerVideo();
}

function resetOnStatus(status){
	
	if(status == "hints" || status == "lost" || status == "redetecting"){
		centerVideo();
	}
}

// returns the zoomScale to readjust face coordinates
function zoomFace(currentFaceWidth){
	//optimal is 150
	currentZoomScale = 150/currentFaceWidth;
	var newVideoWidth = (currentZoomScale)*800; //667 is video width
	if(newVideoWidth < $(".container").width()){
		newVideoWidth = $(".container").width();
		currentZoomScale = 1;
	}
	// $(".window-size").css({
	// 	"width" : newVideoWidth + "px"
	// });
	return newVideoWidth;
}


// for each facetracking event received draw rectangle around tracked face on canvas
function centerInFace(containerElement, currentFaceWidth, faceCoordinate) {
	var startingPointX = containerElement.width()/2;
	var startingPointY = containerElement.height()/2;
	// video and canvas is 320x240, must be rescaled
	var offsetX = -1*(faceCoordinate.x);
	var offsetY = -1*(faceCoordinate.y);
	var offset = {
		'x' : 0,
		'y' : 0
	}
	var innerElementDimension = {
		'width' : $(".window-size").width(),
		'height' : $(".window-size").height()
	}
	// if zoom in face on if currentFaceWidth has a value
	if(currentFaceWidth != null){
		innerElementDimension.width = zoomFace(currentFaceWidth);	
		innerElementDimension.height = (3/4)*innerElementDimension.width;
		offsetX = currentZoomScale*offsetX;
		offsetY = currentZoomScale*offsetY;
	}
	
	offset.x = startingPointX + offsetX;
	offset.y = startingPointY + offsetY;

	keepInBoundary(containerElement, innerElementDimension, offset);
	
}


/*********SQWIGGLE*********/

function takeSnapshot(){
	var context;
	var canvas;
	var altCanvas;
	if(onTransition1){
		context = transitionContext1;
		canvas = transitionOverlay1;
		altCanvas = transitionOverlay2;
		
	} else {
		context = transitionContext2;
		canvas = transitionOverlay2;
		altCanvas = transitionOverlay1;
		

	}
	onTransition1 = !onTransition1;
	context.drawImage(videoInput, 0, 0, canvas.width, canvas.height);
	$(altCanvas).css({
		"z-index" : "5"
	});
	$(altCanvas).fadeOut("slow",function(){
		$(this).css({
			"visibility" : "hidden",
			"z-index" : "0",

		});
	});
	$(canvas).css({
		"display" : "block",
		"left" : $(".window-size").css("left"),
		"top" : $(".window-size").css("top"),
		// "z-index" : "1000",
		"width" : $(".window-size").css("width"),
		"height" : $(".window-size").css("height"),
		"visibility" : "visible"
	});
	if(!noSqwiggleFilter){
		$(canvas).css({
			"-webkit-filter" : "grayscale(1) blur(3px)"
		});
	}
}



/*************** MISC AND LAYOUT FUNCTIONS ********************/
function centerInElement(containerElement,objectToCenter, centerWidth, centerHeight) {
  var startingPointX = containerElement.width()/2;
  var startingPointY = containerElement.height()/2;
  var offsetX = -1*(objectToCenter.width()/2);
  var offsetY = -1*(objectToCenter.height()/2);
  var left = startingPointX + offsetX;
  var top = startingPointY + offsetY;

  if(centerHeight && centerWidth){
    objectToCenter.css({
      "left" : left,
      "top" : top
    });
  } else if(centerWidth) {
    objectToCenter.css({
      "left" : left
    });
  } else {
    objectToCenter.css({
      "top" : top
    });
  }
}

// assuming innerElement is larger in size than containerElement
function keepInBoundary(containerElement, innerElement, curOffset){

	// innerElement is a struct with "width" and "height" property
	// containerElement is a jQuery object
	var rightBoundaryThreshold =  -1*(innerElement.width - containerElement.width());
	
	var leftBoundaryThreshold = 0;
	var topBoundaryThreshold = 0;
	var bottomBoundaryThreshold = -1*(innerElement.height - containerElement.height());
	


	if(curOffset.x >= leftBoundaryThreshold) {
		curOffset.x = leftBoundaryThreshold;
	} else if (curOffset.x <= rightBoundaryThreshold){
		curOffset.x = rightBoundaryThreshold;

	}

	if(curOffset.y >= topBoundaryThreshold){
		curOffset.y = topBoundaryThreshold;
	} else if (curOffset.y <= bottomBoundaryThreshold) {
		curOffset.y = bottomBoundaryThreshold;

	}

	$(".window-size").css({
	  "left" : curOffset.x,
	  "top" : curOffset.y,
	  // "margin-right" : curOffset.x,
	  // "margin-bottom" : curOffset.y,
	  "width" : innerElement.width
	});
}

function drawFaceBorder(event){
	if(faceBorderRunOnce){
		faceBorderRunOnce = false;
		setTimeout(function(){
			faceBorderOn = false;
		},3000);
	}
	if(faceBorderOn){
		// Draw onto face
		overlayContext.beginPath();
		overlayContext.moveTo(event.x+3, event.y+3);
		overlayContext.lineTo(event.x-3, event.y-3);
		overlayContext.moveTo(event.x+3, event.y-3);
		overlayContext.lineTo(event.x-3, event.y+3);
		overlayContext.stroke();

		
		// draw face border
		overlayContext.translate(event.x, event.y)
		overlayContext.rotate(event.angle-(Math.PI/2));
		overlayContext.strokeStyle = "#00CC00";
		overlayContext.strokeRect((-(event.width/2)) >> 0, (-(event.height/2)) >> 0, event.width, event.height);
		overlayContext.rotate((Math.PI/2)-event.angle);
		overlayContext.translate(-event.x, -event.y);
	}
}


/****************** EVENT LISTENERS *************************/
document.addEventListener("headtrackrStatus", function(event) {
	resetOnStatus(event.status);

	if (event.status in supportMessages) {
		var messagep = document.getElementById('gUMMessage');
		messagep.innerHTML = supportMessages[event.status];
	} else if (event.status in statusMessages) {
		var messagep = document.getElementById('headtrackerMessage');
		messagep.innerHTML = statusMessages[event.status];
	}
}, true);

document.addEventListener("facetrackingEvent", function( event ) {
	// overlayContext.fillRect(100,150,10,10);
	// overlayContext.beginPath();
	// overlayContext.moveTo(100-5,150-5);
	// overlayContext.lineTo(100+5,150+5);
	// overlayContext.moveTo(100-5,150+5);
	// overlayContext.lineTo(100+5,150-5);
	// overlayContext.stroke();

	// clear canvas
	// overlayContext.clearRect(0,0,800,600);
	// once we have stable tracking, draw rectangle
	overlayContext.drawImage($("#vid")[0],0,0,canvasOverlay.width,canvasOverlay.height);
	sharpenImage();
	contrastImage();
	brightenImage();
	if (event.detection == "CS") {
		// calculate optimal face proportion
		var properFaceHeight = event.width*goldenRatio;
		if(event.height > properFaceHeight){
			var heightDiff = event.height - properFaceHeight;
			event.height = properFaceHeight;
			event.y = event.y - heightDiff/2;
		}

		if(following_face){
			
			var faceCoordinate = {
				"x" : event.x,
				"y" : event.y
			};
			centerInFace($(".container"), event.width, faceCoordinate);
			if(event.width < 25){
				resetFaceDetect();
			}

			drawFaceBorder(event);

		}
		
	}
	
});


$("#button_reset").click(function(){
	resetFaceDetect();
});

$("#button_locateFace").click(function(){
	seeFacePosition();
});

$("#button_turnOff").click(function(){
	if(following_face){
		$(this).html("Start Facetrack");
		$(".window-size").css("width","800");
		$(this).removeClass("on");
		$(this).addClass("off");
		centerVideo();
	} else {
		$(this).html("Stop Facetrack");
		$(this).removeClass("off");
		$(this).addClass("on");
		resetFaceDetect();

	}
	following_face = !following_face;
});

$("#button_sharpen").click(function(){
	if(sharpeningImage){
		$(this).html("Sharpen Image");
		$(this).removeClass("on");
		$(this).addClass("off");
	} else {
		$(this).html("Stop Sharpening");
		$(this).removeClass("off");
		$(this).addClass("on");
	}
	sharpeningImage = !sharpeningImage;
});

$("#button_contrast").click(function(){
	if(contrastingImage){
		$(this).html("Contrast Image");
		$(this).removeClass("on");
		$(this).addClass("off");
	} else {
		$(this).html("Stop Contrasting");
		$(this).removeClass("off");
		$(this).addClass("on");
	}
	contrastingImage = !contrastingImage;
});

$("#button_brighten").click(function(){
	if(brighteningImage){
		$(this).html("Brighten Image");
		$(this).removeClass("on");
		$(this).addClass("off");
	} else {
		$(this).html("Stop Brightening");
		$(this).removeClass("off");
		$(this).addClass("on");
	}
	brighteningImage = !brighteningImage;
});

$(".input_value").keydown(function(event){
	// up key pressed
	if(event.keyCode == 38){
		var value = parseInt($(this).val());
		value++;
		$(this).val(value);
	} else if (event.keyCode == 40) {
		var value = parseInt($(this).val());
		value--;
		$(this).val(value);

	}
});

$("input[id^=weight]").keydown(function(event){
	// up key pressed
	if(event.keyCode == 38){
		var value = parseFloat($(this).val());
		value += 0.05;
		$(this).val(value.toFixed(2));
	} else if (event.keyCode == 40) {
		var value = parseFloat($(this).val());
		value -= 0.05;
		$(this).val(value.toFixed(2));

	}
});

$("#button_sqwiggle").click(function(){
	if(sqwiggleOn) {
		$(".sqwiggle").css("display", "none");
		$("#bubble-overlay").css("display", "none");
		$(this).removeClass("on");
		$(this).addClass("off");
		clearInterval(sqwiggleInterval);

	} else {
		$(".sqwiggle").css("display", "block");
		$("#bubble-overlay").css("display", "block");
		$(this).removeClass("off");
		$(this).addClass("on");
		takeSnapshot();
		sqwiggleInterval = setInterval(takeSnapshot,5000);

	}
	sqwiggleOn = !sqwiggleOn;
});

$(".container").click(function(){
	if(sqwiggleOn){
		$(".sqwiggle").css("visibility", "hidden");
		$("#bubble-overlay").css("display","none");

	}
});

$(".container").mouseover(function(){
	if(sqwiggleOn){
		$(".sqwiggle").css("-webkit-filter","none");
		noSqwiggleFilter = true;
	}
});

$(".container").mouseleave(function(){
	if(sqwiggleOn){
		noSqwiggleFilter = false;
		takeSnapshot();
		$(".sqwiggle").css("visibility", "visible");
		$("#bubble-overlay").css("display", "block");
	}
});


/********************** ON PAGE LOAD ********************/


$(function(){
	getMedia(webcamConstraints);
	
	// centerInElement($("html"),$(".video-container"),true, false);
	centerVideo();
	$(window).resize(function(){
		// centerInElement($("html"),$(".video-container"),true, false);
	});




	// overlayContext.beginPath();
	// overlayContext.moveTo(100,200);

})
		