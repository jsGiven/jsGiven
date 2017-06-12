// @flow
var Jasmine = require('jasmine');
var SpecReporter = require('jasmine-spec-reporter').SpecReporter;

var jrunner = new Jasmine();

// $FlowIgnore
/*eslint-disable */
jasmine.getEnv().clearReporters();   // add jasmine-spec-reporter
/*eslint-disable */
jasmine.getEnv().addReporter(new SpecReporter());   // add jasmine-spec-reporter
/*eslint-enable */
jrunner.loadConfigFile();                           // load jasmine.json configuration

global.TEST_FRAMEWORK = 'JASMINE';

jrunner.execute();
