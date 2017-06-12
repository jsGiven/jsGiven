exports.config = {
    capabilities: {
        browserName: 'chrome',
        chromeOptions: {
            args: ['--test-type']
        }
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
