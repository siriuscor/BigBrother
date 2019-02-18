
const { createLogger, format, transports } = require('winston');
const winston = require('winston');

const logger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.printf(info => {
        return `${info.timestamp} [${info.level}]: ${info.message}`;
    })
  ),
//   transports: [new transports.Console({
//     level: 'info'
//   }),
//   new transports.Console({
//     level: 'error'
//   })]
});
// logger.add(new transports.Console({level:'info'}));
// // info: test message my string {}
// // logger.log('info', 'test message %s', 'my string');
// logger.info('something');
// logger.error('error');


// info: test message 123 {}
// logger.log('info', 'test message %d', 123);

// info: test message first second {number: 123}
// logger.log('info', 'test message %s, %s', 'first', 'second', { number: 123 });


setInterval(() => {
    console.log('running');
    console.error('error log 1');
    console.log(process.env);
}, 100);