const fs = require('fs');

const pkg = require('../package.json');
delete pkg.private;
delete pkg.devDependencies;
delete pkg.scripts;
delete pkg.eslintConfig;
delete pkg.babel;
delete pkg.ava;

fs.writeFileSync('dist/package.json', JSON.stringify(pkg, null, '  '), 'utf-8');
fs.writeFileSync('dist/LICENSE', fs.readFileSync('LICENSE', 'utf-8'), 'utf-8');
fs.writeFileSync('dist/README.md', fs.readFileSync('README.md', 'utf-8'), 'utf-8');
