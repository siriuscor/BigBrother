const axon = require('./axon');
var rpc = require('axon-rpc');
var consts = require('./consts');
const path = require('path');
const Table = require('cli-table');

var client;

function startClient(cb) {
    var req = axon.socket('req');
    client = new rpc.Client(req);
    client.sock.once('connect', function() {
        return cb(true);
    });
    client.sock.once('error', function(err) {
        console.error('connect error', err);
        return cb(false);
    });
    req.connect(consts.RPC_SOCK);
}

function stopClient() {
    client.sock.close();
}

function list(cmd) {
    client.call('ls', (err, result) => {
        if (err) {
            console.log('error', err);
            stopClient();
            return;
        }
        if (cmd && cmd.json) {
            console.log(result);
        } else {
            console.log(formatList(result));
        }
        stopClient();
    });
}

function kill() {
    client.call('kill', (err, result) => {
        if (err) {
            console.log('error', err);
            stopClient();
            return;
        }
        
        console.log('Big Brother is stopped');
        stopClient();
    });
}

function load(file) {
    var absolute_path = path.resolve(process.cwd(), file);
    client.call('start', absolute_path, (err, result) => {
        if (err) {
            console.error(err.toString());
            stopClient();
        } else {
            console.log('start process', absolute_path);
            list();
        }
    });
}

function start(id_or_name) {
    client.call('start', id_or_name, (err, result) => {
        if (err) {
            console.error(err.toString());
            stopClient();
        } else {
            console.log('start process', id_or_name);
            list();
        }
    });
}

function stop(id) {
    client.call('stop', id, (err, result) => {
        if (err) {
            console.error(err.toString());
            stopClient();
        } else {
            console.log('stop process', id);
            list();
        }
    });
}

function restart(id) {
    client.call('restart', id, (err, n) => {
        if (err) {
            console.error(err.toString());
            stopClient();
        } else {
            console.log('restart process', id);
            list();
        }
    });
}

function formatList(result) {
    let heads = ['id', 'name', 'pid', 'status','restart', 'uptime', 'cpu', 'mem'];
    let table = new Table({
        head: heads
    });
    
    // table.push(heads);
    result.forEach((p) => {
        var row = [];
        heads.forEach((title) => {
            if (p[title] === undefined) {
                row.push('N/A');
            } else {
                row.push(p[title]);
            }
        });
        table.push(row);
    });
    return table.toString();
}

module.exports = {
    startClient, list, start, stop, restart, kill, load
};
