hotjs = hotjs || {};
hotjs.motion = hotjs.motion || {};

(function(){
// The watch id references the current `watchAcceleration`
var watchID = null;

var accels = [];
var minX = 0, maxX = 0;
var minY = 0, maxY = 0;
var minZ = 0, maxZ = 0;

var motions = [];
var maxMotion = 0, minMotion = 0;

var startTime = 0;
var count = 0;

var motionHistory = 60;

function getCount() {
	return count;
}

function getTime() {
	var dt = new Date();
	var s = dt.getTime() / 1000;
	return Math.floor(s);
}

function getDeltaSeconds() {
	if(! startTime) startTime = getTime();
	
	var now = getTime();
	var s = now - startTime;

	return s;
}

function getDeltaTimeString() {
	s = getDeltaSeconds();
	
	var m = Math.floor(s / 60); s = s % 60;
	var h = Math.floor(m / 60); m = m % 60;
	
	var str = s;
	if(s < 10) str = '0' + str;
	str = m + ':' + str;
	if(m < 10) str = '0' + str;
	str = h + ':' + str;
	return str;
}

var countCallback = function(n) {}
function setCountCallback(func) {
	if(func) countCallback = func;
}
function computeMotion(accel) {
	// record acceleration for drawing 
	if((maxX == 0) || (accel.x > maxX)) maxX = accel.x;
	if((minX == 0) || (accel.x < minX)) minX = accel.x;
	
	if((maxY == 0) || (accel.y > maxY)) maxY = accel.y;
	if((minY == 0) || (accel.y < minY)) minY = accel.y;
	
	if((maxZ == 0) || (accel.z > maxZ)) maxZ = accel.z;
	if((minZ == 0) || (accel.z < minZ)) minZ = accel.z;
	
	accels.push( accel );
	if(accels.length > motionHistory) accels.shift();
	
	// record motion for drawing
	var motion = (accel.x * accel.x + accel.y * accel.y + accel.z * accel.z);
	
	if((maxMotion == 0) || (motion > maxMotion)) maxMotion = motion;
	if((minMotion == 0) || (motion < minMotion)) minMotion = motion;
	
	// detect action
	if(motions.length > 0) {
		var detectLine = minMotion + (maxMotion - minMotion) * 0.3;
		var lastMotion = motions[ motions.length - 1 ];
		if(motion > detectLine && lastMotion < detectLine) {
            count ++;
            if(countCallback) countCallback(count);
        }
	}

	motions.push( motion );
	if(motions.length > motionHistory) motions.shift();
}

var motionCanvas = null;
function setMotionCanvas( canvas, w, h ) {
	motionCanvas = {
		id : canvas,
		w : w,
		h : h
	};
}
function drawMotionCurve() {
	if(! motionCanvas) return;
	
	var canvas = document.getElementById( motionCanvas.id );
	if(! canvas) return;
	
	var w = motionCanvas.w, h = motionCanvas.h;
	var scale = w / motionHistory;
	
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0,0, w, h);
	
	ctx.strokeStyle = 'gray';
	ctx.strokeRect(0, h *0.2, w, h *0.2);
	ctx.strokeRect(0, h *0.6, w, h *0.2);
	
	ctx.strokeStyle = "red";
	ctx.beginPath();
	for(var i=0; i<motions.length; i++) {
		var x = i * scale;
		var y = h * motions[i] / maxMotion;
		if(i == 0) {
			ctx.moveTo(x, y);
		} else {
			ctx.lineTo(x, y);
		} 		
	}
	ctx.stroke();
}

var xyzCanvas = null;
function setXYZCanvas( canvas, w, h ) {
	xyzCanvas = {
			id : canvas,
			w : w,
			h : h
		};
}
function drawXYZCurve() {
	if(! xyzCanvas) return;
	
	var canvas = document.getElementById( xyzCanvas.id );
	if(! canvas) return;
	
	var w =  xyzCanvas.w, h =  xyzCanvas.h;
	var h6 = h / 6.0;
	var scale = w / motionHistory;

	var ctx = canvas.getContext("2d");
	ctx.clearRect(0,0, w, h);
	
	ctx.strokeStyle = 'gray';
	ctx.beginPath();
	ctx.moveTo(0, h6); ctx.moveTo(w, h6 );
	ctx.moveTo(0, h6 *3); ctx.moveTo(w, h6 *3 );
	ctx.moveTo(0, h6 *5); ctx.moveTo(w, h6 *5 );
	ctx.stroke();
	
	ctx.strokeStyle = "red";
	ctx.beginPath();
	for(var i=0; i<accels.length; i++) {
		var x = i * scale;
		var y = h6 * (1 + accels[i].x/maxX);
		if(i == 0) {
			ctx.moveTo(x, y);
		} else {
			ctx.lineTo(x, y);
		} 		
	}
	ctx.stroke();

	ctx.strokeStyle = "green";
	ctx.beginPath();
	for(var i=0; i<accels.length; i++) {
		var x = i * scale;
		var y = h6 * (3 + accels[i].y/maxY);
		if(i == 0) {
			ctx.moveTo(x, y);
		} else {
			ctx.lineTo(x, y);
		} 		
	}
	ctx.stroke();
	
	ctx.strokeStyle = "blue";
	ctx.beginPath();
	for(var i=0; i<accels.length; i++) {
		var x = i * scale;
		var y = h6 * (5 + accels[i].z/maxZ);
		if(i == 0) {
			ctx.moveTo(x, y);
		} else {
			ctx.lineTo(x, y);
		} 		
	}
	ctx.stroke();
}

var requestAnimFrame = (function() {
	return window.requestAnimationFrame || window.webkitRequestAnimationFrame
			|| window.mozRequestAnimationFrame || window.oRequestAnimationFrame
			|| window.msRequestAnimationFrame || function(callback) {
				window.setTimeout(callback, 1000 / 60);
			};
})();

var drawing = false;
function drawCurve() {
	if(! drawing) return;
	
	drawMotionCurve();
	drawXYZCurve();
	
	requestAnimFrame( drawCurve );
}

var motionSuccessCallback = function(){};
var motionErrorCallback = function() {};

function setMotionCallback( okFunc, errFunc ) {
	motionSuccessCallback = okFunc;
	motionErrorCallback = errFunc;
}

if(! navigator.accelerometer) {
	console.log('device-motion simulation.')
	var onOkFunc = null;
	var onErrFunc = null;
	function motionSimutator(){
		if(onOkFunc) {
			var t = (new Date()).getTime();
			onOkFunc({
				x: 10 * Math.sin(t/6.0 * 3.1416926/180),
				y: 5 * Math.cos(t/6.0 * 3.1416926/180),
				z: 0,
				timestamp: t
			});
		}
	}
	navigator.accelerometer = {
			watchAcceleration : function(okFunc,errFunc,opt) { 
				onOkFunc = okFunc;
				onErrFunc = errFunc;
				var freq = (opt && opt.frequency) ? opt.frequency : 100;
				var watchId = window.setInterval(motionSimutator, freq);
				return watchId; 
			},
			clearWatch : function(watchID) {
				clearInterval(watchID);
			}
	};
}

// Start watching the acceleration
function startWatch( freq ) {
	if(! freq) freq = 100;
	
	count = 0;
	startTime = getTime();

    // Update acceleration frequency
    var options = { frequency: freq };
    watchID = navigator.accelerometer.watchAcceleration(function( accel ){
    	//onSuccess: Get a snapshot of the current acceleration
    	computeMotion( accel );
    	if(motionSuccessCallback) motionSuccessCallback( accel );
    }, function(){
    	// onError: Failed to get the acceleration
    	if(motionErrorCallback) motionErrorCallback();
    }, options);
    
	drawing = true;
	drawCurve();
}

// Stop watching the acceleration
function stopWatch() {
    if (watchID) {
        navigator.accelerometer.clearWatch(watchID);
        watchID = null;
    }
    
	drawing = false;
}

function isWatching() {
	return (watchID != null);
}

hotjs.motion = {
	setMotionCanvas : setMotionCanvas,
	setXYZCanvas : setXYZCanvas,
	setMotionCallback : setMotionCallback,
	setCountCallback : setCountCallback,
	startWatch : startWatch,
	stopWatch : stopWatch,
	isWatching : isWatching,
	
	getCount : getCount,
	getTime : getTime,
	getDeltaSeconds : getDeltaSeconds,
	getDeltaTimeString : getDeltaTimeString
};

})();