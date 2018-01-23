// @flow
import 'babel-polyfill';
import yargs from 'yargs';

import { generateJGivenReport, cleanReports } from './generateJGivenReport';

const { argv } = yargs
  .usage('Usage: $0 <command>')
  .command('report', 'Generate the reports', yars => {
    return yargs.option('fail', {
      describe: 'Generates the reports but return -1',
    });
  })
  .command('clean', 'Remove the reports and intermediary files')
  .demandCommand(1);

const [command] = argv._;

if (command === 'report') {
  const fail: boolean = !!argv.fail;
  generateJGivenReport(fail);
}

if (command === 'clean') {
  cleanReports();
}
