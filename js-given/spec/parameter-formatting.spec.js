// @flow
import {expect} from 'chai';

import {
    scenario,
    scenarios,
    setupForRspec,
    setupForAva,
    Quoted,
    NotFormatter,
    State,
    Stage,
    parametrized2,
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

    @Quoted('value')
    a_scenario_that_includes_a_given_part_with_a_step_with_the_quoted_formatter_and_value_$(
        value: string
    ): this {
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

    @Quoted('value')
    a_scenario_that_includes_a_given_part_with_a_step_with_the_not_formatter_and_value_$(
        value: boolean
    ): this {
        class DefaultStage extends Stage {
            @NotFormatter('value')
            the_coffee_is_$_served(value: boolean): this {
                return this;
            }
        }
        this.scenarioRunner.scenarios(
            'group_name',
            DefaultStage,
            ({given, when, then}) => {
                return {
                    scenario_name: scenario({}, () => {
                        given().the_coffee_is_$_served(value);

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
    @Quoted('expectedStep')
    its_given_part_contains_only_the_step(expectedStep: string): this {
        const {steps} = this.findPartByKind('GIVEN');
        expect(steps.map(({name}) => name)).to.deep.equal([expectedStep]);
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
    ({given, when, then}) => ({
        steps_parameters_can_be_quoted: scenario({}, () => {
            given()
                .a_scenario_runner()
                .and()
                .a_scenario_that_includes_a_given_part_with_a_step_with_the_quoted_formatter_and_value_$(
                    '1337'
                );

            when().the_scenario_is_executed();

            then().its_given_part_contains_only_the_step(
                'Given a step accepting "1337" value'
            );
        }),

        steps_parameters_can_use_the_not_formatter: scenario(
            {},
            parametrized2(
                [
                    [true, 'Given the coffee is served'],
                    [false, 'Given the coffee is not served'],
                ],
                (booleanValue, expectedStepName) => {
                    given()
                        .a_scenario_runner()
                        .and()
                        .a_scenario_that_includes_a_given_part_with_a_step_with_the_not_formatter_and_value_$(
                            booleanValue
                        );

                    when().the_scenario_is_executed();

                    then().its_given_part_contains_only_the_step(
                        expectedStepName
                    );
                }
            )
        ),
    })
);
