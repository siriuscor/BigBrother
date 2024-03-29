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

console.log = function(...args) {
    logger.info(args.map((i)=> typeof i === 'object' ? JSON.stringify(i) : i).join(' '));
};
console.error = function(...args) {
    logger.error(args.map((i)=> typeof i === 'object' ? JSON.stringify(i) : i).join(' '));
};

process.on('uncaughtException', (e) => {
    require('fs').appendFileSync(consts.LOG_PATH, e.stack ? e.stack : JSON.stringify(e));
    process.exit(1);
});