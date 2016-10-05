// @flow
import fs from 'fs';

import {expect} from 'chai';
import sinon from 'sinon';

import {scenarios, setupForRspec, setupForAva, State, Stage} from '../src';
import {computeScenarioFileName} from '../src/reports';
import type {ScenarioPart, ScenarioPartKind, ScenarioReport} from '../src/reports';

import {BasicScenarioGivenStage, ScenarioWhenStage, BasicScenarioThenStage} from './basic-stages';

if (global.describe && global.it) {
    setupForRspec(describe, it);
} else {
    const test = require('ava');
    setupForAva(test);
}

class ReportScenarioGivenStage extends BasicScenarioGivenStage {
    @State scenarioFunc;

    a_dummy_scenario(): this {
        class DefaultStage extends Stage {
            an_egg(): this {return this;}
            some_milk(): this {this.internalMethod(); return this;}
            $_grams_of_flour(grams: number): this {return this;}
            the_cook_mangles_everthing_to_a_dough(): this {return this;}
            the_cook_fries_the_dough_in_a_pan(): this {return this;}
            the_resulting_meal_is_a_pan_cake(): this {return this;}
            internalMethod() {}
        }
        this.scenarioFunc = sinon.spy();
        this.scenarioRunner.scenarios('group_name', DefaultStage, ({given, when, then}) => {
            return {
                pan_cake_recipe() {
                    given().an_egg().
                        and().some_milk().
                        and().$_grams_of_flour(100);

                    when().the_cook_mangles_everthing_to_a_dough().
                        and().the_cook_fries_the_dough_in_a_pan();

                    then().the_resulting_meal_is_a_pan_cake();
                },
            };
        });
        return this;
    }
}

class ReportScenarioThenStage extends BasicScenarioThenStage {
    the_report_for_this_scenerio_has_been_generated(): this {
        const stats = fs.statSync(this.getFileName());
        expect(stats.isFile());
        return this;
    }

    its_name_is_readable_in_english(): this {
        const scenario = this.getScenario();
        const report = scenario.groupReport;
        expect(report.name).to.equal('Group name');
        expect(scenario.name).to.equal('Pan cake recipe');
        return this;
    }

    it_has_a_given_part(): this {
        expect(this.findPartByKind('GIVEN')).to.exist;
        return this;
    }

    it_has_a_when_part(): this {
        expect(this.findPartByKind('WHEN')).to.exist;
        return this;
    }

    it_has_a_then_part(): this {
        expect(this.findPartByKind('THEN')).to.exist;
        return this;
    }

    its_given_part_contains_the_steps(expectedSteps: string[]): this {
        const {steps} = this.findPartByKind('GIVEN');
        expect(steps.map(({name}) => name)).to.deep.equal(expectedSteps);
        return this;
    }

    its_given_part_does_not_include_methods_that_return_something_else_than_this(): this {
        const {steps} = this.findPartByKind('GIVEN');
        expect(steps.map(({name}) => name)).not.to.include('internal method');
        return this;
    }

    findPartByKind(scenarioKind: ScenarioPartKind): ScenarioPart {
        const scenario = this.getScenario();
        const part = scenario.parts.find(({kind}) => kind === scenarioKind);
        if (!part) {
            throw new Error(`No such part ${scenarioKind}`);
        }
        return part;
    }

    getFileName(): string {
        return `jsGiven-reports/${computeScenarioFileName('Group name', 'Pan cake recipe')}`;
    }

    getScenario(): ScenarioReport {
        return JSON.parse(fs.readFileSync(this.getFileName(), 'utf-8'));
    }
}

scenarios('reports', [ReportScenarioGivenStage, ScenarioWhenStage, ReportScenarioThenStage], ({given, when, then}) => {
    return {
        a_report_is_generated_after_execution() {
            given().a_scenario_runner()
                .and().a_dummy_scenario();

            when().the_scenario_is_executed();

            then().the_report_for_this_scenerio_has_been_generated()
                .and().its_name_is_readable_in_english()
                .and().it_has_a_given_part()
                .and().its_given_part_contains_the_steps([
                    'Given an egg',
                    'and some milk',
                    'and 100 grams of flour',
                ])
                .and().its_given_part_does_not_include_methods_that_return_something_else_than_this()
                .and().it_has_a_when_part()
                .and().it_has_a_then_part();
        },
    };
});

class ReportsFileStage extends Stage {
    groupName: string;
    scenarioName: string;

    a_group_named_$(groupName: string): this {
        this.groupName = groupName;
        return this;
    }

    a_scenario_named_$(scenarioName: string): this {
        this.scenarioName = scenarioName;
        return this;
    }

    the_computed_scenario_file_name_is_$(expectedComputedScenarioName: string): this {
        const computedScenarioName = computeScenarioFileName(this.groupName, this.scenarioName);
        expect(computedScenarioName).to.equal(expectedComputedScenarioName);
        return this;
    }
}

scenarios('reportsFile', ReportsFileStage, ({given, when, then}) => ({
    the_report_file_name_is_generated_according_to_the_group_name_and_the_scenario_name() {
        given().a_group_named_$('Group name')
            .and().a_scenario_named_$('Scenario name');

        then().the_computed_scenario_file_name_is_$('a539d97b55e020986d243b5a8cc7a3327374ae1ffcc8c120f1beab52a5921fc3');
    },
}));
