function Renderer(canvas){
	this.canvas = canvas;
	this.ctx = canvas.getContext('2d');			
	this.imageData = this.ctx.createImageData(canvas.width, canvas.height);
	this.blankImageData = this.ctx.createImageData(canvas.width,canvas.height);
	this.depthMap = new Uint32Array(canvas.width * canvas.height);
	this.maxDepthMap = new Uint32Array(canvas.width * canvas.height);
	
	var maxInt = Math.pow(2,32)-1;
	for(var i = 0; i < this.maxDepthMap.length; i++) {
		this.maxDepthMap[i] = maxInt;
	}
	//blank image data considered to be fully opaque white
	for(var i = 0; i<this.blankImageData.data.length; i++){
		this.blankImageData.data[i] = this.blankImageData.data[i+1] = this.blankImageData.data[i+2] = 0;
		this.blankImageData.data[i+3] = 255;
	}
	
	this.restoreDefaults();
}

//set reasonable defaults for the renderer to use with its shaders and matrices
Renderer.prototype.restoreDefaults = function(){
	this.modelViewMat = new Mat4();
	this.modelViewMat.loadIdentity();
	this.projectionMat = new Mat4();
	this.projectionMat.loadFrustum(1,2);
	
	this.setFragmentShader(Renderer.defaultFragmentShader);
	this.setVertexShader(Renderer.defaultVertexShader);
}

Renderer.defaultVertexShader = function(R,pt,uniform){
	//transform from model view coordinates to eye coordinates
	R.modelViewMat.multVector(pt);
	//transform from camera(eye) to clip space with projection matrix
	R.projectionMat.multVector(pt);
	
}

Renderer.defaultFragmentShader = function(R,pt,uniform){
	pt.r = pt.r;
	pt.g = pt.g;
	pt.b = pt.b;
}

Renderer.prototype.setVertexShader = function(shaderFunc){
	this.vertexShader = shaderFunc;
}

Renderer.prototype.setFragmentShader = function(shaderFunc){
	this.fragmentShader = shaderFunc;
}

Renderer.prototype.setDefaultFragmentShader = function(){
	this.fragmentShader = Renderer.defaultFragmentShader;
}

Renderer.prototype.setDefaultVertexShader = function(){
	this.vertexShader = Renderer.defaultVertexShader;
}

Renderer.prototype.clearImageData = (function(){
	if( navigator.userAgent.toLowerCase().indexOf('chrome') > -1){
		return function(){
			var data = this.imageData.data;
			for(var i = 0; i<data.length; i++){
				data[i] = 0;
			}
		};
	}
	else{
		return function(){
			this.imageData.data.set(this.blankImageData.data,0,0);
		};
	}
})();

Renderer.prototype.clearColor = function(r,g,b){
	var data = this.imageData.data;
	for (var i = 0; i<=data.length; i+=4){
		data[i] = r;
		data[i+1] = g;
		data[i+2] = b;
		data[i+3] = 255;
	}
	this.clearDepthMap();
}

Renderer.prototype.clear = function(){
	this.clearImageData();
	//this.imageData.data.set(this.blankImageData.data,0,0);
	this.clearDepthMap();
}

Renderer.prototype.clearDepthMap = function(){
	this.depthMap.set(this.maxDepthMap,0);
}


Renderer.prototype.update = function(){
	this.ctx.putImageData(this.imageData,0,0);
}

RenderModes = {Triangles:0,TriangleFan:1,Quads:2};

Renderer.prototype.drawElements = function(vertices,mode){
	if(mode === undefined){
		mode = RenderModes.Triangles;
	}
	//allow user to pass objects that are equal to each other
	vertices = vertices.map(Utility.ShallowCopy);
	//first transform each element with the vertex shader and normalize it's w value'
	for(var i = 0; i<vertices.length; i++){
		var vert = vertices[i];
		this.vertexShader(this,vert,this.uniform);
		//vertex shader is responsible for model view and projection transformations
		//see defaultVertexShader for normal implementation
		//transform from clip space to NDC by dividing by w
		//NDC has -1 to 1 coordinates for x,y,and z
		//yes, -.5 z is visible! weird but openGL does it
		vert.x/=vert.w;
		vert.y/=vert.w;
		vert.z/=vert.w;
		
		//make depth a value that can be easily indexed in an array
		vert.depth = (vert.z+1)*2000;
		
		//finally convert from NDC coordinates to window coordinates
		vert.screenX = vert.x*this.canvas.width/2 + this.canvas.width/2;
		vert.screenY = this.canvas.height - (vert.y*this.canvas.height/2 + this.canvas.height/2);
	}
	//now rasterize the primitives based on the raster mode
	if(mode == RenderModes.Triangles){
		for(var i = 0; i<vertices.length; i+=3){
			this.drawTriangle(vertices[i],vertices[i+1],vertices[i+2]);
		}
	}
	else if (mode == RenderModes.Quads){
		//treat vertices a,b,c,d as two triangles abc and cad
		for(var i =0; i<vertices.length; i+=4){
			this.drawTriangle(vertices[i],vertices[i+1],vertices[i+2]);
			this.drawTriangle(vertices[i+2],vertices[i],vertices[i+3]);
		}
	}
}

Renderer.prototype.setUniform = function(uniformObj){
	this.uniform = uniformObj;
}

Renderer.prototype.drawTriangle = function(p1, p2, p3){ 
	var minX = Math.floor(Math.max(0,Math.min(p1.screenX, p2.screenX, p3.screenX,this.canvas.width-1)));
	var maxX = Math.floor(Math.min(this.canvas.width-1,Math.max(p1.screenX, p2.screenX, p3.screenX,0)));
	var minY = Math.floor(Math.max(0,Math.min(p1.screenY, p2.screenY, p3.screenY,this.canvas.height-1)));
	var maxY = Math.floor(Math.min(this.canvas.height-1,Math.max(p1.screenY, p2.screenY, p3.screenY,0)));
	var width = maxX - minX;
	var height = maxY - minY;
	
	var canvWidth = this.canvas.width;
	var canvHeight = this.canvas.height;
	var pixelData = this.imageData.data;
	//includes all interpolated data that will be passed to the fragment shader
	var interpolatedPoint = {};
	var fragmentShader = this.fragmentShader;
	var depthMap = this.depthMap;
	
	var uniform = this.uniform;
	for(var idx in p1){
		interpolatedPoint[idx] = p1[idx];
	}
	//reduce changes in barycentric coordinates as x/y increments to constants
	var b1Denominator = ((p2.screenY - p3.screenY) * (p1.screenX - p3.screenX) + (p3.screenX - p2.screenX) * (p1.screenY - p3.screenY));
	var b2Denominator = ((p2.screenY - p3.screenY) * (p1.screenX - p3.screenX) + (p3.screenX - p2.screenX) * (p1.screenY - p3.screenY));
	var b1 = ((p2.screenY - p3.screenY) * (minX- p3.screenX) + (p3.screenX - p2.screenX) * (minY - p3.screenY)) /b1Denominator;
	var b1ChangeOnYInc = (p3.screenX - p2.screenX)/b1Denominator;
	var b1ChangeOnXInc = (p2.screenY - p3.screenY)/b1Denominator;
	var b2 = ((p3.screenY - p1.screenY) * (minX - p3.screenX) + (p1.screenX - p3.screenX) * (minY - p3.screenY))/b2Denominator;
	var b2ChangeOnYInc = (p1.screenX-p3.screenX)/b2Denominator;
	var b2ChangeOnXInc = (p3.screenY-p1.screenY)/b2Denominator;			//var b1 = ((p2.screenY - p3.screenY) * (x - p3.screenX) + (p3.screenX - p2.screenX) * (y - p3.screenY)) / b1Denominator;
			//var b2 = ((p3.screenY - p1.screenY) * (x - p3.screenX) + (p1.screenX - p3.screenX) * (y - p3.screenY)) / b2Denominator;
	
	for(var x = minX; x < maxX; x++) {
		for(var y = minY; y < maxY; y++) {
			var b3 = 1 - b1 - b2;
			if(b1 >= 0 && b2 >= 0 && b3 >= 0) {
				var index = y * canvHeight * 4 + x * 4;
				var depthIndex = y * canvWidth + x;
				var depth = Math.floor(b1 * p1.depth + b2 * p2.depth + b3 * p3.depth);
				if(depth < depthMap[depthIndex]) {
					for(var idx in interpolatedPoint){
						interpolatedPoint[idx] = b1*p1[idx] + b2*p2[idx] + b3*p3[idx];
					}
					fragmentShader(this,interpolatedPoint,uniform);
					pixelData[index] = interpolatedPoint.r;
					pixelData[index + 1] = interpolatedPoint.g;
					pixelData[index + 2] = interpolatedPoint.b;
					pixelData[index + 3] = 255;
					if(b1 < .02 || b2 < .02 || b3 < .02) {
						pixelData[index] = pixelData[index + 1] = pixelData[index + 2] = 0;
					}
					
					depthMap[depthIndex] = depth;
				}
			}
			b1 += b1ChangeOnYInc;
			b2 += b2ChangeOnYInc;
		}
		b1 -= (b1ChangeOnYInc * (maxY-minY));
		b2 -= (b2ChangeOnYInc * (maxY-minY));
		b1 += b1ChangeOnXInc;
		b2 += b2ChangeOnXInc;
	}
}
