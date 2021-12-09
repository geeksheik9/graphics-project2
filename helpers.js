function translate2D(tx,ty){
	translation = mat3(
		1, 0, tx,
		0, 1, ty,
		0, 0, 1)
	return translation
}

function scale2D(sx,sy){
	scale = mat3(
		sx, 0, 0,
		0, sy, 0,
		0, 0,  1
	)
	return scale
}

function deviceToWorld(x, y) {
	myVec = vec3(x, y, 1)
	tMat = translate2D(-8,-8)

	x1 = dot(tMat[0], myVec)
	y1 = dot(tMat[1], myVec)

	myVec2 = vec3(x,y,1)
	sMat = scale2D(1/512, 1/512)

	x2 = dot(sMat[0], myVec2)
	y2 = dot(sMat[1], myVec2)

	myVec3 = vec3(x2, y2, 1)
	sMat2 = scale2D(200,200)

	x3 = dot(sMat2[0], myVec3)
	y3 = dot(sMat2[1], myVec3)

	myVec4 = vec3(x3, y3, 1)
	tMat2 = translate2D(-100, -100)

	x4 = dot(tMat2[0], myVec4)
	y4 = dot(tMat2[1], myVec4)

	returnVec = vec3(x4, y4, 1)

	return returnVec
}

function worldToNDC(wx, wy){
	myVec = vec3(wx, wy, 1)
	sMat = scale2D(1/100, 1/100)

	xDot = dot(sMat[0], myVec)
	yDot = dot(sMat[1], myVec)

	returnVec = vec3(xDot, yDot, 1)
	return returnVec
}

function deviceToNDC(x, y) {
    worldVec = deviceToWorld(x,y);
    ndcVec = worldToNDC(worldVec[0], -worldVec[1]);
    return ndcVec
}

function translate3d (tx, ty, tz) {
	return mat4( 	
		vec4(1, 0, 0, tx),
		vec4(0, 1, 0, ty),
		vec4(0, 0, 1, tz),
		vec4(0, 0, 0, 1)
	);
}

function ortho(left, right, bottom, top, near, far){
	return mat4(
		vec4(2/(right-left),0,0,(-(right+left)/(right-left))),
		vec4(0,2/(top-bottom),0,(-(top+bottom)/(top-bottom))),
		vec4(0,0,-2/(far-near),((far+near)/(far-near))),
		vec4(0,0,0,1)
	)
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