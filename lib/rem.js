var REM = require('./core');
REM.Server = require('./util/server');
REM.serve = require('./util/serve');

var delayLoad = function(module) {
	return function() {
		return require(module).apply(null, arguments);
	};
};
REM.engine = {
	'nedb': delayLoad('./engines/nedb'),
	'mongodb': delayLoad('./engines/mongodb'),
	//'sql': delayLoad('./engines/sql'),
	'influxdb': delayLoad('./engines/influxdb')
};

module.exports = REM;