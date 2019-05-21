const winston = require('winston');
var spawn = require('child_process').spawn;
// var logger, proc;
var running = {};

var id = 0;
function start() {
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
    maxsize: 10 * 1024,
    maxFiles: 2,
    filename: 'test.log'
  });
  fileTrans._stream.id = new_logger.id;
  fileTrans._stream.on('error',  ()=>{});
  // console.log('listen error event', new_logger.id);
  new_logger.add(fileTrans);
  new_logger.on('error', ()=>{});

  let old_logger = running['logger'];
  // if (running['logger']) running['logger'].close();
  running['logger'] = new_logger;
  // console.log('replace logger with ', new_logger.id);

  if (old_logger) {
    old_logger.close();
    console.log('close old logger', old_logger.id);
  }
  let proc = spawn('yes', [], {stdio: ['ignore', 'pipe', 'pipe']});
  proc.stdout.on('data', () => {
    // console.log('logger with ', running['logger'].id);
    for(let i = 0; i < 20; i ++)
    running['logger'].info('keep logging long message' + '~'.repeat(1000));
  });
  running['proc'] = proc;
}
setInterval(() => {
  if (running['proc']) running['proc'].kill();
  start();
  console.log(process.memoryUsage()['heapUsed']);
}, 100);

process.on('uncaughtException', (e) => {
  console.error('uncaught exception', e.stack);
  require('fs').appendFileSync('test-err.log', e.stack ? e.stack: JSON.stringify(e));
  process.exit(1);
});


  // fileTrans._stream.on('error', (e) => {
  //   console.log(e);
  // });
// fileTrans.on('closed', () => {
//   console.log('closed');
//   logger.info('after closed');
// });



