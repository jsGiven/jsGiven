// @flow
import fs from 'fs';
import zlib from 'zlib';

import {expect} from 'chai';

import {scenarios, setupForRspec, setupForAva, Stage} from '../index';
import {
    computeScenarioFileName,
    GroupReport,
    ScenarioPart,
    ScenarioReport,
    Step,
} from '../src/reports';
import {generateJGivenReportDataFiles} from '../src/generateReport';

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

    an_existing_jgiven_directory(): this {
        try {
            fs.mkdirSync('./jGiven-report');
        } catch (error) {
            if (error.code !== 'EEXIST') {
                throw error;
            } else {
                // do nothing
            }
        }

        return this;
    }

    a_simple_jsgiven_report(): this {
        const groupReport = new GroupReport(this.groupName);
        const givenPart = new ScenarioPart('GIVEN', [
            new Step("given", [], true),
            new Step("some_eggs", [], false),
        ]);
        const whenPart = new ScenarioPart('WHEN', [
            new Step("when", [], true),
            new Step("i_break_the_eggs", [], false),
        ]);
        const thenPart = new ScenarioPart('THEN', [
            new Step("then", [], true),
            new Step("the_eggs_are_broken", [], false),
        ]);
        const scenario = new ScenarioReport(groupReport, this.scenarioName,
            [givenPart, whenPart, thenPart]);
        scenario.dumpToFile();
        return this;
    }

    the_jgiven_report_is_generated(): this {
        const scenarioFileName = computeScenarioFileName(this.groupName, this.scenarioName);
        generateJGivenReportDataFiles(fileName => fileName === scenarioFileName);
        return this;
    }

    the_data0_js_file_is_generated(): this {
        expect(fs.existsSync('./jGiven-report/data0.js')).to.be.true;
        return this;
    }

    zippedScenariosData: ?string = undefined;

    the_data0_js_file_can_be_executed(): this {
        const data0Content = fs.readFileSync('./jGiven-report/data0.js', 'utf-8');
        global.jgivenReport = {addZippedScenarios: data => this.zippedScenariosData = data};
        eval(data0Content);
        delete global.jgivenReport;
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
            console.log(scenarios);
        } else {
            expect('zippedScenariosData should not be null').to.be.true;
        }
        return this;
    }
}

scenarios('JGiven report', JGivenReportStage, ({given, when, then}) => {
    return {
        a_simple_report_is_generated() {
            given().an_existing_jgiven_directory().and()
                .a_simple_jsgiven_report();

            when().the_jgiven_report_is_generated();

            then().the_data0_js_file_is_generated().and()
                .the_data0_js_file_can_be_executed().and()
                .it_has_called_the_jgivenReport_addZippedScenarios_method().and()
                .the_zipped_scenarios_can_be_decoded();
        },
    };
});
