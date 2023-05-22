const pkg = require('../package.json');
const fs = require('fs');
const path = require('path');

const info = {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    homepage: pkg.homepage,
    bugs: pkg.bugs,
    author: pkg.author,
};

const infoPath = path.join(__dirname, '..', 'src', 'info.json');
fs.writeFile(infoPath, JSON.stringify(info, null, 4), (err) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log('info.json generated');
});
