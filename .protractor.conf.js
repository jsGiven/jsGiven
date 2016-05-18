exports.config = {
    capabilities: {
        'browserName': 'firefox'
    },
    specs: ['spec/**.spec.js'],
    onPrepare: function () {
        require("babel-core/register");
        require('./spec/support/setup-sinon-chai.js');
    }
};
