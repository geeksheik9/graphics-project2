
// some globals
var gl;

var delay = 100;
var iBuffer;
var vBuffer;
var colorBuffer;
var program;

var vertexColors = [];

var eye = vec3(0,0,1);
var at = vec3(0,0,0);
var up = vec3(0,1,0);

var rotating = false
var theta = 0;
//considering an on update to set prev to current and then keep moving it based on that+

var prevState = {
	mouse: {
		x: 0,
		y: 0
	},
	quaternion: vec4(0,1,0,0)
}

var light = {
	Position: vec4(1.0,1.0,-1.0,0.0),
	Ambient: vec4(0.8,0.8,0.8,1.0),
	Diffuse: vec4(1.0,1.0,1.0,1.0),
	Specular: vec4(0.0,0.0,0.0,1.0)
}

var material = {
	Ambient: vec4(1.0,1.0,1.0,1.0),
	Diffuse: vec4(1.0,1.0,1.0,1.0),
	Specular: vec4(1.0,1.0,1.0,1.0),
	Shininess: 100.0
}

var geometry;

window.onload = function init() {

	// get the canvas handle from the document's DOM
    var canvas = document.getElementById( "gl-canvas" );

	canvas.addEventListener("mousemove", rotateByMouse, false);
	canvas.addEventListener("mousedown", mouseDown, false);
	canvas.addEventListener("mouseup", mouseUp, false);

	// initialize webgl
    gl = WebGLUtils.setupWebGL(canvas);
	// check for errors
    if ( !gl ) { 
		alert("WebGL isn't available"); 
	}

    // set up a viewing surface to display your image
    gl.viewport(0, 0, canvas.width, canvas.height);

	// clear the display with a background color 
	// specified as R,G,B triplet in 0-1.0 range
    gl.clearColor( 0.5, 0.5, 0.5, 1.0 );

    //  Load shaders -- all work done in init_shaders.js
    program = initShaders(gl, "vertex-shader", "fragment-shader");

	// make this the current shader program
    gl.useProgram(program);

	// Get a handle to theta  - this is a uniform variable defined 
	// by the user in the vertex shader, the second parameter should match
	// exactly the name of the shader variable
	colorLoc = gl.getUniformLocation(program, "vertColor");
	viewLoc = gl.getUniformLocation(program, 'view');
	perspectiveLoc = gl.getUniformLocation(program, 'perspective');
	quaternionLoc = gl.getUniformLocation(program, 'q');

	geometry = createTeapotGeometry(5);

	vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(geometry[0]), gl.STATIC_DRAW);
	vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

   	//addColors();

	console.log(geometry[1]);
	normalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(geometry[1]), gl.STATIC_DRAW);
	normalLoc = gl.getUniformLocation(program, 'vNormal');
	gl.vertexAttribPointer(normalLoc, 3, gl.Float, false, 0,0);
	gl.enableVertexAttribArray(normalLoc);

	/*colorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(vertexColors), gl.STATIC_DRAW)
	var vColor = gl.getAttribLocation(program, "vColor");
	gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0 , 0);
	gl.enableVertexAttribArray(vColor)*/


	gl.clearDepth(1.0);
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);

    render();
};

function addColors(){
    for(let i = 0; i < geometry[0].length; i++){
        vertexColors.push([Math.random(), 0.5, 0.5, 1])
    }
}

function lookAt(eye, at, up){
	n = normalize(subtract(at , eye));
    u = cross(n , normalize(up));
    v = cross(u , n);
    cam = mat4(
		vec4(u[0], u[1], u[2], 0),
        vec4(v[0], v[1], v[2], 0),
        vec4(n[0], n[1], n[2], 0),
        vec4(0 , 0 , 0 , 1)
		);

    return mult(cam, translate3d(-eye[0], -eye[1], -eye[2]));
}

function render() {
	// this is render loop
	// clear the display with the background color
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	
	gl.uniformMatrix4fv(viewLoc, false, flatten(lookAt(eye, at, up)));
	gl.uniformMatrix4fv(perspectiveLoc, false, flatten(ortho(-5,5,-5,5,50,-50)));
	gl.uniform4fv(quaternionLoc, prevState.quaternion)
    //gl.drawElements(gl.TRIANGLES, teapot_indices.length, gl.UNSIGNED_SHORT, 0);
	//gl.bufferData(gl.ARRAY_BUFFER, flatten(geometry[0]), gl.STATIC_DRAW);
	lightX = document.getElementById("lightX").value/100;
	lightY = document.getElementById("lightY").value/100;
	lightZ = document.getElementById("lightZ").value/100;

	light.Position = vec4(lightX, lightY, lightZ, 1.0);
	
	var ambientProd = mult(light.Ambient, material.Ambient);
	var diffuseProd = mult(light.Diffuse, material.Diffuse);
	var specularProd = mult(light.Specular, material.Specular);
	gl.uniform4fv(gl.getUniformLocation(program, "ambientProd"), flatten(ambientProd));
	gl.uniform4fv(gl.getUniformLocation(program, "diffuseProd"), flatten(diffuseProd));
	gl.uniform4fv(gl.getUniformLocation(program, "specularProd"), flatten(specularProd));
	gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(light.Position));
	gl.uniform1f(gl.getUniformLocation(program, "shininess"), material.Shininess);


	gl.drawArrays(gl.TRIANGLES, 0, 4800);

    /*setTimeout(
        function (){requestAnimFrame(render);}, delay
    );*/
}

function mouseDown(event){
	rotating = true;
	prevState.mouse.x = event.pageX;
	prevState.mouse.y = event.pageY;
}

function mouseUp(event){
	rotating = false;
	prevState.mouse.x = event.pageX;
	prevState.mouse.y = event.pageY;
}

function rotateByMouse(event){
	if(rotating){
		prevNDC = deviceToNDC(prevState.mouse.x, prevState.mouse.y);
		prevZ = calcZUsingUnitSphere(prevNDC[0], prevNDC[1]);
		prevPoint =  vec3(prevNDC[0], prevNDC[1], -prevZ);

		posX = event.pageX;
		posY = event.pageY;
		ndcVec = deviceToNDC(posX, posY);
		z = calcZUsingUnitSphere(ndcVec[0], ndcVec[1]);
		trackBallPoint = vec3(ndcVec[0], ndcVec[1], -z);

		rotationAxis = cross(prevPoint, trackBallPoint);

		theta += 2
		w = Math.cos(Math.PI/theta) + Math.sin(Math.PI/theta);

		prevState.quaternion = vec4(rotationAxis[0], rotationAxis[1], rotationAxis[2], w)
	}
	render();
}

function calcZUsingUnitSphere(x, y){
	r = 1;

	d = calcDistance(x,y)
	if(d > 1) {
		x = x/d
		y = y/d
	}

	value = r*r - x*x - y*y;
	if(value < 0.001){
		value = 0.00001;
	}

	z = Math.sqrt(value)

	return z
}

function calcDistance(x,y){
	return Math.sqrt((0-x)*(0-x) + (0-y)*(0-y))
}

function makeQuaternionMatrix(q){
	return mat4(
		vec4(
			2 * (q[3] * q[3] + q[0] * q[0]) - 1, 
			2 * (q[0] * q[1] - q[3] * q[2]),
			2 * (q[0] * q[2] + q[3] * q[1]),
			0
		),
		vec4(
			2 * (q[0] * q[1] + q[3] * q[2]),
			2 * (q[3] * q[3] + q[1] * q[1]) - 1,
			2 * (q[1] * q[2] - q[3] * q[0]),
			0
		),
		vec4(
			2 * (q[0] * q[2] - q[3] * q[1]),
			2 * (q[1] * q[2] + q[3] * q[0]),
			2 * (q[3] * q[3] + q[2] * q[2]) - 1,
			0
		),
		vec4(
			0,0,0,1
		),
	)
}