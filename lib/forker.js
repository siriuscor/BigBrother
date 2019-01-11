const child_process = require('child_process');
const spawn = child_process.spawn;
const exec = child_process.exec;
// const config = require('./config');
const logger = require('./logger');
const pidusage = require('pidusage');
const fs = require('fs');
const prettyBytes = require('pretty-bytes');

// var id = 0;
// [{
//     id: 0,
//     name: 'test',
//     pid: 14499,
//     status: 'running',
//     cpu: '10%',
//     mem: '10MB',
//     restart: 10,
//     uptime: '10m'
// }];
var running = [];

// forks.forEach((conf) => {
//     guard(conf);
// });

// function guard(confg) {

// }

function keepTrying(serviceConfig, retryInterval) {
    try {
        start(serviceConfig);
    } catch(e) {
        console.log("error:", serviceConfig["name"], e.toString());
        setTimeout(function() {
            keepTrying(serviceConfig, retryInterval);
        }, retryInterval);
    }
}

// function start_id(id) {
//     console.log('start id', id);
// }

function start_file(file) {
    var content = fs.readFileSync(file);
    var config = JSON.parse(content);
    if (Array.isArray(config)) {
        var id = running.length;
        config.forEach((conf) => {
            running.push({
                id: id,
                raw: conf,
                proc: null,
                status: 'starting',
                restart: 0,
                retryInterval: 5000,
            });
            start_id(id);
            id ++;
        });
    } else {
        throw new Error('config file parse error');
    }
    return config;
}

function start_id(id) {
    if (!running[id]) throw new Error('process not exists');
    var serviceConfig = running[id].raw;
    var name = serviceConfig['name'];
    var child = spawn('/bin/sh', ['-c', serviceConfig['start']], {cwd: serviceConfig['cwd'], stdio: ['ignore', 'pipe', 'pipe'] });
    console.log('start process ' + serviceConfig['name'] + ',pid:' + child.pid);
    running[id].proc = child;
    running[id].status = 'running';

    child.stdout.on('data', newLogger(serviceConfig.stdout, serviceConfig.logsize));
    child.stderr.on('data', newLogger(serviceConfig.stderr, serviceConfig.logsize));
    child.on('error', newLogger(serviceConfig.stderr, serviceConfig.logsize));

    child.on('exit', function(code, signal) {
        if (running[id].status === 'stopping') {
            running[id].status = 'stop';
            return;
        }
        running[id].restart += 1;
        running[id].status = 'stop';
        logger.log(`process ${name} exit, restarting`);
        setTimeout(() => {
            start_id(id);
        }, serviceConfig.retryInterval);
    });
}

function newLogger(path, size) {
    return () => {};
}

function stop_id(id) {
    if (!running[id]) throw new Error('process not exists');
    var serviceConfig = running[id].raw;
    running[id].status = 'stopping';
    try {
        console.log('stopping', serviceConfig['name']);
        if (serviceConfig['cwd']) process.chdir(serviceConfig['cwd']);
        if (serviceConfig['stop']) {
            child_process.execSync(serviceConfig['stop']);
        } else {
            if (running[id].proc) {
                running[id].proc.kill();
                running[id].proc.unref();
                running[id].proc = null;
                // console.log(running[id].proc);
            }
        }
    } catch(e) {
        console.log('stop process', serviceConfig['name'], e.toString());
    }
}

function list() {
    var result = [];
    for(var id in running) {
        var data = running[id];
        result.push({
            id: id,
            name: data.raw.name,
            pid: data.proc ? data.proc.pid : 'N/A',
            status: data.status,
            uptime: data.uptime,
            cpu: data.cpu !== undefined ? (data.cpu.toFixed(2) + '%') : 'N/A',
            mem: data.mem !== undefined ? prettyBytes(data.mem) : 'N/A',
            restart: data.restart
        });
    }
    return result;
}

setInterval(function () {
    for(var name in running) {
        if (!running[name].proc) {
            running[name].cpu = 'N/A';
            running[name].mem = 'N/A';
            running[name].uptime = 'N/A';
            return;
        }
        pidusage(running[name].proc.pid, function (err, stats) {
            if (err) {
                console.error(err);
                return;
            }
            // console.log(stats);
            running[name].cpu = stats.cpu;
            running[name].mem = stats.memory;
            running[name].uptime = stats.elapsed;
            // => {
            //   cpu: 10.0,            // percentage (from 0 to 100*vcore)
            //   memory: 357306368,    // bytes
            //   ppid: 312,            // PPID
            //   pid: 727,             // PID
            //   ctime: 867000,        // ms user + system time
            //   elapsed: 6650000,     // ms since the start of the process
            //   timestamp: 864000000  // ms since epoch
            // }
        });
    }
    
}, 10000);
// function start() {

// }

// function stop() {

// }

module.exports = {
    list, start_file, start_id, stop_id
};
