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
        stdout: { "filename": path.resolve(cwd, "test.log"), "maxsize": '10MB' },
        stderr: { "filename": path.resolve(cwd, "test.log"), "maxsize": '10MB' },
        // env:   { "NODE_ENV": "development" }
    }
];
