const daemon = require('./daemon');
const consts = require('./consts');
const rpc = require('axon-rpc');
const axon = require('./axon');

function startDaemon() {
    serv();
}

function serv() {
    console.log(`BIG BROTHER Start at ${consts.RPC_SOCK}`);
    process.title = consts.TITLE;
    var rep = axon.socket('rep');
    var server = new rpc.Server(rep);
    rep.bind(consts.RPC_SOCK);
    server.expose('ls', function(fn){
        fn(null, daemon.list());
    });

    server.expose('start', function(id_or_file, fn) {
        try {
            fn(null, daemon.start(id_or_file));
        } catch (e) {
            console.error('start error', e);
            fn(e);
        }
    });

    server.expose('stop', function(id, fn) {
        try {
            fn(null, daemon.stop(id));
        } catch (e) {
            console.error('stop error', e);
            fn(e);
        }
    });

    server.expose('restart', function(id, fn) {
        try {
            fn(null, daemon.restart(id));
        } catch (e) {
            console.error('restart error', e);
            fn(e);
        }
    });

    server.expose('kill', function(fn) {
        daemon.stop('all');
        fn(null);
        process.exit();
    });
}
startDaemon();