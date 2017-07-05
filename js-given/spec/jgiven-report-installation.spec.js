// @flow
import fs from 'fs';

import tmp from 'tmp';
import { expect } from 'chai';

import {
    scenario,
    scenarios,
    setupForRspec,
    setupForAva,
    Stage,
    doAsync,
} from '../src';
import { installJGivenReportApp } from '../src/generateJGivenReport';

if (global.jasmine) {
    global.jasmine.DEFAULT_TIMEOUT_INTERVAL = 1800000;
}

if (global.describe && global.it) {
    setupForRspec(describe, it);
} else {
    const test = require('ava');
    setupForAva(test);
}

class JGivenReportInstallationStage extends Stage {
    reportDir: string;

    a_temp_directory(): this {
        const tmpDir = tmp.dirSync({ unsafeCleanup: true });
        this.reportDir = tmpDir.name;

        return this;
    }

    the_jgiven_report_is_installed(): this {
        doAsync(async () => {
            await installJGivenReportApp(this.reportDir);
        });

        return this;
    }

    the_report_has_been_installed(): this {
        const { reportDir } = this;
        expect(fs.existsSync(`${reportDir}/jGiven-report`)).to.be.true;
        expect(fs.existsSync(`${reportDir}/jGiven-report/index.html`)).to.be
            .true;
        expect(fs.existsSync(`${reportDir}/jGiven-report/data`)).to.be.true;
        expect(fs.existsSync(`${reportDir}/jGiven-report/META-INF`)).to.be
            .false;
        expect(fs.existsSync(`${reportDir}/jGiven-report/com`)).to.be.false;
        expect(
            fs.existsSync(`${reportDir}/jGiven-report/jgiven-html5-report.jar`)
        ).to.be.false;
        return this;
    }
}

scenarios(
    'core.reports.jgiven.installation',
    JGivenReportInstallationStage,
    ({ given, when, then }) => {
        return {
            a_simple_report_is_generated: scenario({}, () => {
                given().a_temp_directory();

                when().the_jgiven_report_is_installed();

                then().the_report_has_been_installed();
            }),
        };
    }
);
