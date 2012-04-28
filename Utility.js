Utility = {
	ShallowCopy: function(src){
		var dst = {};
		for(var idx in src){
			dst[idx] = src[idx];
		}
		return dst;
	}
}
