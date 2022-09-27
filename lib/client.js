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

function callClient(...args) {
    var ok = args.pop();
    var common = (err, result) => {
        if (err) {
            console.log('error', err);
            stopClient();
            return;
        }
        ok(result);
        setTimeout(stopClient, 100);
    };
    args.push(common);
    client.call.apply(client, args);
}

function list(cmd) {
    callClient('list', (result) => {
        if (cmd && cmd.json) {
            console.log(JSON.stringify(result));
        } else {
            console.log(formatList(result));
        }
    });
}

function kill() {
    callClient('kill', (result) => {
        console.log('Big Brother is stopped');
    });
}

function load(file) {
    var absolute_path = path.resolve(process.cwd(), file);
    callClient('load', absolute_path, (result) => {
        console.log('start process', absolute_path);
        list();
    });
}

function start(id_or_name) {
    callClient('start', id_or_name, (result) => {
        console.log('start process', id_or_name);
        list();
    });
}

function stop(id) {
    callClient('stop', id, (result) => {
        console.log('stop process', id);
        list();
    });
}

function restart(id) {
    callClient('restart', id, (result) => {
        console.log('restart process', id);
        list();
    });
}

function formatList(result) {
    let heads = ['id', 'name', 'pid', 'status','restart', 'uptime', 'cpu', 'mem'];
    let table = new Table({
        head: heads
    });
    
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
