var _ = require('lodash');

var modifiers = [
	require( './modifiers/fields' ),
	require( './modifiers/sort' ),
	require( './modifiers/limit' ),
	require( './modifiers/skip' )
]

var beforeIdentity = function( cursor ) {
	return cursor;
}
var afterIdentity = function( result ) {
	return result;
}
module.exports = function(options, req, res) {
	options = _.extend( {
		before: beforeIdentity,
		query: {},
		projection: {},
		after: afterIdentity
	}, options);

	_.forEach( modifiers, function( mod ) {
		var modOpts = mod( req );
		if ( !modOpts )
			return;
		if ( modOpts.before )
			options.before = _.compose( options.before, modOpts.before );
		if ( modOpts.query )
			options.query = _.extend( options.query, modOpts.query );
		if ( modOpts.projection )
			options.projection = _.extend( options.projection, modOpts.projection );
		if ( modOpts.after )
			options.after = _.compose( options.after, modOpts.after );
	})

	return options;
}