const forker = require('./forker');
const consts = require('./consts');

function list() {
    return forker.list();
}

function start(id_or_file) {
    console.log('start process', id_or_file);
    return forker.start(id_or_file);
}

function stop(id) {
    console.log('stop process', id);
    return forker.stop(id);
}

function restart(id) {
    console.log('restart process', id);
    return forker.restart(id);
}

function load(file) {
    console.log('load file', file);
    return forker.startFile(file);
}

function kill() {
    stop('all');
    setTimeout(process.exit, consts.CYCLE_INTERVAL + 2000); // wait check loop
}

module.exports = {
    list, start, stop, restart, load, kill,
};
