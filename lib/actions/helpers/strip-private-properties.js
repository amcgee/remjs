var _ = require( 'lodash' );

module.exports = function( doc ) {
	return _.omit(doc, function(value, key) {
		return key[0] == '_' && key !== "_id"; // Strip private variables
	});
};