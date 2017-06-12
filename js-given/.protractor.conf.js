// Choosing firefox on CI, Chrome at home
var os = require('os');
var capabilities = os.platform() === 'linux' ? {
    browserName: 'firefox',
    marionette: false
} : {
    browserName: 'chrome',
};

exports.config = {
    capabilities: capabilities,
    specs: ['spec/**.spec.js'],
    onPrepare: function () {
        require("babel-core/register");
        require('./spec/support/setup-tests.js');
        var SpecReporter = require('jasmine-spec-reporter').SpecReporter;
        // add jasmine spec reporter
        jasmine.getEnv().addReporter(new SpecReporter({
            spec: {
                displayStacktrace: true
            }
        }));
    },
    jasmineNodeOpts: {
        print: function() {}
    }
};
