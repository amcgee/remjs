var _ = require('lodash');

var sortHandler = function( req ) {
    if ( req.method !== 'GET' || !req.query.sort ) {
        return null;
    }

    var sortOrders = {};
    _.forEach( req.query.sort.split(","), function( s ) {
        if ( s[0] === '-' ) {
            sortOrders[s.substr(1)] = -1;
        }
        else {
            sortOrders[s] = 1;
        }
    });
    var options = {
        before: function( cursor ) {
            return cursor.sort(sortOrders);
        }
    };
    return options;
};

module.exports = sortHandler;
