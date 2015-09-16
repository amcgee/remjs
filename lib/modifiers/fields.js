var _ = require('lodash');

var fieldsHandler = function( req ) {
    if ( req.method !== 'GET' || !req.query.fields ) {
        return null;
    }

    var options = {
        projection: {
            '_id': 0
        }
    };
    _.forEach( req.query.fields.split(","), function( f ) {
        options.projection[f] = 1;
    });
    return options;
};

module.exports = fieldsHandler;
