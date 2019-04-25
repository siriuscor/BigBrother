const path = require('path');
var cwd = path.dirname(module.filename);
module.exports = 
[
    {
        name: "demo",
        cwd: cwd,
        cmd: "/usr/local/bin/node",
        args: "test.js",
        mode : "fork",
        stdout: { "filename": path.resolve(cwd, "test.log"), "maxsize": 2000 },
        stderr: { "filename": path.resolve(cwd, "test.log"), "maxsize": 2000 },
        env:   { "NODE_ENV": "development" }
    }
];
