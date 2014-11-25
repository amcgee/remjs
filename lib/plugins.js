var _ = require( 'lodash' );

var defaultPlugins = ['authentication']

module.exports = function( resources, options ) {
	var plugins = [];
	_.forEach( defaultPlugins, function(name) {
		var plugin = require( './plugins/' + name )(resources, options);
		if ( plugin && _.isFunction( plugin ) )
			plugins.push( plugin );
	} );
	return plugins;
};