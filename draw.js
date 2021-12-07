
// some globals
var gl;

var delay = 100;
var iBuffer;
var vBuffer;
var colorBuffer;
var program;

var vertexColors = [];

var eye = vec3(0,0,1);
var at = vec3(0,0,-1);
var up = vec3(0,1,0);

var rotating = false
var theta = 0;
//considering an on update to set prev to current and then keep moving it based on that+

var prevState = {
	mouse: {
		x: 0,
		y: 0
	},
	quaternion: vec4(0,-1,0,0)
}

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
	mvmLoc = gl.getUniformLocation(program, 'mvm');
	perspectiveLoc = gl.getUniformLocation(program, 'perspective');
	quaternionLoc = gl.getUniformLocation(program, 'q');

	iBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(teapot_indices), gl.STATIC_DRAW);

	vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(teapot_vertices), gl.STATIC_DRAW);
	vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

    addColors();

	colorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(vertexColors), gl.STATIC_DRAW)
	var vColor = gl.getAttribLocation(program, "vColor");
	gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0 , 0);
	gl.enableVertexAttribArray(vColor)

	gl.clearDepth(1.0);
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);

    render();
};

function addColors(){
    for(let i = 0; i < teapot_vertices.length; i++){
        vertexColors.push([Math.random(), Math.random(), Math.random(), 1])
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

function createPerspective(left, right, bottom, top, near, far) {
	frustumMatrix = mat4(vec4(1, 0, 0, (left+right)/2),
                         vec4(0, 1, 0, (bottom + top)/2),
                         vec4(0, 0, 1, 0),
                         vec4(0, 0, 0, 1)
                         );
    perspectiveMatrix = mat4(vec4(near, 0, 0, 0),
                             vec4(0, near, 0, 0),
                             vec4(0, 0, 1, 0),
                             vec4(0, 0, -1, 0)
                             );
    scaleMatrix = mat4(vec4(2/(right-left), 0, 0, 0),
                       vec4(0, 2/(top-bottom), 0, 0),
                       vec4(0, 0, 1, 0),
                       vec4(0, 0, 0, 1)
                       );
    mappingDepth = mat4(vec4(1, 0, 0, 0),
                        vec4(0, 1, 0, 0),
                        vec4(0, 0, -(far + near)/(far-near), (2*far*near)/(near-far)),
                        vec4(0, 0, -1, 0 )
                        );

    return mult(scaleMatrix, mult(perspectiveMatrix, mult(mappingDepth, frustumMatrix)));
}

function render() {
	// this is render loop
	// clear the display with the background color
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	gl.uniformMatrix4fv(mvmLoc, false, flatten(lookAt(eye, at, up)));
	gl.uniformMatrix4fv(perspectiveLoc, false, flatten(createPerspective(-100, 100, -100, 100, 100, -100)));
	gl.uniform4fv(quaternionLoc, prevState.quaternion)
    gl.drawElements(gl.TRIANGLES, teapot_indices.length, gl.UNSIGNED_SHORT, 0);

    setTimeout(
        function (){requestAnimFrame(render);}, delay
    );
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
		prevPoint =  vec3(prevNDC[0], prevNDC[1], prevZ);

		posX = event.pageX;
		posY = event.pageY;
		ndcVec = deviceToNDC(posX, posY);
		z = calcZUsingUnitSphere(ndcVec[0], ndcVec[1]);
		trackBallPoint = vec3(ndcVec[0], ndcVec[1], z);

		rotationAxis = cross(prevPoint, trackBallPoint);

		theta += 2
		w = Math.cos(Math.PI/theta) + Math.sin(Math.PI/theta);

		prevState.quaternion = vec4(rotationAxis[0], rotationAxis[1], rotationAxis[2], w)
	}
}

function calcZUsingUnitSphere(x, y){
	r = 1;

	d = calcDistance(x,y)
	console.log(d)
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