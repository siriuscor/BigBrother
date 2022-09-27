const daemon = require('./daemon');
const consts = require('./consts');
const rpc = require('axon-rpc');
const axon = require('./axon');
const fs = require('fs');

function startDaemon() {
    try {
        fs.unlinkSync(consts.RPC_SOCK.replace(/^unix:\/\//, ''));
    } catch(e) {
        console.error('sock file exists');  
    }
    
    serv();
}

function serv() {
    console.log(`BIG BROTHER Start at ${consts.RPC_SOCK}`);
    process.title = consts.TITLE;
    var rep = axon.socket('rep');
    var server = new rpc.Server(rep);
    rep.bind(consts.RPC_SOCK);

    function makeCallback(method) {
        return function(...args) {
            var callback = args.pop();
            try {
                callback(null, daemon[method].apply(daemon, args));
            } catch (e) {
                console.error(`execute ${method} error`, e);
                callback(e);
            }
        }
    }
    for(var method in daemon) {
        server.expose(method, makeCallback(method)); 
    }
}
startDaemon();