// @flow
import fs from 'fs';
import zlib from 'zlib';

import {expect} from 'chai';
import tmp from 'tmp';

import {scenarios, setupForRspec, setupForAva, Stage} from '../src';
import {
    computeScenarioFileName,
    GroupReport,
    ScenarioCase,
    ScenarioPart,
    ScenarioReport,
    Step,
} from '../src/reports';
import {generateJGivenReportDataFiles} from '../src/generateJGivenReport';
import {REPORTS_DESTINATION} from '../src/scenarios';

if (global.describe && global.it) {
    setupForRspec(describe, it);
} else {
    const test = require('ava');
    setupForAva(test);
}

class JGivenReportStage extends Stage {
    scenario: ScenarioReport;
    groupName = 'Group';
    scenarioName = 'Scenario';

    reportPrefix: ?string;
    jgivenReportDir: ?string;
    jsGivenReportsDir: string;

    an_existing_jgiven_directory(): this {
        const tmpDir = tmp.dirSync({unsafeCleanup: true});
        this.reportPrefix = `${tmpDir.name}`;
        const jgivenReportDir = `${this.reportPrefix}/jGiven-report`;
        this.jgivenReportDir = jgivenReportDir;
        const jsGivenReportsDir = `${this.reportPrefix}/${REPORTS_DESTINATION}`;
        this.jsGivenReportsDir = jsGivenReportsDir;
        this.createDirOrDoNothingIfExists(`${jgivenReportDir}`);
        this.createDirOrDoNothingIfExists(`${jgivenReportDir}/data`);
        this.createDirOrDoNothingIfExists(jsGivenReportsDir);

        return this;
    }

    createDirOrDoNothingIfExists(dirName: string) {
        try {
            fs.mkdirSync(dirName);
        } catch (error) {
            if (error.code !== 'EEXIST') {
                throw error;
            } else {
                // do nothing
            }
        }
    }

    a_simple_jsgiven_report(): this {
        const groupReport = new GroupReport(this.groupName);
        const givenPart = new ScenarioPart('GIVEN', [
            new Step("given", [], true, null),
            new Step("some_eggs", [], false, null),
        ]);
        const whenPart = new ScenarioPart('WHEN', [
            new Step("when", [], true, null),
            new Step("i_break_the_eggs", [], false, null),
        ]);
        const thenPart = new ScenarioPart('THEN', [
            new Step("then", [], true, null),
            new Step("the_eggs_are_broken", [], false, null),
        ]);
        const scenarioCase = new ScenarioCase([], [givenPart, whenPart, thenPart]);
        const scenario = new ScenarioReport(groupReport, this.scenarioName,
            [scenarioCase], []);
        scenario.dumpToFile(this.jsGivenReportsDir);

        return this;
    }

    the_jgiven_report_is_generated(): this {
        const scenarioFileName = computeScenarioFileName(this.groupName, this.scenarioName);
        if (this.reportPrefix) {
            generateJGivenReportDataFiles(fileName => fileName === scenarioFileName, this.reportPrefix, this.jsGivenReportsDir);
        } else {
            expect(this.reportPrefix).to.exist;
        }

        return this;
    }

    the_metadata_js_file_is_generated(): this {
        if (this.jgivenReportDir) {
            expect(fs.existsSync(`${this.jgivenReportDir}/data/metaData.js`)).to.be.true;
        } else {
            expect(this.jgivenReportDir).to.exist;
        }

        return this;
    }

    metaData: ?Object;
    the_metadata_js_file_can_be_executed(): this {
        if (this.jgivenReportDir) {
            const metaDataContent = fs.readFileSync(`${this.jgivenReportDir}/data/metaData.js`, 'utf-8');
            global.jgivenReport = {setMetaData: data => this.metaData = data};
            eval(metaDataContent);
            delete global.jgivenReport;
        } else {
            expect(this.jgivenReportDir).to.exist;
        }

        return this;
    }

    it_has_called_the_jgivenReport_setMetaData_method_with_the_appropriate_parameters(): this {
        const metaData = this.metaData;
        expect(metaData).to.exist;
        if (metaData) {
            expect(metaData.created).to.exist;
            expect(metaData.title).to.equal('J(s)Given Report');
            expect(metaData.data).to.deep.equal(['data0.js']);
        }

        return this;
    }

    the_tags_js_file_is_generated(): this {
        if (this.jgivenReportDir) {
            expect(fs.existsSync(`${this.jgivenReportDir}/data/tags.js`)).to.be.true;
        } else {
            expect(this.jgivenReportDir).to.exist;
        }

        return this;
    }

    tags: ?Object;
    the_tags_js_file_can_be_executed(): this {
        if (this.jgivenReportDir) {
            const tagsContent = fs.readFileSync(`${this.jgivenReportDir}/data/tags.js`, 'utf-8');
            global.jgivenReport = {setTags: tags => this.tags = tags};
            eval(tagsContent);
            delete global.jgivenReport;
        } else {
            expect(this.jgivenReportDir).to.exist;
        }

        return this;
    }

    it_has_called_the_jgivenReport_setTags_method(): this {
        expect(this.tags).to.deep.equal({});
        return this;
    }

    the_data0_js_file_is_generated(): this {
        if (this.jgivenReportDir) {
            expect(fs.existsSync(`${this.jgivenReportDir}/data/data0.js`)).to.be.true;
        } else {
            expect(this.jgivenReportDir).to.exist;
        }

        return this;
    }

    zippedScenariosData: ?string = undefined;
    the_data0_js_file_can_be_executed(): this {
        if (this.jgivenReportDir) {
            const data0Content = fs.readFileSync(`${this.jgivenReportDir}/data/data0.js`, 'utf-8');
            global.jgivenReport = {addZippedScenarios: data => this.zippedScenariosData = data};
            eval(data0Content);
            delete global.jgivenReport;
        } else {
            expect(this.jgivenReportDir).to.exist;
        }

        return this;
    }

    it_has_called_the_jgivenReport_addZippedScenarios_method(): this {
        expect(this.zippedScenariosData).to.exist;
        return this;
    }

    the_zipped_scenarios_can_be_decoded(): this {
        if (this.zippedScenariosData) {
            const bufferZipped = new Buffer(this.zippedScenariosData, 'base64');
            const buffer = zlib.gunzipSync(bufferZipped);
            const json = buffer.toString('utf-8');
            const scenarios = JSON.parse(json);
            expect(scenarios).to.be.an.array;
        } else {
            expect('zippedScenariosData should not be null').to.be.true;
        }
        return this;
    }
}

scenarios('core.reports.jgiven', JGivenReportStage, ({given, when, then}) => {
    return {
        a_simple_report_is_generated() {
            given().an_existing_jgiven_directory().and()
                .a_simple_jsgiven_report();

            when().the_jgiven_report_is_generated();

            then()
                .the_metadata_js_file_is_generated().and()
                .the_metadata_js_file_can_be_executed().and()
                .it_has_called_the_jgivenReport_setMetaData_method_with_the_appropriate_parameters().and()
                .the_data0_js_file_is_generated().and()
                .the_data0_js_file_can_be_executed().and()
                .it_has_called_the_jgivenReport_addZippedScenarios_method().and()
                .the_tags_js_file_is_generated().and()
                .the_tags_js_file_can_be_executed().and()
                .it_has_called_the_jgivenReport_setTags_method().and()
                .the_zipped_scenarios_can_be_decoded();
        },
    };
});
