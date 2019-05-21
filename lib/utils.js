function parseReadableSize(size) {
    if (!size) return null;
    if (!isNaN(size)) return size;
    if (!/^(\d*[.])?\d+\s*[KMG]B$/gi.test(size)) {
        return null;
    }
    const UNITS = {
        'KB': 1,
        'MB': 2,
        'GB': 3,
    };
    var match = size.toUpperCase().match(/^(\d*[.]?\d+)\s*([KMG]B)$/);
    return parseFloat(match[1]) * Math.pow(1024, UNITS[match[2]]);
}


function formatTime(timespan) {
    timespan = parseInt(timespan / 1000);
    const MIN = 60;
    const HOUR = 60 * 60;
    const DAY = 60 * 60 * 24;
    if (timespan < MIN) {
        return timespan + 's';
    } else if (timespan < HOUR) {
        return parseInt(timespan / MIN) + 'm';
    } else if (timespan < DAY) {
        return parseInt(timespan / HOUR) + 'h';
    } else {
        return parseInt(timespan / DAY) + 'D';
    }
}

module.exports = {
    parseReadableSize,
    formatTime
};
