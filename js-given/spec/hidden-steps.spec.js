// @flow
import { expect } from 'chai';

import {
    scenario,
    scenarios,
    setupForRspec,
    setupForAva,
    Hidden,
    State,
    Stage,
    Quoted,
    parametrized1,
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
            ({ given, when, then }) => {
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
        const { steps } = this.findPartByKind('GIVEN');
        expect(steps.map(({ name }) => name)).to.deep.equal(expectedSteps);
        return this;
    }
}

scenarios(
    'core.scenarios.hidden',
    [
        ScenarioHiddenStepsGivenStage,
        BasicScenarioWhenStage,
        ScenarioHiddenStepsThenStage,
    ],
    ({ given, when, then }) => ({
        hidden_steps_are_not_present_in_the_report: scenario({}, () => {
            given()
                .a_scenario_runner()
                .and()
                .a_scenario_that_includes_an_hidden_step();

            when().the_scenario_is_executed();

            then().its_given_part_contains_the_steps(['Given a visible step']);
        }),
    })
);

class HiddenChecksStage extends Stage {
    error: Error;

    @Quoted('value')
    trying_to_build_a_stage_that_uses_an_hidden_decorator_on_a_property_with_value(
        value: mixed
    ): this {
        try {
            // eslint-disable-next-line no-unused-vars
            class AStage extends Stage {
                @Hidden property: mixed = value;
            }
        } catch (error) {
            this.error = error;
        }
        return this;
    }

    @Quoted('value')
    trying_to_build_a_stage_that_declares_an_hidden_step_on_a_property_with_value(
        value: mixed
    ): this {
        try {
            // $FlowIgnore
            function AStage() {} // eslint-disable-line no-inner-declarations
            AStage.prototype = {
                property: value,
            };
            Object.setPrototypeOf(AStage.prototype, Stage.prototype);
            Object.setPrototypeOf(AStage, Stage);
            // $FlowIgnore
            Hidden.addHiddenStep(AStage, 'property');
        } catch (error) {
            this.error = error;
        }
        return this;
    }

    @Quoted('message')
    an_error_is_thrown_with_the_message(message: string): this {
        expect(this.error).to.exist;
        expect(this.error.message).to.equal(message);
        return this;
    }
}

scenarios(
    'core.scenarios.hidden',
    HiddenChecksStage,
    ({ given, when, then }) => ({
        hidden_decorator_cannot_be_used_on_a_property_that_is_not_a_function: scenario(
            {},
            parametrized1([null, undefined, 42, '1337', {}, []], value => {
                when().trying_to_build_a_stage_that_uses_an_hidden_decorator_on_a_property_with_value(
                    value
                );

                then().an_error_is_thrown_with_the_message(
                    "@Hidden decorator can only be applied to methods: 'property' is not a method."
                );
            })
        ),

        hidden_addHiddenStep_cannot_be_used_on_a_property_that_is_not_a_function: scenario(
            {},
            parametrized1([null, undefined, 42, '1337', {}, []], value => {
                when().trying_to_build_a_stage_that_declares_an_hidden_step_on_a_property_with_value(
                    value
                );

                then().an_error_is_thrown_with_the_message(
                    "Hidden.addHiddenStep() can only be applied to methods: 'property' is not a method."
                );
            })
        ),
    })
);
