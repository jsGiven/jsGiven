// @flow
import fs from 'fs';

import tmp from 'tmp';
import {expect} from 'chai';

if (global.jasmine) {
    global.jasmine.DEFAULT_TIMEOUT_INTERVAL = 1800000;
}
import {installJGivenReportApp} from '../src/generateJGivenReport';

// Todo implement jsGiven test once it supports async tests
if (global.describe && global.it) {
    if (global.TEST_FRAMEWORK === 'JASMINE') {
        describe('JGiven report', () => {
            it('should install the report app', async (done) => {
                await testInstallJGivenReportApp();
                if (done) {
                    done();
                }
            });
        });
    } else {
        describe('JGiven report', () => {
            it('should install the report app', async () => {
                await testInstallJGivenReportApp();
            });
        });
    }
} else {
    const test = require('ava');
    test('JGiven report should install the report app', async () => {
        await testInstallJGivenReportApp();
    });
}

async function testInstallJGivenReportApp(): Promise<void> {
    const tmpDir = tmp.dirSync({unsafeCleanup: true});
    const reportDir = tmpDir.name;

    await installJGivenReportApp(tmpDir.name);

    expect(fs.existsSync(`${reportDir}/jGiven-report`)).to.be.true;
    expect(fs.existsSync(`${reportDir}/jGiven-report/index.html`)).to.be.true;
    expect(fs.existsSync(`${reportDir}/jGiven-report/data`)).to.be.true;
    expect(fs.existsSync(`${reportDir}/jGiven-report/META-INF`)).to.be.false;
    expect(fs.existsSync(`${reportDir}/jGiven-report/com`)).to.be.false;
    expect(fs.existsSync(`${reportDir}/jGiven-report/jgiven-html5-report.jar`)).to.be.false;
}
