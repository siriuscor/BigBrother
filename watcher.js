var child_process = require('child_process');
var spawn = child_process.spawn;
var fs = require('fs');

console.log("Cassia Daemon is starting...");

var pid_file = "/tmp/cassia_daemon.pid";
fs.writeFileSync(pid_file, process.pid);

var running = {};

var services = [
    {name : "nordic-demo", path : "node", args: ["index.js"], pwd: `/home/cassia/nordic`, io:'inherit'},
];

for (var i = 0; i < services.length; i ++) {
    var serviceConfig = services[i];
    keepTrying(serviceConfig, 5000)
};

function keepTrying(serviceConfig, retryInterval) {
    try {
        start(serviceConfig);
    } catch(e) {
        console.log("error:", serviceConfig["name"], e.toString())
        setTimeout(function() {
            keepTrying(serviceConfig, retryInterval);
        }, retryInterval);
    }
}

function start(serviceConfig) {
    stop(serviceConfig);// stop first
    if (serviceConfig['pwd']) process.chdir(serviceConfig['pwd']);
    var child = spawn(serviceConfig["path"], serviceConfig["args"], { stdio: serviceConfig['io'] });
    console.log("start process " + serviceConfig['name'] + ",pid:" + child.pid);
    running[serviceConfig["name"]] = child;

    child.on("error", function(e) {
        console.log("process " + serviceConfig['name'] + " error", e.toString());
    })
    child.on("exit", function() {
        console.log("process " + serviceConfig['name'] + " exit", arguments);
        start(serviceConfig);
    });
}

function stop(serviceConfig) {
    try {
        console.log("stopping", serviceConfig["name"]);
        if (serviceConfig['pwd']) process.chdir(serviceConfig['pwd']);
        if (serviceConfig['stop']) {
            child_process.execSync(serviceConfig['stop']);
        } else {
            if (running[serviceConfig['name']]) {
                var child = running[serviceConfig['name']];
                child.kill();
            }
        }
    } catch(e) {
        console.log("stop process", serviceConfig["name"], e.toString())
    }
}

process.on('SIGTERM', function() {
    console.log('receive sigterm');
    process.exit();
})

process.on('uncaughtException', function(err) {
    console.error('uncaught', err.toString());
})

process.on('exit', function() {
    console.log("exiting daemon..")
    fs.unlinkSync(pid_file);
})