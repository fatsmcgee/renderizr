var Scenes = {};

Scenes.spinningPyramid = {
	title:"Spinning pyramid",
	description:"Press left/right, up/down or 9/0 keys to rotate on the y,x, and z axes respectively",
	drawUpdate: 
	"(function() {\n\
	var vertShader = function(R,pt,uniform){\n\
		//transform from model view coordinates to eye coordinates\n\
		R.modelViewMat.multVector(pt);\n\
		//transform from camera(eye) to clip space with projection matrix)\n\
		R.projectionMat.multVector(pt);\n\
	}\n\
	var fragShader = function(R,pt,uniform){\n\
		pt.r = pt.r;\n\
		pt.g = pt.g;\n\
		pt.b = pt.b;\n\
	}\n\
	R.setVertexShader(vertShader);\n\
	R.setFragmentShader(fragShader);\n\
	var increment = {\n\
		x : 0,\n\
		y : 0,\n\
		z : 0\n\
	};\n\
	var timer = {\n\
		x : 0,\n\
		y : 0,\n\
		z : 0\n\
	};\n\
	var draw = function() {\n\
		increment.y += Number(KeysDown[KeyCodes.LEFT])*.01;\n\
		increment.y -= Number(KeysDown[KeyCodes.RIGHT])*.01;\n\
		increment.x += Number(KeysDown[KeyCodes.UP]) *.01;\n\
		increment.x -= Number(KeysDown[KeyCodes.DOWN]) *.01;\n\
		increment.z += Number(KeysDown[KeyCodes[9]]) * .01;\n\
		increment.z -= Number(KeysDown[KeyCodes[0]]) * .01;\n\
\n\
		R.clear();\n\
		R.modelViewMat.loadIdentity();\n\
		R.modelViewMat.rotate(timer.x,1,0,0);\n\
		R.modelViewMat.rotate(timer.y,0,1,0);\n\
		R.modelViewMat.rotate(timer.z,0,0,1);\n\
		\n\
		R.modelViewMat.translate(0,0,-1.40);\n\
\n\
\n\
		var theta1 = 0;\n\
		var theta2 =  (2 * Math.PI) / 3;\n\
		var theta3 = (4 * Math.PI) / 3;\n\
		var p1 = {\n\
			x : .25 * Math.cos(theta1),\n\
			y : -.2,\n\
			z : (.25 * Math.sin(theta1))\n\
		};\n\
		var p2 = {\n\
			x : .25 * Math.cos(theta2),\n\
			y : -.2,\n\
			z :  (.25 * Math.sin(theta2))\n\
		};\n\
		var p3 = {\n\
			x : .25 * Math.cos(theta3),\n\
			y : -.2,\n\
			z : (.25 * Math.sin(theta3))\n\
		};\n\
		p1.r = 255;\n\
		p2.g = 255;\n\
		p3.b = 255;\n\
\n\
		var p4 = {\n\
			x : 0,\n\
			y : .2,\n\
			z : 0\n\
		};\n\
		\n\
		p1.g = p1.b = p2.r = p2.b = p3.r = p3.g = p4.b = 0;\n\
\n\
		p4.r = p4.g = 255;\n\
		var elements =  [p1,p2,p3,p1,p4,p2,p1,p4,p3,p4,p2,p3];\n\
		R.drawElements(elements,RenderModes.Triangles);\n\
\n\
		timer.x += increment.x;\n\
		timer.y += increment.y;\n\
		timer.z += increment.z;\n\
		R.update();\n\
		}\n\
	return draw;})()"
}


Scenes.simpleTriangle = {
	title:"Simple Triangle",
	description:"Just a simple triangle",
	drawUpdate: "(function() {\n\
	var draw = function(){\n\
		R.clearColor(255,255,0);\n\
		var theta1 = 0;\n\
		var theta2 =  (2 * Math.PI) / 3;\n\
		var theta3 = (4 * Math.PI) / 3;\n\
		var p1 = {\n\
			x : .25 * Math.cos(theta1),\n\
			y : (.25 * Math.sin(theta1)),\n\
			r:255,g:0,b:0};\n\
		var p2 = {\n\
			x : .25 * Math.cos(theta2),\n\
			y :  (.25 * Math.sin(theta2)),\n\
			r:0,g:255,b:0};\n\
		var p3 = {\n\
			x : .25 * Math.cos(theta3),\n\
			y : (.25 * Math.sin(theta3)),\n\
			r:0,g:0,b:255};\n\
		p1.z = p2.z = p3.z = -1.5;\n\
		R.drawElements([p1,p2,p3],RenderModes.Triangles);\n\
		R.update();\n\
	}\n\
	return draw;})()"
}
Scenes.sphereTexture = {
	title:"Textured earth",
	description:"The earth is round. Images are not. Force them to be so against their will. ",
	drawUpdate: "(function() {\n\
	var yRot = 0;\n\
	var xRot = 0;\n\
	function pointFromPolar(theta,phi,r){\n\
		var y = r*Math.sin(phi);\n\
		var x = r*Math.cos(phi)*Math.cos(theta);\n\
		var z = r*Math.cos(phi)*Math.sin(theta);\n\
		return {x:x,y:y,z:z,theta:theta,phi:phi};\n\
	}\n\
	function getSpherePoints(r,xDivs,yDivs){\n\
		var bodyPts = [];\n\
		for(var i = 1; i<yDivs-1; i++){\n\
			var phi = -Math.PI/2 + (i*Math.PI)/yDivs;\n\
			var nextPhi = phi + Math.PI/yDivs;\n\
			for(var j = 0; j<xDivs; j++){\n\
				var theta = (2*Math.PI*j)/xDivs;\n\
				var nextTheta = theta + (2*Math.PI)/xDivs;\n\
				bodyPts.push(pointFromPolar(theta,phi,r));\n\
				bodyPts.push(pointFromPolar(theta,nextPhi,r));\n\
				bodyPts.push(pointFromPolar(nextTheta,nextPhi,r));\n\
				bodyPts.push(pointFromPolar(nextTheta,phi,r));\n\
			}\n\
		}\n\
		//The body can be drawn in quads, but the caps require triangles\n\
		var capPts = [];\n\
		var capPhi = -Math.PI/2 + Math.PI/yDivs;\n\
		for(var i = 0; i<xDivs;i++){\n\
			var theta = (2*Math.PI*i)/xDivs;\n\
			var nextTheta = theta + (2*Math.PI)/xDivs;\n\
			capPts.push(pointFromPolar(theta,capPhi,r));\n\
			capPts.push(pointFromPolar(nextTheta,capPhi,r));\n\
			capPts.push(pointFromPolar(0,-Math.PI/2,r));\n\
\n\
			capPts.push(pointFromPolar(theta,-capPhi,r));\n\
			capPts.push(pointFromPolar(nextTheta,-capPhi,r));\n\
			capPts.push(pointFromPolar(0,Math.PI/2,r));\n\
		}\n\
		return {body:bodyPts,cap:capPts};\n\
	}\n\
	function drawSphere(spherePts){\n\
		R.drawElements(spherePts.body,RenderModes.Quads);\n\
		R.drawElements(spherePts.cap,RenderModes.Triangles);\n\
	}\n\
\n\
	function fragShader(R,pt,uniform){\n\
		pt.r = (pt.theta%1)*255;\n\
		pt.g = (pt.phi%1)*255;\n\
		pt.b = 0;\n\
	}\n\
	R.setFragmentShader(fragShader);\n\
	var spherePts = getSpherePoints(.3,6,6);\n\
	var draw = function(){\n\
		yRot -= Number(KeysDown[KeyCodes.LEFT])*.05;\n\
		yRot += Number(KeysDown[KeyCodes.RIGHT])*.05;\n\
		xRot -= Number(KeysDown[KeyCodes.UP])*.05;\n\
		xRot += Number(KeysDown[KeyCodes.DOWN])*.05;\n\
		R.clearColor(0,255,255);\n\
		R.modelViewMat.loadIdentity();\n\
		R.modelViewMat.rotate(yRot,0,1,0);\n\
		R.modelViewMat.rotate(xRot,1,0,0);\n\
		R.modelViewMat.translate(0,0,-1.5);\n\
		drawSphere(spherePts);\n\
		R.update();\n\
	}\n\
	return draw;})()"
}
