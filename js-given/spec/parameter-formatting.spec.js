// @flow
import {expect} from 'chai';

import {
    scenario,
    scenarios,
    setupForRspec,
    setupForAva,
    Quoted,
    QuotedWith,
    NotFormatter,
    State,
    Stage,
    parametrized1,
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
    a_scenario_that_includes_a_given_part_with_a_step_with_the_customized_quoted_formatter_and_value_$(
        value: string
    ): this {
        class DefaultStage extends Stage {
            @QuotedWith('`')('value')
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

        steps_parameters_can_be_quoted_with_a_custom_character: scenario(
            {},
            () => {
                given()
                    .a_scenario_runner()
                    .and()
                    .a_scenario_that_includes_a_given_part_with_a_step_with_the_customized_quoted_formatter_and_value_$(
                        '1337'
                    );

                when().the_scenario_is_executed();

                then().its_given_part_contains_only_the_step(
                    'Given a step accepting `1337` value'
                );
            }
        ),

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

class ParametersFormattingChecksStage extends Stage {
    error: Error;

    @Quoted('value')
    trying_to_build_a_stage_that_uses_the_quoted_decorator_on_a_property_with_value(
        value: mixed
    ): this {
        try {
            // eslint-disable-next-line no-unused-vars
            class AStage extends Stage {
                @Quoted('value') property: mixed = value;
            }
        } catch (error) {
            this.error = error;
        }
        return this;
    }

    trying_to_build_a_stage_that_uses_the_quoted_decorator_on_a_step_method_with_an_unknown_parameter(): this {
        try {
            // eslint-disable-next-line no-unused-vars
            class AStage extends Stage {
                @Quoted('unknownParameter')
                method(value: string): this {
                    return this;
                }
            }
        } catch (error) {
            this.error = error;
        }
        return this;
    }

    @Quoted('value')
    trying_to_build_a_stage_that_declares_the_quoted_formatParameter_method_on_a_property_with_value(
        value: mixed
    ): this {
        try {
            // eslint-disable-next-line no-inner-declarations
            function AStage() {}
            AStage.prototype = {
                property: value,
            };
            Object.setPrototypeOf(AStage.prototype, Stage.prototype);
            Object.setPrototypeOf(AStage, Stage);
            // $FlowIgnore
            Quoted.formatParameter(AStage, 'property', 'value');
        } catch (error) {
            this.error = error;
        }
        return this;
    }

    trying_to_build_a_stage_that_declared_the_quoted_formatParameter_on_a_step_method_with_an_unknown_parameter(): this {
        try {
            // eslint-disable-next-line no-inner-declarations
            function AStage() {}
            AStage.prototype = {
                method: () => {},
            };
            Object.setPrototypeOf(AStage.prototype, Stage.prototype);
            Object.setPrototypeOf(AStage, Stage);
            // $FlowIgnore
            Quoted.formatParameter(AStage, 'method', 'unknownParameter');
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
    'core.steps.parameter-formatting',
    ParametersFormattingChecksStage,
    ({given, when, then}) => ({
        a_formatter_decorator_cannot_be_used_on_a_property_that_is_not_a_function: scenario(
            {},
            parametrized1([null, undefined, 42, '1337', {}, []], value => {
                when().trying_to_build_a_stage_that_uses_the_quoted_decorator_on_a_property_with_value(
                    value
                );

                then().an_error_is_thrown_with_the_message(
                    "Formatter decorators can only be applied to methods: 'property' is not a method."
                );
            })
        ),

        formatter_formatParameter_cannot_be_used_on_a_property_that_is_not_a_function: scenario(
            {},
            parametrized1([null, undefined, 42, '1337', {}, []], value => {
                when().trying_to_build_a_stage_that_declares_the_quoted_formatParameter_method_on_a_property_with_value(
                    value
                );

                then().an_error_is_thrown_with_the_message(
                    "Formatter.formatParameter() can only be applied to methods: 'property' is not a method."
                );
            })
        ),

        formatter_formatParameter_cannot_be_used_on_a_method_with_an_unknown_parameter: scenario(
            {},
            () => {
                when().trying_to_build_a_stage_that_uses_the_quoted_decorator_on_a_step_method_with_an_unknown_parameter();

                then().an_error_is_thrown_with_the_message(
                    "Formatter decorator cannot be applied on method: method(): parameter 'unknownParameter' was not found."
                );
            }
        ),

        a_formatter_decorator_cannot_be_used_on_a_method_with_an_unknown_parameter: scenario(
            {},
            () => {
                when().trying_to_build_a_stage_that_declared_the_quoted_formatParameter_on_a_step_method_with_an_unknown_parameter();

                then().an_error_is_thrown_with_the_message(
                    "Formatter.formatParameter() cannot be applied on method: method(): parameter 'unknownParameter' was not found."
                );
            }
        ),
    })
);
