const fs = require('fs');

const Git = require('nodegit');

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

const context = {};
Git.Repository.open('.').then(function (repository) {
    context.repository = repository;
    return context.repository.getStatus();
}).then(function(statuses) {
    statuses.forEach(function(file) {
       throw new Error('Some file is not committed: ' + file.path())
     });
    return context.repository.getHeadCommit();
}).then(function(headCommit) {
    const tagName = 'v' + pkg.version;
    const signature = Git.Signature.default(context.repository);
    console.log("Adding tag '" + tagName + "'");
    return Git.Tag.create(context.repository, tagName, headCommit, signature, 'Adding tag ' + tagName, 0);
}).done();
