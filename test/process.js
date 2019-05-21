const path = require('path');
var cwd = path.dirname(module.filename);
module.exports = 
[
    {
        name: "demo",
        cwd: cwd,
        cmd: "node",
        args: "bb-test.js",
        mode : "fork",
        retryInterval : 30,
        stdout: { "filename": path.resolve(cwd, "test-out.log"), "maxsize": '10MB' },
        stderr: { "filename": path.resolve(cwd, "test-err.log"), "maxsize": '10MB' },
        // env:   { "NODE_ENV": "development" }
    },
    {
        name: "demo1",
        cwd: cwd,
        cmd: "node",
        args: "bb-test1.js",
        mode : "fork",
        stdout: { "filename": path.resolve(cwd, "test-out.log"), "maxsize": '10KB' },
        stderr: { "filename": path.resolve(cwd, "test-err.log"), "maxsize": '10MB' },
    }
];
