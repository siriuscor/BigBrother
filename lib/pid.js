const fs = require('fs');

module.exports = (pid_file) => {

    function remove() {
        try {
            if (pid_file) fs.unlinkSync(pid_file);
        } catch(e) {
            
        }
    }

    function write() {
        fs.writeFileSync(pid_file, process.pid);
        process.on('SIGTERM', function() {
            remove();
            process.exit();
        });
        
        process.on('uncaughtException', function(err) {
            remove();
        });
        
        process.on('exit', function() {
            remove();
            process.exit();
        });
    }
    function exists() {
        return fs.existsSync(pid_file);
        /*
        var pid = fs.readFileSync(pid_file);
        console.log('read pid', pid);
        if (pid) { // test process is really running
            // try {
            //     return process.kill(pid, 0);
            // } catch (e) {
            //     console.log('err', e);
            //     return e.code === 'EPERM';
            // }
            return true;
        } else {
            return false;
        }*/
    }
    return {
        exists, write
    };
};
