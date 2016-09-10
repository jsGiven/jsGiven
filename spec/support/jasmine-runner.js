// @flow
var Jasmine = require('jasmine');
var SpecReporter = require('jasmine-spec-reporter');

var noop = function () {};

var jrunner = new Jasmine();
jrunner.configureDefaultReporter({print: noop});    // remove default reporter logs
/*eslint-disable */
// $FlowIgnore
jasmine.getEnv().addReporter(new SpecReporter());   // add jasmine-spec-reporter
/*eslint-enable */
jrunner.loadConfigFile();                           // load jasmine.json configuration

global.TEST_FRAMEWORK = 'JASMINE';

jrunner.execute();
