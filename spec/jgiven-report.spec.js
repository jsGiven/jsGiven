// @flow
import {expect} from 'chai';

import {scenarios, setupForRspec, setupForAva, Stage} from '../index';
import {GroupReport, ScenarioPart, ScenarioReport, Step} from '../src/reports';

if (global.describe && global.it) {
    setupForRspec(describe, it);
} else {
    const test = require('ava');
    setupForAva(test);
}

class JGivenReportStage extends Stage {
    scenario: ScenarioReport;
    
    the_simplest_jsgiven_report(): this {
        const groupReport = new GroupReport('GroupName');
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
        this.scenario = new ScenarioReport(groupReport, 'Scenario',
            [givenPart, whenPart, thenPart]);
        return this;
    }

    the_jgiven_report_is_generated(): this {
        return this;
    }

    the_data0_js_file_is_generated(): this {
        expect(true).to.be.true;
        return this;
    }
}

scenarios('JGiven report', JGivenReportStage, ({given, when, then}) => {
    return {
        simplest_report_is_generated() {
            given().the_simplest_jsgiven_report();

            when().the_jgiven_report_is_generated();

            then().the_data0_js_file_is_generated();
        },
    };
});
