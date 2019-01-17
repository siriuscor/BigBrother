const forker = require('./forker');

function list() {
    return forker.list();
}

function start(id_or_file) {
    console.log('start process', id_or_file);
    return forker.start(id_or_file);
}

function stop(id) {
    console.log('stop process', id);
    return forker.stop_id(id);
}

function restart(id) {
    console.log('restart process', id);
    forker.stop_id(id);
    return forker.start(id);
}

module.exports = {
    list, start, stop, restart
};
