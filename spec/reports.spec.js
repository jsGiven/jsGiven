// @flow
import {scenarios, setupForRspec, setupForAva, State, Stage} from '../index';
import {BasicScenarioGivenStage, ScenarioWhenStage, BasicScenarioThenStage} from './basic-stages';

import {ScenarioRunner} from '../src/scenarios';
import type {ScenarioPart, ScenarioPartKind} from '../src/scenarios';

import {expect} from 'chai';
import sinon from 'sinon';

import _ from 'lodash';

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
            some_milk(): this {return this;}
            some_flour(): this {return this;}
            the_cook_mangles_everthing_to_a_dough(): this {return this};
            the_cook_fries_the_dough_in_a_pan(): this {return this};
            the_resulting_meal_is_a_pan_cake(): this {return this};
        };
        this.scenarioFunc = sinon.spy();
        this.scenarioRunner.scenarios('group_name', DefaultStage, ({given, when, then}) => {
            return {
                pan_cake_recipe() {
                    given().an_egg().
                        and().some_milk().
                        and().some_flour()

                    when().the_cook_mangles_everthing_to_a_dough().
                        and().the_cook_fries_the_dough_in_a_pan()

                    then().the_resulting_meal_is_a_pan_cake()
                }
            };
        });
        return this;
    }
}

class ReportScenarioThenStage extends BasicScenarioThenStage {
    the_report_has_been_generated(): this {
        expect(this.scenarioRunner.report).to.exist;
        return this;
    }

    its_name_is_readable_in_english(): this {
        const report = this.scenarioRunner.report;
        expect(report.name).to.equal('Group name');
        expect(report.scenarios).to.have.length(1);
        const scenario = report.scenarios[0];
        expect(scenario.name).to.equal('Pan cake recipe');
        return this;
    }

    it_has_a_given_part(): this {
        expect(this.__findPartByKind('GIVEN')).to.exist;
        return this;
    }

    it_has_a_when_part(): this {
        expect(this.__findPartByKind('WHEN')).to.exist;
        return this;
    }

    it_has_a_then_part(): this {
        expect(this.__findPartByKind('THEN')).to.exist;
        return this;
    }

    its_given_part_contains_the_expected_words(): this {
        const {steps} = this.__findPartByKind('GIVEN');
        expect(steps.map(({name}) => name)).to.deep.equal([
            'Given',
            'an egg',
            'and',
            'some milk',
            'and',
            'some flour',
        ]);
        return this;
    }

    __findPartByKind(scenarioKind: ScenarioPartKind): ScenarioPart {
        const report = this.scenarioRunner.report;
        const [scenario] = report.scenarios;
        return scenario.parts.find(({kind}) => kind === scenarioKind);
    }
}

scenarios('reports', ReportScenarioGivenStage, ScenarioWhenStage, ReportScenarioThenStage, ({given, when, then}) => {
    return {
        a_report_is_generated_after_execution() {
            given().a_scenario_runner()
                .and().a_dummy_scenario();

            when().the_scenario_is_executed();

            then().the_report_has_been_generated()
                .and().its_name_is_readable_in_english()
                .and().it_has_a_given_part()
                .and().its_given_part_contains_the_expected_words()
                .and().it_has_a_when_part()
                .and().it_has_a_then_part();
        }
    }
});
