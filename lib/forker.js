const child_process = require('child_process');
const spawn = child_process.spawn;
const pidusage = require('pidusage');
var filesize = require('file-size');
const winston = require('winston');

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
var name_map = {};

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

function start(id_or_file) {
    var id = parseInt(id_or_file);
    if (isNaN(id)) {
        if (id === 'all') {
            running.forEach((p) => {
                if (p.status !== 'running') {
                    start_id(p.id);
                }
            });
            return;
        }
        if (name_map[id_or_file] !== undefined) {
            return start_id(name_map[id_or_file]);
        } else {
            return start_file(id_or_file);
        }
    } else {
        return start_id(id);
    }
}

function start_file(file) {
    if (require.cache[file]) {
        console.error('cache exist', file);
        delete require.cache[file];
    }
    var config = require(file);
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
            name_map[conf.name] = id; // save name->id map
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
    if (running[id].status === 'running') return;
    if (running[id].status === 'stopping') {
        setTimeout(() => {
            start_id(id);
        }, 200);
        return;
    }
    // process.nextTick(() => { start_id(id)});
    var serviceConfig = running[id].raw;
    var name = serviceConfig['name'];
    var child = spawn(serviceConfig['cmd'], serviceConfig['args'].split(' '), {cwd: serviceConfig['cwd'], stdio: ['ignore', 'pipe', 'pipe'], env: serviceConfig['env'] });
    console.log('start process ' + serviceConfig['name'] + ',pid:' + child.pid);
    running[id].proc = child;
    running[id].status = 'running';
    running[id].start_at = Date.now();

    var default_log_setting = {
        tailable: true,
        maxsize: 10*1024*1024
    };

    const logger = winston.createLogger({
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.printf(info => {
                // return `${info.timestamp} [${info.level}]: ${info.message}`;
                return info.message.toString().replace(/\n$/, '');
            })
        )
    });
    if (running[id].logger) running[id].logger.close(); // clean last logger
    running[id].logger = logger;

    if (serviceConfig.stdout !== '/dev/null') {
        serviceConfig.stdout.maxsize = parseReadableSize(serviceConfig.stdout.maxsize);
        logger.add(new winston.transports.File(Object.assign({}, {level: 'info'}, default_log_setting, serviceConfig.stdout)));
        child.stdout.on('data', logger.info);
    }

    if (serviceConfig.stderr !== '/dev/null') {
        serviceConfig.stderr.maxsize = parseReadableSize(serviceConfig.stderr.maxsize);
        logger.add(new winston.transports.File(Object.assign({}, {level: 'error'}, default_log_setting, serviceConfig.stderr)));
        child.stderr.on('data', logger.error);
        child.on('error', logger.error);
    }

    child.on('exit', function(code, signal) {
        if (running[id].status === 'stopping') {
            running[id].status = 'stop';
            return;
        }
        running[id].restart += 1;
        running[id].status = 'stop';
        console.log(`process ${name} exit, restarting`);
        setTimeout(() => {
            start_id(id);
        }, running[id].retryInterval);
    });
}

function stop_id(id) {
    if (id === 'all') {
        running.forEach((p) => {
            if (p.status === 'running') {
                stop_id(p.id);
            }
        });
        return;
    }
    if (name_map[id] !== undefined) {
        stop_id(name_map[id]);
        return;
    }
    if (!running[id]) throw new Error('process not exists');
    if (running[id].status === 'stopping' || running[id].status === 'stop') {
        return;
    }
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
            }
        }
    } catch(e) {
        console.log('stop process', serviceConfig['name'], e.toString());
    }
    // running[id].logger.close();
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
            uptime: data.status === 'running' ? (formatTime(Date.now() - data.start_at)) : 0,
            cpu: data.cpu !== undefined ? (data.cpu.toFixed(2) + '%') : 'N/A',
            mem: data.mem !== undefined ? filesize(data.mem).human() : 'N/A',
            restart: data.restart
        });
    }
    return result;
}

setInterval(function () {
    for(let id in running) {
        if (!running[id].proc) {
            delete running[id].cpu;
            delete running[id].mem;
            continue;
        }
        pidusage(running[id].proc.pid, function (err, stats) {
            if (err) {
                console.error(`pidusage error ${id} ${err.toString()}`);
                return;
            }
            running[id].cpu = stats.cpu;
            running[id].mem = stats.memory;
            // running[id].uptime = stats.elapsed;
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

function formatTime(timespan) {
    timespan = parseInt(timespan / 1000);
    const MIN = 60;
    const HOUR = 60 * 60;
    const DAY = 60 * 60 * 24;
    if (timespan < MIN) {
        return timespan + 's';
    } else if (timespan < HOUR) {
        return parseInt(timespan/MIN) + 'm';
    } else if (timespan < DAY) {
        return parseInt(timespan/HOUR) + 'h';
    } else {
        return parseInt(timespan/DAY) + 'D';
    }
}

function parseReadableSize(size) {
    if (!size) return null;
    if (!isNaN(size)) return size;
    if (!/^(\d*[.])?\d+\s*[KMG]B$/gi.test(size)) {
        return null;
    }
    const UNITS = {
        'KB': 1,
        'MB': 2,
        'GB': 3,
    };
    var match = size.toUpperCase().match(/^(\d*[.]?\d+)\s*([KMG]B)$/);
    return parseFloat(match[1]) * Math.pow(1024, UNITS[match[2]]);
}

module.exports = {
    list, start_file, start_id, stop_id, start
};
