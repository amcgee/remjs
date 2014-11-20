var _ = require('lodash');

var limitHandler = function( req ) {
	if ( req.method !== 'GET' || !req.query.limit )
		return null;

	var limit = null;
	try {
		limit = parseInt( req.query.limit );
	} catch (e) {
		return null;
	}
	var options = {
		before: function( cursor ) {
			return cursor.limit(limit);
		}
	}
	return options;
}

module.exports = limitHandler;