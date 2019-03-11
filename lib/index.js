var winston = require('winston');
var consts = require('./consts');
const logger = winston.createLogger({
    level: 'info',
    json: false,
    transports: [
        new winston.transports.File({ filename: consts.LOG_PATH, tailable: true, maxsize: 5*1024*1024, format: winston.format.simple()}),
        new winston.transports.Console({format: winston.format.simple()})
    ]
});

console.log = logger.info;
console.error = logger.error;

// include cli option
require('./bb');