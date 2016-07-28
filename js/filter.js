/*************** FILTER FUNCTIONS *****************************/
/*******FILTER HELPERS*********/

// image must be a video, img, or canvas element
function getPixels(image) {
  var c = canvasOverlay;
  var ctx = c.getContext('2d');
  ctx.drawImage(image,0,0,c.width,c.height);
  return ctx.getImageData(0,0,c.width,c.height);
};

function filterImage(filter, image, var_args) {
  var args = [getPixels(image)];
  for (var i=2; i<arguments.length; i++) {
    args.push(arguments[i]);
  }
  return filter.apply(null, args);
};


/******SHARPEN*******/
function convolute(pixels, weights, opaque) {
  var side = Math.round(Math.sqrt(weights.length));
  var halfSide = Math.floor(side/2);
  var src = pixels.data;
  var sw = pixels.width;
  var sh = pixels.height;
  // pad output by the convolution matrix
  var w = sw;
  var h = sh;
  var output = overlayContext.createImageData(w, h);
  var dst = output.data;
  // go through the destination image pixels
  var alphaFac = opaque ? 1 : 0;

  for (var y=0; y<h; y++) {
    for (var x=0; x<w; x++) {
      var sy = y;
      var sx = x;
      var dstOff = (y*w+x)*4;
      // calculate the weighed sum of the source image pixels that
      // fall under the convolution matrix
      var r=0, g=0, b=0, a=0;
      for (var cy=0; cy<side; cy++) {
        for (var cx=0; cx<side; cx++) {
          var scy = sy + cy - halfSide;
          var scx = sx + cx - halfSide;
          if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
            var srcOff = (scy*sw+scx)*4;
            var wt = weights[cy*side+cx];
            r += src[srcOff] * wt;
            g += src[srcOff+1] * wt;
            b += src[srcOff+2] * wt;
            a += src[srcOff+3] * wt;
          }
        }
      }
      dst[dstOff] = r;
      dst[dstOff+1] = g;
      dst[dstOff+2] = b;
      dst[dstOff+3] = a + alphaFac*(255-a);
    }
  }
  return output;
};


function sharpenImage(){
	if(sharpeningImage){
		var weight1 = eval($("#weight1").val());
		var weight2 = eval($("#weight2").val());
		var weight3 = eval($("#weight3").val());
		var weight4 = eval($("#weight4").val());
		var weight5 = eval($("#weight5").val());
		var weight6 = eval($("#weight6").val());
		var weight7 = eval($("#weight7").val());
		var weight8 = eval($("#weight8").val());
		var weight9 = eval($("#weight9").val());
		overlayContext.putImageData(filterImage(convolute, canvasOverlay,
		  [  weight1, weight2, weight3,
		     weight4, weight5, weight6,
		     weight7, weight8, weight9 ]
		),0,0);
	}
}

/*********CONTRAST*********/
function contrast(pixels, amountContrast) {
	amountContrast = parseFloat(amountContrast);
	var data = pixels.data;
    var factor = (259 * (amountContrast + 255)) / (255 * (259 - amountContrast));
    for(var i=0;i<data.length;i+=4)
    {
        data[i] = factor * (data[i] - 128) + 128;
        data[i+1] = factor * (data[i+1] - 128) + 128;
        data[i+2] = factor * (data[i+2] - 128) + 128;
    }
    return pixels;
}

function contrastImage(){
	if(contrastingImage){
		overlayContext.putImageData(filterImage(contrast,canvasOverlay,$("#contrast_value").val()),0,0);
	}
}
/*********BRIGHTNESS**********/
function brightness(pixels, adjustment) {
  var d = pixels.data;
  adjustment = parseFloat(adjustment);
  for (var i=0; i<d.length; i+=4) {
    d[i] += adjustment;
    d[i+1] += adjustment;
    d[i+2] += adjustment;
  }
  return pixels;
};

function brightenImage(){
	if(brighteningImage){
		overlayContext.putImageData(filterImage(brightness,canvasOverlay,$("#brighten_value").val()),0,0);
	}
}
