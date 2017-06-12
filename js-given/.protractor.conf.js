// Choosing firefox on CI, Chrome at home
var os = require('os');
var browser = os.platform() === 'linux' ? 'firefox' : 'chrome';

exports.config = {
    capabilities: {
        'browserName': browser,
    },
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
