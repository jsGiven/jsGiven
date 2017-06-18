const fs = require('fs');

const pkg = require('../package.json');
delete pkg.private;
delete pkg.devDependencies;
delete pkg.scripts;
delete pkg.eslintConfig;
delete pkg.babel;
delete pkg.ava;
pkg.scripts = {
    postinstall: 'node installJGivenReport.js',
};

var isAlpha = false;
process.argv.forEach(function(val) {
    if (val === 'alpha') {
        isAlpha = true;
    }
});
if (isAlpha) {
    pkg.version = pkg.__versionAlpha;
}
delete pkg.__versionAlpha;

fs.writeFileSync('dist/package.json', JSON.stringify(pkg, null, '  '), 'utf-8');
fs.writeFileSync(
    'dist/LICENSE',
    fs.readFileSync('../LICENSE', 'utf-8'),
    'utf-8'
);
fs.writeFileSync(
    'dist/README.md',
    fs.readFileSync('../README.md', 'utf-8'),
    'utf-8'
);
fs.writeFileSync(
    'dist/installJGivenReport.js',
    fs.readFileSync('tools/installJGivenReport.js', 'utf-8'),
    'utf-8'
);
let cliContent = fs.readFileSync('dist/cli.js', 'utf-8');
if (!cliContent.startsWith('#!/usr/bin/env node')) {
    cliContent = '#!/usr/bin/env node\n' + cliContent;
}
fs.writeFileSync('dist/cli.js', cliContent, 'utf-8');
