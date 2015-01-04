var REM = require('./core');
REM.Server = require('./util/server');
REM.serve = require('./util/serve');

REM.engine = {
	'nedb': require('./engines/nedb'),
	'mongodb': require('./engines/mongodb'),
	//'sql': require('./engines/sql'),
	'influxdb': require('./engines/influxdb')
};

module.exports = REM;