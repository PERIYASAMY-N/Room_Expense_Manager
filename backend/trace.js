const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');
code = "process.on('exit', c => console.log('EXIT:', c)); process.on('beforeExit', () => console.log('BEFORE_EXIT'));\n" + code;
fs.writeFileSync('server_trace.js', code);
