const os = require('os');
const home = os.homedir();
const root = `${home}/.bb`;
const fs = require('fs');

if (!fs.existsSync(root)) fs.mkdirSync(root);

module.exports = {
    RPC_SOCK: `unix:///${root}/bb.sock`,
    PID_FILE: `${root}/bb.pid`,
    TITLE: 'BIGBRO',
    LOG_PATH: `${root}/bb.log`,
    CYCLE_INTERVAL: 2000,
};