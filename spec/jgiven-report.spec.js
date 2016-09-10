// @flow
import fs from 'fs';

import {expect} from 'chai';

import {installJGivenReportApp, JGIVEN_APP_VERSION} from '../src/generateReport';

// Todo implement jsGiven test once it supports async tests
if (global.describe && global.it) {
    describe('JGiven report', () => {
        it('should install the report app', async (...args) => {
            await testInstallJGivenReportApp();
            if (args.length > 0) {
                const [done] = args;
                done();
            }
        });
    });
} else {
    const test = require('ava');
    test('JGiven report should install the report app', async () => {
        await testInstallJGivenReportApp();
    });
}

async function testInstallJGivenReportApp(): Promise<void> {
    await installJGivenReportApp();
    
    expect(fs.existsSync('./jGiven-report')).to.be.true;
    expect(fs.existsSync('./jGiven-report/index.html')).to.be.true;
    expect(fs.existsSync('./jGiven-report/META-INF')).to.be.false;
    expect(fs.existsSync('./jGiven-report/com')).to.be.false;
    expect(fs.existsSync(`./jGiven-report/jgiven-html5-report-${JGIVEN_APP_VERSION}.jar`)).to.be.false;
}
