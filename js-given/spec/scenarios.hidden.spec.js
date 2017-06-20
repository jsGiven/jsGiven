// @flow
import {expect} from 'chai';

import {
    scenario,
    scenarios,
    setupForRspec,
    setupForAva,
    Hidden,
    State,
    Stage,
} from '../src';

import {
    BasicScenarioGivenStage,
    BasicScenarioWhenStage,
    BasicScenarioThenStage,
} from './basic-stages';

if (global.describe && global.it) {
    setupForRspec(describe, it);
} else {
    const test = require('ava');
    setupForAva(test);
}

class ScenarioHiddenStepsGivenStage extends BasicScenarioGivenStage {
    @State scenarioFunc;

    a_scenario_that_includes_an_hidden_step(): this {
        class DefaultStage extends Stage {
            a_visible_step(): this {
                return this;
            }
            @Hidden
            anHiddenStep(): this {
                return this;
            }
        }
        this.scenarioRunner.scenarios(
            'group_name',
            DefaultStage,
            ({given, when, then}) => {
                return {
                    scenario_name: scenario({}, () => {
                        given()
                            .a_visible_step()
                            .and()
                            .anHiddenStep();

                        when();

                        then();
                    }),
                };
            }
        );
        return this;
    }
}

class ScenarioHiddenStepsThenStage extends BasicScenarioThenStage {
    its_given_part_contains_the_steps(expectedSteps: string[]): this {
        const {steps} = this.findPartByKind('GIVEN');
        expect(steps.map(({name}) => name)).to.deep.equal(expectedSteps);
        return this;
    }
}

scenarios(
    'core.scenarios.hidden',
    [ScenarioHiddenStepsGivenStage, BasicScenarioWhenStage, ScenarioHiddenStepsThenStage],
    ({given, when, then}) => {
        return {
            hidden_steps_are_not_present_in_the_report: scenario({}, () => {
                given()
                    .a_scenario_runner()
                    .and()
                    .a_scenario_that_includes_an_hidden_step();

                when().the_scenario_is_executed();

                then().its_given_part_contains_the_steps([
                    'Given a visible step',
                ]);
            }),
        };
    }
);
