// @flow
import 'babel-polyfill';
import yargs from 'yargs';

import {generateJGivenReport, cleanReports} from './generateJGivenReport';

const [command] = yargs
    .usage('Usage: $0 <command>')
    .command('report', 'Generate the reports')
    .command('clean', 'Remove the reports and intermediary files')
    .demandCommand(1).argv._;

if (command === 'report') {
    generateJGivenReport();
}

if (command === 'clean') {
    cleanReports();
}
