var _ = require('lodash');

var skipHandler = function( req ) {
	if ( req.method !== 'GET' || !req.query.skip )
		return null;

	var skip = null;
	try {
		skip = parseInt( req.query.skip );
	} catch (e) {
		return null;
	}
	var options = {
		before: function( cursor ) {
			return cursor.skip(skip);
		}
	}
	return options;
}

module.exports = skipHandler;