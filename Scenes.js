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
Scenes.simpleTexture = {
	title:"Simple Texture",
	description:"Simple example of a texture",
	drawUpdate: "(function() {\n\
	var newContext = document.createElement("canvas");\n\
	var draw = function(){\n\
		R.clearColor(0,255,255);\n\
		var p1 = {x:-.5,y:-.5};\n\
		var p2 = {x:-.5,y:.5};\n\
		var p3 = {x:.5,y:.5};\n\
		var p4 = {x:.5,y:-.5};\n\
		p1.r = p2.r = p3.r = p4.r = 255;\n\
		p1.z = p2.z = p3.z = p4.z = -1.5;\n\
		R.drawElements([p1,p2,p3,p4],RenderModes.Quads);\n\
		R.update();\n\
	}\n\
	return draw;})()"
}
