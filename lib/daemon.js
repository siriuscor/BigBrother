const forker = require('./forker');
// const watcher = require('./watcher');

function list() {
    // return [{
    //     id: 0,
    //     name: 'test',
    //     pid: 14499,
    //     status: 'running',
    //     cpu: '10%',
    //     mem: '10MB',
    //     restart: 10,
    //     uptime: '10m'
    // }];
    return forker.list();
}

function start(id_or_file) {
    console.log('start process', id_or_file);
    var id = parseInt(id_or_file);
    if (isNaN(id)) {
        return forker.start_file(id_or_file);
    } else {
        return forker.start_id(id);
    }
}

function stop(id) {
    console.log('stop process', id);
    return forker.stop_id(id);
}

function restart(id) {
    console.log('restart process', id);
    forker.stop_id(id);
    return forker.start_id(id);
}

module.exports = {
    list, start, stop, restart
};
