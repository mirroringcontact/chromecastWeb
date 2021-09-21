(function() {
    let el = document.createElement('div');
    el.id = 'console-out';
    el.style.position = 'absolute';
    el.style.right = '5%';
    el.style.top = '5%';
    el.style.width = '45%';
    el.style.height = '90%';
    el.style.background = '#fff';
    el.style.opacity = '0.5';
    el.style.overflow = 'hidden';
    el.style.padding = '0 1em';
    document.body.appendChild(el);
})();

console.defaultLog = console.log.bind(console);
console.logs = [];
console.log = function () {
    // default &  console.log()
    console.defaultLog.apply(console, arguments);
    // new & array data
    console.logs.push(Array.from(arguments));

    let consoleOut = document.getElementById('console-out');
    if (consoleOut) {
        consoleOut.innerHTML = '<p>' + arguments[0] + '</p>' + consoleOut.innerHTML;
    }
}

console.defaultError = console.error.bind(console);
console.errors = [];
console.error = function () {
    // default &  console.error()
    console.defaultError.apply(console, arguments);
    // new & array data
    console.errors.push(Array.from(arguments));

    let consoleOut = document.getElementById('console-out');
    if (consoleOut) {
        consoleOut.innerHTML = '<p>ERROR: ' + arguments[0] + '</p>' + consoleOut.innerHTML;
    }
}