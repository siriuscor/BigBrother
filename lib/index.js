var winston = require('winston');
var consts = require('./consts');
var format = winston.format;
const logger = winston.createLogger({
    level: 'info',
    format: format.combine(format.timestamp(), format.printf(({ level, message, label, timestamp }) => {
        return `${timestamp} ${level}: ${message}`;
    })),
    transports: [
        new winston.transports.File({ filename: consts.LOG_PATH, tailable: true, maxsize: 5*1024*1024, maxFiles: 2}),
        new winston.transports.Console()
    ]
});

console.log = function() {
    var args = Array.prototype.slice.call(arguments);
    logger.info(args.map((i)=> {return typeof i === 'object' ? JSON.stringify(i) : i.toString();}).join(' '));
};
console.error = function() {
    var args = Array.prototype.slice.call(arguments);
    logger.error(args.map((i)=> {return typeof i === 'object' ? JSON.stringify(i) : i.toString();}).join(' '));
};

process.on('uncaughtException', (e) => {
    console.error('uncaught exception', e.stack);
    process.exit(1);
});

// include cli option
require('./bb');