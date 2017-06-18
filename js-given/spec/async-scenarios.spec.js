// @flow
import {expect} from 'chai';

import {
    scenario,
    scenarios,
    setupForRspec,
    setupForAva,
    doAsync,
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

class AsyncScenarioGivenStage extends BasicScenarioGivenStage {
    @State asyncExecution: {success: boolean} = {success: false};

    a_scenario_with_a_single_stage_with_async_actions(): this {
        const asyncExecution = this.asyncExecution;

        class MyStage extends Stage {
            counter: number = 0;

            the_counter_is_initialized_to_(value: number): this {
                this.counter = value;
                return this;
            }

            the_counter_is_incremented_asynchronously(): this {
                doAsync(async () => {
                    this.counter++;
                });
                return this;
            }

            the_counter_value_is(expectedValue: number): this {
                expect(this.counter).to.equal(expectedValue);
                asyncExecution.success = true;
                return this;
            }
        }
        this.scenarioRunner.scenarios(
            'group_name',
            MyStage,
            ({given, when, then}) => {
                return {
                    scenario_name: scenario({}, () => {
                        given().the_counter_is_initialized_to_(1337);
                        when().the_counter_is_incremented_asynchronously();
                        then().the_counter_value_is(1338);
                    }),
                };
            }
        );
        return this;
    }

    a_scenario_with_a_multiple_stages_with_async_actions(): this {
        const asyncExecution = this.asyncExecution;

        class GivenStage extends Stage {
            @State counter: number = 0;

            the_counter_is_initialized_to_(value: number): this {
                this.counter = value;
                return this;
            }
        }

        class WhenStage extends Stage {
            @State counter: number;

            the_counter_is_incremented_asynchronously(): this {
                doAsync(async () => {
                    this.counter++;
                });
                return this;
            }
        }

        class ThenStage extends Stage {
            @State counter: number;

            the_counter_value_is(expectedValue: number): this {
                expect(this.counter).to.equal(expectedValue);
                asyncExecution.success = true;
                return this;
            }
        }
        this.scenarioRunner.scenarios(
            'group_name',
            [GivenStage, WhenStage, ThenStage],
            ({given, when, then}) => {
                return {
                    scenario_name: scenario({}, () => {
                        given().the_counter_is_initialized_to_(1337);
                        when().the_counter_is_incremented_asynchronously();
                        then().the_counter_value_is(1338);
                    }),
                };
            }
        );
        return this;
    }
}

class AsyncScenarioThenStage extends BasicScenarioThenStage {
    @State asyncExecution: {success: boolean};

    the_async_actions_have_been_executed(): this {
        expect(this.asyncExecution.success).to.be.true;
        return this;
    }
}

scenarios(
    'core.scenarios.async',
    [AsyncScenarioGivenStage, BasicScenarioWhenStage, AsyncScenarioThenStage],
    ({given, when, then}) => ({
        scenarios_can_be_run_asynchronously: scenario({}, () => {
            given()
                .a_scenario_runner()
                .and()
                .a_scenario_with_a_single_stage_with_async_actions();

            when().the_scenario_is_executed();

            then().the_async_actions_have_been_executed();
        }),

        state_can_be_shared_between_stages_of_an_scenario_runing_asynchronously: scenario(
            {},
            () => {
                given()
                    .a_scenario_runner()
                    .and()
                    .a_scenario_with_a_multiple_stages_with_async_actions();

                when().the_scenario_is_executed();

                then().the_async_actions_have_been_executed();
            }
        ),
    })
);
