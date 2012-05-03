function Mat4() {
	this.values = new Float32Array(16);
	for(var i = 0; i < 16; i++) {
		this.values[i] = 0;
	}
}

Mat4.prototype.copy = function(){
	var newMat = new Mat4();
	for(var i = 0; i<16; i++){
		newMat.values[i] = this.values[i];
	}
	return newMat;
}

Mat4.prototype.loadIdentity = function() {
	for(var i = 0; i < 16; i++) {
		if(i % 5 == 0) {
			this.values[i] = 1;
		} else {
			this.values[i] = 0;
		}
	}

}

Mat4.prototype.rowAt = function(i) {
	return [this.values[i * 4], this.values[i * 4 + 1], this.values[i * 4 + 2], this.values[i * 4 + 3]];
}
Mat4.prototype.colAt = function(i) {
	return [this.values[i], this.values[i + 4], this.values[i + 8], this.values[i + 12]];
}

Mat4.prototype.multByMat = function(otherMat4) {
	var values = [];
	for(var i = 0; i < 4; i++) {
		for(var j = 0; j < 4; j++) {
			values[i * 4 + j] = vec4Dot(this.rowAt(i), otherMat4.colAt(j));
		}
	}
	this.values = values;
}

Mat4.prototype.matMultBy = function(otherMat4) {
	var values = [];
	for(var i = 0; i < 4; i++) {
		for(var j = 0; j < 4; j++) {
			values[i * 4 + j] = vec4Dot(otherMat4.rowAt(i), this.colAt(j));
		}
	}
	this.values = values;
}

Mat4.prototype.multVector = function(vector) {

	var vecRowForm = [vector.x, vector.y, vector.z, vector.w === undefined ? 1 : vector.w];

	vector.x = vec4Dot(this.rowAt(0), vecRowForm);
	vector.y = vec4Dot(this.rowAt(1), vecRowForm);
	vector.z = vec4Dot(this.rowAt(2), vecRowForm);
	vector.w = vec4Dot(this.rowAt(3), vecRowForm);
}

Mat4.prototype.loadFrustum = function(near, far, left, right, bottom, top) {
	if(left === undefined) {
		left = bottom = -1;
		right = top = 1;
	}
	var A = (right + left) / (right - left);
	var B = (top + bottom) / (top - bottom);
	var C = -((far + near) / (far - near));
	var D = -((2 * far * near) / (far - near));

	this.values = [(2 * near) / (right - left), 0, A, 0, 0, (2 * near) / (top - bottom), B, 0, 0, 0, C, D, 0, 0, -1, 0];
}

Mat4.prototype.loadTransMat = function(x, y, z) {
	this.values = [1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z, 0, 0, 0, 1];

}

Mat4.prototype.loadRotationMat = function(theta, x, y, z) {
	var size = x * x + y * y + z * z;
	if(size > 1) {
		x /= size;
		y /= size;
		z /= size;
	}
	var c = Math.cos(theta);
	var s = Math.sin(theta);
	this.values = [x * x * (1 - c) + c, x * y * (1 - c) - z * s, x * z * (1 - c) + y * s, 0, y * x * (1 - c) + z * s, y * y * (1 - c) + c, y * z * (1 - c) - x * s, 0, x * z * (1 - c) - y * s, y * z * (1 - c) + x * s, z * z * (1 - c) + c, 0, 0, 0, 0, 1];
};

Mat4.prototype.loadScaleMat = function(x,y,z){
	var otherMat = new Mat4();
	otherMat.values[0] = x;
	otherMat.values[5] = y;
	otherMat.values[10] = z;
	otherMat.values[15] = 1;
}

Mat4.prototype.rotate = function(theta, x, y, z) {
	var otherMat = new Mat4();
	otherMat.loadRotationMat(theta, x, y, z);
	this.matMultBy(otherMat);
}

Mat4.prototype.translate = function(x, y, z) {
	var otherMat = new Mat4();
	otherMat.loadTransMat(x, y, z);
	this.matMultBy(otherMat);
}

Mat4.prototype.scale = function(x,y,z){
	var otherMat = new Mat4();
	otherMat.loadScaleMat(x,y,z);
	this.matMultBy(otherMat);
}
var vec4Dot = function(vec1, vec2) {
	return vec1[0] * vec2[0] + vec1[1] * vec2[1] + vec1[2] * vec2[2] + vec1[3] * vec2[3];
}

