function Renderer(canvas){
	this.canvas = canvas;
	this.ctx = canvas.getContext('2d');			
	this.imageData = this.ctx.createImageData(canvas.width, canvas.height);
	this.depthMap = new Uint32Array(canvas.width * canvas.height);
	this.maxDepthMap = new Uint32Array(canvas.width * canvas.height);
	for(var i = 0; i < this.maxDepthMap.length; i++) {
		this.maxDepthMap[i] = 0;
	}
	this.viewerZ = 0;
	this.textures = [];
	this.modelViewMat = new Mat4();
	this.modelViewMat.loadIdentity();
	this.projectionMat = new Mat4();
	this.projectionMat.loadFrustum(1,2);
}

Renderer.prototype.addTexture = function(img){
	
	/*var canv2 = document.createElement("canvas");
	canv2.width = img.width;
	canv2.height = img.height;
	var ctx2 = canv2.getContext('2d');
	ctx2.drawImage(img,0,0);*
	var imData = ctx2.getImageData(0,0,canv2.width,canv2.height);*/
	imData = this.ctx.createImageData(256,256);
	for(var i = 0; i<imData.data.length; i+=4){
		var row = i/(256*4);
		var col = i%(256*4);
		if((Math.floor(row/32)%2)^ (Math.floor(col/32)%2) == 1){
			imData.data[i] = imData.data[i+1] = imData.data[i+2] = 0;
			imData.data[i+3] = 255;
		}
	}
	this.textures.push(imData);
	return this.textures.length -1;
}

Renderer.prototype.worldToScreen = function(pt){
	//transform from model view coordinates to eye coordinates
	var transPoint = this.modelViewMat.multVec(pt);
	//transform from camera(eye) to clip space with projection matrix
	var transPoint = this.projectionMat.multVec(transPoint);
	//transform from clip space to NDC by dividing by w
	//NDC has -1 to 1 coordinates for x,y,and z
	transPoint.x/=transPoint.w;
	transPoint.y/=transPoint.w;
	transPoint.z/=transPoint.w;
	//transform from NDC to window coordinates
	transPoint.x = transPoint.x*this.canvas.width + this.canvas.width/2;
	transPoint.y = this.canvas.height - (transPoint.y*this.canvas.height + this.canvas.height/2);
	//take z from [-1,1] space to [0,2000] for greater depth fidelity on an integer basis
	transPoint.z = (transPoint.z+1) * 2000; 
	
	//copy the parameters provided by the user
	transPoint.r = pt.r;
	transPoint.g = pt.g;
	transPoint.b = pt.b;
	transPoint.tx = pt.tx;
	transPoint.ty = pt.ty;
	
	return transPoint;
	
}
		
Renderer.prototype.queueTriangle = function(p1, p2, p3) {
	this.triangles.push([this.worldToScreen(p1), this.worldToScreen(p2), this.worldToScreen(p3)]);
}

Renderer.prototype.clearImageData = function() {
	for(var i = 0; i < this.imageData.data.length; i++) {
		this.imageData.data[i] = 0;
	}
}

Renderer.prototype.beginRender = function() {
	this.clearImageData();
	this.depthMap.set(this.maxDepthMap, 0);
	this.triangles = [];
}

Renderer.prototype.endRender = function() {
	for(var i in this.triangles) {
		var tris = this.triangles[i];
		this.drawTriangle(tris[0], tris[1], tris[2],i%2==0);
	}
	this.ctx.putImageData(this.imageData, 0, 0);
}

Renderer.prototype.drawTriangle = function(p1, p2, p3){ //,useTexture) {
	var minX = Math.floor(Math.min(p1.x, p2.x, p3.x,this.canvas.width-1));
	var maxX = Math.floor(Math.max(p1.x, p2.x, p3.x,0));
	var minY = Math.floor(Math.min(p1.y, p2.y, p3.y,this.canvas.height-1));
	var maxY = Math.floor(Math.max(p1.y, p2.y, p3.y,0));
	var width = maxX - minX;
	var height = maxY - minY;
	
	var canvWidth = this.canvas.width;
	var canvHeight = this.canvas.height;
	var pixelData = this.imageData.data;

	for(var x = minX; x < maxX; x++) {
		for(var y = minY; y < maxY; y++) {
			var b1 = ((p2.y - p3.y) * (x - p3.x) + (p3.x - p2.x) * (y - p3.y)) / ((p2.y - p3.y) * (p1.x - p3.x) + (p3.x - p2.x) * (p1.y - p3.y));
			var b2 = ((p3.y - p1.y) * (x - p3.x) + (p1.x - p3.x) * (y - p3.y)) / ((p2.y - p3.y) * (p1.x - p3.x) + (p3.x - p2.x) * (p1.y - p3.y));
			var b3 = 1 - b1 - b2;
			var index = y * canvHeight * 4 + x * 4;
			var depthIndex = y * canvWidth + x;
			var depth = Math.floor(b1 * p1.z + b2 * p2.z + b3 * p3.z);
			if((b1 >= 0 && b1 <= 1) && (b2 >= 0 && b2 <= 1) && (b3 >= 0 && b3 <= 1)) {

				if(depth > this.depthMap[depthIndex]) {
					pixelData[index] = b1 * p1.r + b2 * p2.r + b3 * p3.r;
					pixelData[index + 1] = b1 * p1.g + b2 * p2.g + b3 * p3.g;
					pixelData[index + 2] = b1 * p1.b + b2 * p2.b + b3 * p3.b;
					pixelData[index + 3] = 255;
					if(b1 < .02 || b2 < .02 || b3 < .02) {
						pixelData[index] = pixelData[index + 1] = pixelData[index + 2] = 0;
					}
					/*if(useTexture ){
						var tx = Math.floor(b1*p1.tx + b2*p2.tx + b3*p3.tx);
						var ty = Math.floor(b1*p1.ty + b2*p2.ty + b3*p3.ty);
						var texIndex = Math.floor(ty*256*4 + tx*4);
						this.imageData.data[index] = this.textures[0].data[texIndex];
						this.imageData.data[index+1] = this.textures[0].data[texIndex+1];
						this.imageData.data[index+2] = this.textures[0].data[texIndex+2];
						this.imageData.data[index+3] = this.textures[0].data[texIndex+3];
					}*/
					this.depthMap[depthIndex] = depth;
				}
			}
		}
	}
}
