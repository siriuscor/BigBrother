const child_process = require('child_process');
const spawn = child_process.spawn;
const pidusage = require('pidusage');
const filesize = require('file-size');
const fs = require('fs');
const utils = require('./utils');
const CYCLE_INTERVAL = 2000;
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

const STATUS = {
    STOP: 'stop',
    STARTING: 'starting',
    RUNNING: 'running',
    STOPPING: 'stopping',
    RETRYING: 'retrying'
};

var statusTransfer = {};
statusTransfer[`${STATUS.STOP}->${STATUS.RUNNING}`] = startProcess;
statusTransfer[`${STATUS.RUNNING}->${STATUS.STOP}`] = stopProcess;

function statusCheck() {
    for(let id in running) {
        if (running[id].status !== running[id].targetStatus) {
            transfer(running[id].status, running[id].targetStatus, id);
        }
    }
}

function transfer(fromStatus, toStatus, id) {
    let func = statusTransfer[`${fromStatus}->${toStatus}`];
    if (func) func(id);
}

setInterval(() => {
    statusCheck();
    resourceCheck();
}, CYCLE_INTERVAL);

function find(id) {
    if (id === 'all') return id;
    if (isNaN(parseInt(id)) && name_map[id] !== undefined) {
        return name_map[id];
    } else {
        return parseInt(id);
    }
}

function start(id) {
    var _id = find(id);
    if (_id === 'all') {
        running.forEach((p) => startId(p.id));
    } else {
        startId(_id);
    }
}

function startFile(file) {
    if (require.cache[file]) {
        console.error('cache exist', file);
        delete require.cache[file];
    }
    var config = require(file);
    if (!Array.isArray(config)) throw new Error('config file parse error');
    var id = running.length;
    config.forEach((conf) => {
        running.push({
            id: id,
            raw: conf,
            proc: null,
            status: STATUS.STOP,
            restart: 0,
        });
        name_map[conf.name] = id; // save name->id map
        startId(id++);
    });
    return config;
}

function startId(id) {
    if (!running[id]) throw new Error('process not exists');
    running[id].targetStatus = STATUS.RUNNING;
}

function startProcess(id) {
    console.log('start id:', id, 'with', running[id].raw);
    var serviceConfig = running[id].raw;
    var name = serviceConfig['name'];
    var stdout = makeRedirect(serviceConfig.stdout);
    var stderr = makeRedirect(serviceConfig.stderr);
    try {
        var child = spawn(serviceConfig['cmd'], serviceConfig['args'].split(' '), {
            cwd: serviceConfig['cwd'],
            stdio: ['ignore', stdout, stderr],
            env: Object.assign({}, process.env, serviceConfig['env'])
        });
        console.log('start process ' + serviceConfig['name'] + ',pid:' + child.pid);
        running[id].proc = child;
        running[id].status = STATUS.RUNNING;
        running[id].start_at = Date.now();

        child.on('error', function(e) {
            running[id].restart += 1;
            running[id].status = STATUS.STOP;
            console.log(`process ${name} exit with error:${e.toString()}, restarting`);
        });

        child.on('exit', function (code, signal) {
            running[id].restart += 1;
            running[id].status = STATUS.STOP;
            console.log(`process ${name} exit with code:${code},signal:${signal}, restarting`);
        });
    } catch (e) {
        console.log(`start process error: ${e.toString()}`);
        running[id].restart += 1;
    }
}

function makeRedirect(logConf) {
    if (!logConf || logConf === '/dev/null') {
        return 'ignore';
    } else {
        return fs.openSync(logConf.filename, 'w');
    }
}
function stop(id) {
    let _id = find(id);
    if (_id === 'all') {
        running.forEach((p) => stopId(p.id));
    } else {
        stopId(_id);
    }
}

function stopId(id) {
    if (!running[id]) throw new Error('process not exists');
    running[id].targetStatus = STATUS.STOP;
}

function stopProcess(id) {
    var serviceConfig = running[id].raw;
    if (running[id].status === STATUS.STOP) return;
    running[id].status = STATUS.STOPPING;
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
    } catch (e) {
        console.log('stop process', serviceConfig['name'], e.toString());
    }
}

function restart(id) {
    stop(id);
    stopProcess(find(id));
    return start(id);
} 

function list() {
    var result = [];
    for (var id in running) {
        var data = running[id];
        result.push({
            id: id,
            name: data.raw.name,
            pid: data.proc ? data.proc.pid : 'N/A',
            status: data.status,
            uptime: data.status === STATUS.RUNNING ? (utils.formatTime(Date.now() - data.start_at)) : 0,
            cpu: data.cpu !== undefined ? (data.cpu.toFixed(2) + '%') : 'N/A',
            mem: data.mem !== undefined ? filesize(data.mem).human() : 'N/A',
            restart: data.restart
        });
    }
    return result;
}

function resourceCheck() {
    for (let id in running) {
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
        });
    }
}

module.exports = {
    list,
    startFile,
    startId,
    stopId,
    stop,
    start,
    restart
};