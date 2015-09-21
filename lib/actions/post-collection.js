var _ = require('lodash');
var stripPrivateProperties = require('./helpers/strip-private-properties.js');

var handler = function(req, res) {
    if ( !_.isObject( req.body ) ) {
        res.status(400).send("Invalid request body.");
    }
    if ( !req.rem.db.insert ) {
        return res.status(405).send("Method not allowed.");
    }

    req.body = stripPrivateProperties( req.body );
    var keys = _.keys(req.body);
    var badKeys = _.union(
    _.intersection(req.rem.resource.options.immutable_keys, keys)
    );

    if ( badKeys.length > 0 ) {
        return res.status( 400 ).send(
        "The following properties are immutable: " + badKeys.join( ", " ) );
    }
    var obj = _.extend( req.rem.resource.options.buildDefaults(req), req.body );

    req.rem.db.insert(obj, {}, function (err, newDoc) {
        if ( _.isArray(newDoc) ) {
            newDoc = newDoc[0];
        }
        if ( err ) {
            if ( err.errorType === 'uniqueViolated' ) {
                return res.status(400).send("Unique constraint violoted.");
            }
            console.log( "Error occurred creating resource, err: %s", err.errorType );
            return res.status(500).send("Something bad happened...");
        }
        console.log( "Successfully created document with ID '%s'", newDoc._id );
        res.status(201).send(newDoc);
    });
};

module.exports = {
    path: '/',
    method: 'post',
    type: 'create',
    handler: handler
};
