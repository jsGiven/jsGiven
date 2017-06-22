// @flow
import {expect} from 'chai';

import {
    scenario,
    scenarios,
    setupForRspec,
    setupForAva,
    Quoted,
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

class ParameterFormattingGivenStage extends BasicScenarioGivenStage {
    @State scenarioFunc;

    a_scenario_that_includes_a_step_with_a_quoted_value_$(value: string): this {
        class DefaultStage extends Stage {
            @Quoted('value')
            a_step_accepting_$_value(value: string): this {
                return this;
            }
        }
        this.scenarioRunner.scenarios(
            'group_name',
            DefaultStage,
            ({given, when, then}) => {
                return {
                    scenario_name: scenario({}, () => {
                        given().a_step_accepting_$_value(value);

                        when();

                        then();
                    }),
                };
            }
        );
        return this;
    }
}

class ParameterFormattingThenStage extends BasicScenarioThenStage {
    its_given_part_contains_the_steps(expectedSteps: string[]): this {
        const {steps} = this.findPartByKind('GIVEN');
        expect(steps.map(({name}) => name)).to.deep.equal(expectedSteps);
        return this;
    }
}

scenarios(
    'core.steps.parameter-formatting',
    [
        ParameterFormattingGivenStage,
        BasicScenarioWhenStage,
        ParameterFormattingThenStage,
    ],
    ({given, when, then}) => {
        return {
            steps_parameters_can_be_quoted: scenario({}, () => {
                given()
                    .a_scenario_runner()
                    .and()
                    .a_scenario_that_includes_a_step_with_a_quoted_value_$(
                        '1337'
                    );

                when().the_scenario_is_executed();

                then().its_given_part_contains_the_steps([
                    'Given a step accepting "1337" value',
                ]);
            }),
        };
    }
);
