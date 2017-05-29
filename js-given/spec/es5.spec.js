// @flow
import { expect } from 'chai';

import {
    scenarios,
    setupForRspec,
    setupForAva,
    Stage,
    State,
} from '../src';

import {BasicScenarioGivenStage, BasicScenarioWhenStage, BasicScenarioThenStage} from './basic-stages';

if (global.describe && global.it) {
    setupForRspec(describe, it);
} else {
    const test = require('ava');
    setupForAva(test);
}

class ES5GivenStage extends BasicScenarioGivenStage {
    @State calledRecorder: {
        called: boolean;
    };
    ES5Stage: Class<any>;

    an_es5_stage_class(): this {
        this.calledRecorder = {
            called: false,
        };
        const self = this;

        function ES5Stage() {
        }
        ES5Stage.prototype = {
            an_action_is_performed() {
                self.calledRecorder.called = true;
            },
        };
        Object.setPrototypeOf(ES5Stage.prototype, Stage.prototype);
        Object.setPrototypeOf(ES5Stage, Stage);

        this.ES5Stage = ES5Stage;

        return this;
    }

    a_scenario_that_uses_this_stage_class(): this {
        this.scenarioRunner.scenarios('group_name', this.ES5Stage, ({given, when, then}) => {
            return {
                scenario_using_stages() {
                    given();
                    when().an_action_is_performed();
                    then();
                },
            };
        });
        return this;
    }
}

class ES5ThenStage extends BasicScenarioThenStage {
    @State calledRecorder: {
        called: boolean;
    };

    the_es_5_stage_has_been_used(): this {
        expect(this.calledRecorder.called).to.be.true;
        return this;
    }
}


scenarios('core.support.es5', [ES5GivenStage, BasicScenarioWhenStage, ES5ThenStage], ({ given, when, then }) => {
    return {
        scenarios_can_use_es5_stage_classes() {
            given().a_scenario_runner()
                .and().an_es5_stage_class()
                .and().a_scenario_that_uses_this_stage_class();

            when().the_scenario_is_executed();

            then().the_es_5_stage_has_been_used();
        },
    };
});
