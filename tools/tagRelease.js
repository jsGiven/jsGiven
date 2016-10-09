const Git = require('nodegit');

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
