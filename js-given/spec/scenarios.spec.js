// @flow
import {expect} from 'chai';
import sinon from 'sinon';

import {
    scenarios,
    setupForRspec,
    setupForAva,
    parametrized1,
    State,
    Stage,
} from '../src';

import {BasicScenarioGivenStage, BasicScenarioWhenStage, BasicScenarioThenStage} from './basic-stages';

if (global.describe && global.it) {
    setupForRspec(describe, it);
} else {
    const test = require('ava');
    setupForAva(test);
}

class DummyScenarioGivenStage extends BasicScenarioGivenStage {
    @State scenarioFunc;

    a_dummy_scenario(): this {
        class DefaultStage extends Stage {}
        this.scenarioFunc = sinon.spy();
        this.scenarioRunner.scenarios('group_name', DefaultStage, () => {
            return {
                scenario_name: this.scenarioFunc,
            };
        });
        return this;
    }
}

class DummyScenarioThenStage extends BasicScenarioThenStage {
    @State scenarioFunc;

    the_dummy_scenario_function_has_been_called(): this {
        expect(this.scenarioFunc).to.have.been.called;
        return this;
    }
}

scenarios('core.scenarios', [DummyScenarioGivenStage, BasicScenarioWhenStage, DummyScenarioThenStage], ({given, when, then}) => {
    return {
        scenarios_can_be_run_over_any_scenario_runner() {
            given().a_scenario_runner()
                .and().a_dummy_scenario();

            when().the_scenario_is_executed();

            then().the_describe_method_has_been_called()
                .and().the_it_method_has_been_called()
                .and().the_dummy_scenario_function_has_been_called();
        },
    };
});

class StageRecorderGivenStage extends BasicScenarioGivenStage {
    @State somethingGivenCalled;
    @State somethingWhenCalled;
    @State somethingThenCalled;
    GivenStageThatRecordBeenCalled: Class<any>;
    WhenStageThatRecordBeenCalled: Class<any>;
    ThenStageThatRecordBeenCalled: Class<any>;

    three_stages_that_record_been_called(): this {
        this.somethingGivenCalled = false;
        const self = this;
        this.GivenStageThatRecordBeenCalled = class GivenStageThatRecordBeenCalled extends Stage {
            somethingGiven(): this {
                self.somethingGivenCalled = true;
                return this;
            }
        };
        this.somethingWhenCalled = false;
        this.WhenStageThatRecordBeenCalled = class WhenStageThatRecordBeenCalled extends Stage {
            somethingWhen(): this { self.somethingWhenCalled = true; return this; }
        };
        this.somethingThenCalled = false;
        this.ThenStageThatRecordBeenCalled = class ThenStageThatRecordBeenCalled extends Stage {
            somethingThen(): this { self.somethingThenCalled = true; return this; }
        };

        return this;
    }

    a_scenario_that_uses_the_stages_that_records(): this {
        this.scenarioRunner.scenarios('group_name', [this.GivenStageThatRecordBeenCalled, this.WhenStageThatRecordBeenCalled, this.ThenStageThatRecordBeenCalled], ({given, when, then}) => {
            return {
                scenario_using_stages() {
                    given().somethingGiven();
                    when().somethingWhen();
                    then().somethingThen();
                },
            };
        });
        return this;
    }
}

class StageRecorderThenStage extends BasicScenarioThenStage {
    @State somethingGivenCalled;
    @State somethingWhenCalled;
    @State somethingThenCalled;

    the_three_stages_have_been_called(): this {
        expect(this.somethingGivenCalled).to.be.true;
        expect(this.somethingWhenCalled).to.be.true;
        expect(this.somethingThenCalled).to.be.true;
        return this;
    }
}

scenarios('core.scenarios.stages', [StageRecorderGivenStage, BasicScenarioWhenStage, StageRecorderThenStage], ({given, when, then}) => {
    return {
        scenarios_can_use_given_when_then_stages_with_methods() {
            given().a_scenario_runner()
                .and().three_stages_that_record_been_called()
                .and().a_scenario_that_uses_the_stages_that_records();

            when().the_scenario_is_executed();

            then().the_three_stages_have_been_called();
        },
    };
});

class StatefullScenarioGivenStage extends BasicScenarioGivenStage {
    GivenStageStateFull: Class<any>;
    WhenStageStateFull: Class<any>;
    ThenStageStateFull: Class<any>;
    @State expectedValueFromWhenStage;
    @State expectedValueFromGivenStage;

    three_stateful_stages(): this {
        const self = this;
        this.GivenStageStateFull = class GivenStageStateFull extends Stage {
            @State givenValue: number;
            @State expectedValue: number;
            aValue(): this {
                this.givenValue = 1;
                this.expectedValue = 2;
                return this;
            }
        };
        this.WhenStageStateFull = class WhenStageStateFull extends Stage {
            @State givenValue: number;
            @State computedValue: number;
            it_gets_incremented(): this {
                this.computedValue = this.givenValue + 1;
                return this;
            }
        };
        this.expectedValueFromWhenStage;
        this.expectedValueFromGivenStage;
        this.ThenStageStateFull = class ThenStageStateFull extends Stage {
            @State expectedValue: number;
            @State computedValue: number;
            the_value_is_incremented(): this {
                self.expectedValueFromWhenStage = this.computedValue;
                self.expectedValueFromGivenStage = this.expectedValue;
                return this;
            }
        };
        return this;
    }

    a_scenario_that_uses_stateful_stages(): this {
        this.scenarioRunner.scenarios('group_name', [this.GivenStageStateFull, this.WhenStageStateFull, this.ThenStageStateFull], ({given, when, then}) => {
            return {
                scenario_using_stages() {
                    given().aValue();
                    when().it_gets_incremented();
                    then().the_value_is_incremented();
                },
            };
        });
        return this;
    }
}

class StatefullScenarioThenStage extends BasicScenarioThenStage {
    @State expectedValueFromWhenStage;
    @State expectedValueFromGivenStage;

    the_state_has_been_propagated(): this {
        expect(this.expectedValueFromGivenStage).to.equal(2);
        expect(this.expectedValueFromWhenStage).to.equal(2);
        return this;
    }
}

scenarios('core.scenarios.state', [StatefullScenarioGivenStage, BasicScenarioWhenStage, StatefullScenarioThenStage], ({given, when, then}) => {
    return {
        scenarios_can_share_state_between_stages() {
            given().a_scenario_runner()
                .and().three_stateful_stages()
                .and().a_scenario_that_uses_stateful_stages();

            when().the_scenario_is_executed();

            then().the_state_has_been_propagated();
        },
    };
});

class ParametrizedScenarioGivenStage extends BasicScenarioGivenStage {
    a_parametrized_scenario_with_3_parts_and_3_cases(): this {
        class MyStage extends Stage {
            coffeePrice: number;
            a_coffee_that_costs_$_euros(coffeePrice: number): this {
                this.coffeePrice = coffeePrice;
                return this;
            }

            billedPrice: number;
            billed(): this {
                this.billedPrice = this.coffeePrice;
                return this;
            }

            the_billed_price_is_$_euros(billedPrice: number): this {
                expect(this.billedPrice).to.equal(billedPrice);
                return this;
            }
        }
        this.scenarioRunner.scenarios('group_name', MyStage, ({given, when, then}) => {
            return {
                scenario_name: parametrized1([1,2,3], (coffeeValue) => {
                    given().a_coffee_that_costs_$_euros(coffeeValue);
                    when().billed();
                    then().the_billed_price_is_$_euros(coffeeValue);
                }),
            };
        });
        return this;
    }
}

class ParametrizedScenarioThenStage extends BasicScenarioThenStage {
    the_scenario_contains_3_cases(): this {
        const cases = this.getScenario().cases;
        expect(cases).to.have.length(3);
        return this;
    }

    each_case_contains_3_parts(): this {
        const cases = this.getScenario().cases;
        const partLengthPerCase = cases.map(c => c.parts.length);
        expect(partLengthPerCase).to.deep.equal([3,3,3]);
        return this;
    }

    the_given_part_contains_a_word_including_the_parameter_name(): this {
        const cases = this.getScenario().cases;
        cases.forEach(c => {
            const part = this.findPartByKindInCase(c, 'GIVEN');
            const [step] = part.steps;
            const wordWithParameter = step.words.find(word => !! word.parameterName);
            expect(wordWithParameter).to.exist;
            if (wordWithParameter) {
                expect(wordWithParameter.parameterName).to.equal('coffeeValue');
            }
        });
        return this;
    }
}

scenarios('core.scenarios.parametrized', [ParametrizedScenarioGivenStage, BasicScenarioWhenStage, ParametrizedScenarioThenStage], ({given, when, then}) => ({
    scenarios_can_be_parametrized() {
        given()
            .a_scenario_runner().and()
            .a_parametrized_scenario_with_3_parts_and_3_cases();

        when().the_scenario_is_executed();

        then()
            .the_it_method_has_been_called_$_times_with_parameters_$(3, ['Scenario name #1', 'Scenario name #2', 'Scenario name #3']).and()
            .the_report_for_this_scenerio_has_been_generated().and()
            .the_scenario_contains_3_cases().and()
            .each_case_contains_3_parts().and()
            .the_given_part_contains_a_word_including_the_parameter_name();
    },
}));
