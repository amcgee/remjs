var _ = require('lodash');
var traverse = require('traverse');

function nullifyUndefinedFilterItems(filter) {
    return traverse(filter).map(function(x) {
        return x || null;
    });
}


var PermissionsManager = function(resource) {
    this.resource = resource;
    if ( !resource.options.permissions ) {
        this.defaults = this.anonymous_permissions = ['create','read','update','delete'];
    }
    else {
        this.defaults =
        resource.options.permissions.defaults || ['create','read','update','delete'];
        this.anonymous_permissions = resource.options.permissions.anonymous || [];
    }
};

PermissionsManager.prototype.apply = function(action, req, res, next) {
    var anonymous = !req.rem.identity;
    var permissions = ( anonymous )? this.anonymous_permissions : this.defaults;
    if ( _.isArray(permissions) && _.contains( permissions, action ) ) {
        return next();
    } else if ( _.isObject(permissions) && _.has( permissions, action ) ) {
        var permission = ( _.isArray(permissions[action]) ? permissions[action] : [ permissions[action] ] );
        if ( _.any( permission, function( condition ) {
            var result = this.testCondition( req.rem.identity, condition );
            if ( _.isObject( result ) ) {
                req.rem.permission_filter = nullifyUndefinedFilterItems( result );
                result = true;
            }

            return result? true : false;
        }.bind(this) ) ) {
            return next();
        }
    }

    if ( anonymous ) {
        return res.status(401).set('WWW-Authenticate','Bearer').send("Unauthorized.");
    }
    else {
        return res.status(403).send("Insufficient permissions.");
    }
};

PermissionsManager.prototype.testCondition = function( identity, condition ) {
    if ( _.isFunction( condition ) ) {
        condition = condition(identity);
    }

    if ( _.isObject( condition ) ) {
        return condition;
    }
    if ( _.isString( condition ) ) {
        var filter = {};
        filter[condition] = true;
        return filter;
    }
    else if ( condition ) { //test truthiness
        return true;
    }
    return false;
};

module.exports = PermissionsManager;
