const path = require('path');
var cwd = path.dirname(module.filename);

module.exports = 
[
    {
        name: "demo",
        cwd: cwd,
        cmd: "node",
        args: "test.js",
        mode : "fork",
        stdout: { "filename": path.resolve(cwd, "test-out.log"), "maxsize": 10240 },
        stderr: { "filename": path.resolve(cwd, "test-err.log"), "maxsize": 10240 },
        env:   { "NODE_ENV": "development" }
    }
];
