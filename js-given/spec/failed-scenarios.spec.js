// @flow
import sinon from 'sinon';
import { expect } from 'chai';

import {
    doAsync,
    scenario,
    scenarios,
    setupForRspec,
    setupForAva,
    Stage,
    State,
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

class ScenarioFailureGivenStage extends BasicScenarioGivenStage {
    @State skippedStepFunction = sinon.spy();

    a_synchronous_scenario_that_fails(): this {
        const self = this;
        class FailureStage extends Stage {
            a_declaration_in_given_part(): this {
                return this;
            }
            invoking_a_method_that_fails(): this {
                throw new Error('Failure');
            }
            this_step_should_be_skipped(): this {
                self.skippedStepFunction();
                return this;
            }
        }

        this.scenarioRunner.scenarios(
            'group_name',
            FailureStage,
            ({ given, when, then }) => {
                return {
                    scenario_name: scenario({}, () => {
                        given().a_declaration_in_given_part();
                        when().invoking_a_method_that_fails();
                        then().this_step_should_be_skipped();
                    }),
                };
            }
        );
        return this;
    }

    an_asynchronous_scenario_that_fails_during_the_first_async_action(): this {
        const self = this;
        class FailureStage extends Stage {
            a_declaration_in_given_part(): this {
                return this;
            }
            invoking_a_method_that_fails(): this {
                doAsync(() => {
                    throw new Error('Failure');
                });
                return this;
            }
            this_step_should_be_skipped(): this {
                self.skippedStepFunction();
                return this;
            }
        }

        this.scenarioRunner.scenarios(
            'group_name',
            FailureStage,
            ({ given, when, then }) => {
                return {
                    scenario_name: scenario({}, () => {
                        given().a_declaration_in_given_part();
                        when().invoking_a_method_that_fails();
                        then().this_step_should_be_skipped();
                    }),
                };
            }
        );
        return this;
    }

    an_asynchronous_scenario_that_fails_during_a_secondary_async_action(): this {
        const self = this;
        class FailureStage extends Stage {
            a_declaration_in_given_part(): this {
                doAsync(async () => {});
                return this;
            }
            invoking_a_method_that_fails(): this {
                doAsync(async () => {
                    throw new Error('Failure');
                });
                return this;
            }
            this_step_should_be_skipped(): this {
                self.skippedStepFunction();
                return this;
            }
        }

        this.scenarioRunner.scenarios(
            'group_name',
            FailureStage,
            ({ given, when, then }) => {
                return {
                    scenario_name: scenario({}, () => {
                        given().a_declaration_in_given_part();
                        when().invoking_a_method_that_fails();
                        then().this_step_should_be_skipped();
                    }),
                };
            }
        );
        return this;
    }
}

class ScenarioFailureThenStage extends BasicScenarioThenStage {
    @State errors: Error[];
    @State skippedStepFunction;

    an_error_has_been_thrown(): this {
        expect(this.errors).to.have.length(1);
        const [error] = this.errors;
        expect(error.message).to.equal('Failure');
        return this;
    }

    the_step_that_should_be_skipped_has_not_been_executed(): this {
        expect(this.skippedStepFunction).to.not.have.been.called;
        return this;
    }

    the_report_includes_all_the_steps_of_the_scenario(): this {
        const stepNames = this.getAllSteps().map(step => step.name);
        expect(stepNames).to.deep.equal([
            'Given a declaration in given part',
            'When invoking a method that fails',
            'Then this step should be skipped',
        ]);
        return this;
    }

    the_first_step_is_passed(): this {
        const [firstStep] = this.getAllSteps();
        expect(firstStep.status).to.equal('PASSED');
        return this;
    }

    the_second_step_is_failed(): this {
        const secondStep = this.getAllSteps()[1];
        expect(secondStep.status).to.equal('FAILED');
        return this;
    }

    the_third_step_is_skipped(): this {
        const secondStep = this.getAllSteps()[2];
        expect(secondStep.status).to.equal('SKIPPED');
        return this;
    }
}

scenarios(
    'core.scenarios.failure',
    [
        ScenarioFailureGivenStage,
        BasicScenarioWhenStage,
        ScenarioFailureThenStage,
    ],
    ({ given, when, then }) => {
        return {
            synchronous_scenarios_can_fail: scenario({}, () => {
                given()
                    .a_scenario_runner()
                    .and()
                    .a_synchronous_scenario_that_fails();

                when().the_runner_tries_to_execute_the_scenario();

                then()
                    .an_error_has_been_thrown()
                    .and()
                    .the_step_that_should_be_skipped_has_not_been_executed()
                    .and()
                    .the_report_includes_all_the_steps_of_the_scenario()
                    .and()
                    .the_first_step_is_passed()
                    .and()
                    .the_second_step_is_failed()
                    .and()
                    .the_third_step_is_skipped()
                    .and()
                    .it_has_exactly_one_case_and_it_is_$_successful(false);
            }),

            asynchronous_scenarios_can_fail_during_the_first_async_action: scenario(
                {},
                () => {
                    given()
                        .a_scenario_runner()
                        .and()
                        .an_asynchronous_scenario_that_fails_during_the_first_async_action();

                    when().the_runner_tries_to_execute_the_scenario();

                    then()
                        .an_error_has_been_thrown()
                        .and()
                        .the_step_that_should_be_skipped_has_not_been_executed()
                        .and()
                        .the_report_includes_all_the_steps_of_the_scenario()
                        .and()
                        .the_first_step_is_passed()
                        .and()
                        .the_second_step_is_failed()
                        .and()
                        .the_third_step_is_skipped()
                        .and()
                        .it_has_exactly_one_case_and_it_is_$_successful(false);
                }
            ),

            asynchronous_scenarios_can_fail_during_a_secondary_async_action: scenario(
                {},
                () => {
                    given()
                        .a_scenario_runner()
                        .and()
                        .an_asynchronous_scenario_that_fails_during_a_secondary_async_action();

                    when().the_runner_tries_to_execute_the_scenario();

                    then()
                        .an_error_has_been_thrown()
                        .and()
                        .the_step_that_should_be_skipped_has_not_been_executed()
                        .and()
                        .the_report_includes_all_the_steps_of_the_scenario()
                        .and()
                        .the_first_step_is_passed()
                        .and()
                        .the_second_step_is_failed()
                        .and()
                        .the_third_step_is_skipped()
                        .and()
                        .it_has_exactly_one_case_and_it_is_$_successful(false);
                }
            ),
        };
    }
);
