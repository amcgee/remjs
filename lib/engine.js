
var REMEngine = function() {
	BPromise.promisifyAll(this);
};

REMEngine.prototype.find = function( query, options, callback ) {
	var cursor = this.createFindCursor( query, options.projection || {} );
	if ( callback )
		this.commitCursor(cursor);
};