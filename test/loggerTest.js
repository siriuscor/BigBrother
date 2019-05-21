const winston = require('winston');
// var logger, proc;
var running = {};

var id = 0;
  var new_logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(info => {
            return `${info.timestamp} ${info.level}: ${info.message.toString().replace(/\n$/, '')}`;
        })
    )
  });
  new_logger.id = id++;
  console.log('new logger with id', new_logger.id);
  
  var fileTrans = new winston.transports.File({
    level: 'info',
    tailable: true,
    maxsize: 1024,
    maxFiles: 2,
    filename: 'test.log'
  });
  fileTrans._stream.id = new_logger.id;
  fileTrans._stream.on('error',  ()=>{});
  new_logger.add(fileTrans);

    process.on('uncaughtException', (e) => {
        console.error('uncaught exception', e.stack);
        require('fs').appendFileSync('test-err.log', e.stack ? e.stack: JSON.stringify(e));
        process.exit(1);
      });
      
    setInterval(()=> {
        for(let i = 0; i < 10; i ++)
    new_logger.info('keep logging long message' + '~'.repeat(1000));
    }, 1);
    





