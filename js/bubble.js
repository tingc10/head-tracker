var canvas = document.getElementById("bubble-overlay");
var context = canvas.getContext('2d');
canvas.width = 667;
canvas.height = 500;

window.requestAnimFrame = (function(callback) {
        return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
          function(callback) {
          window.setTimeout(callback, 1000 / 60);
        };
})();


// optimized forEach function
Array.prototype.forEach = function(a){
  var l=this.length;
  for(var i=0;i<l;i++)
    a(this[i],i);
}

function Bubble(context, canvas) {
  this.x = 0;
  this.y = 0;
  this.startTime = 0;
  this.canvas = canvas;
  this.context = context;
  this.radius = 0;
  this.linearSpeed = 0;
}

// must be called for forEach where this is the bubble object
function drawBubble(self, index){
  if(index == 0){
    context.clearRect(0, 0, canvas.width, canvas.height);
    initCanvas();

  }
  self.context.save();
  self.context.beginPath();
  // console.log(this.y);
  var complete = self.floatUp()
  
  
  self.context.arc(self.x, self.y, self.radius, 0, 2 * Math.PI, false);
 
  // this.context.fillStyle ="green";
  // this.context.fill();


  self.context.clip();
  self.context.clearRect(self.x-self.radius,self.y-self.radius,2*self.radius,2*self.radius);
  self.context.restore();
  if(complete){
    generateRandomBubbles(self);
  } 
  requestAnimFrame(function(){
    drawBubble(self, index);
  });
  

};

// function animateBubbles(bubbles){

//   bubbles.forEach(drawBubble);

  
// }

// updates the bubble position
Bubble.prototype.floatUp = function(){
  
  // update
  var time = (new Date()).getTime() - this.startTime;
  // console.log(time);
  // pixels / 2seconds
  var newY = this.linearSpeed * time / 20000;

  if((this.y - newY) > -2*(this.radius)) {
    // console.log('called');

    this.y -= newY;
    var amplitude = 3;


    // in ms
    var period = 3000;
    // var centerX = this.canvas.width / 2 - myRectangle.width / 2;
    var nextX = amplitude * Math.sin(time * 2 * Math.PI / period) + this.x;
    // console.log(nextX);
    this.x = nextX;
    // clear
    // this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    return false;
    
  } else {
    return true;
  }
  

};


function initCanvas(){
  context.rect(0,0,canvas.width,canvas.height);
  context.fillStyle = "rgba(0,0,0,.5)";
  context.fill();
  
  
}


function generateRandomBubbles(bubble){
  var push = false;
  if(bubble == null){
    bubble = new Bubble(context, canvas);
    push = true;
  }
  bubble.x = Math.floor(Math.random()*canvas.width);
  bubble.radius = Math.floor(Math.random()*100 + 50);
  bubble.y = canvas.height + bubble.radius;
  //generates random linear speed from 1-5
  bubble.startTime = (new Date()).getTime();
  bubble.linearSpeed = (Math.random()*4)+1;
  if(push){
    drawBubble(bubble, numBubble);
    numBubble++;
    // bubbles.push(bubble);
  }
}

// generates bubbles that are 2 seconds apart from each other
var numBubble = 0;
var delayBubbles = setInterval(function(){
  generateRandomBubbles(null);
  console.log("bubble");
  if(numBubble > 4){
    clearInterval(delayBubbles);
  }
}, 2000);
