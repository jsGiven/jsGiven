// @flow
import { expect } from 'chai';

import {
  scenario,
  scenarios,
  setupForRspec,
  setupForAva,
  Stage,
  State,
  Hidden,
  Quoted,
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

class ES5GivenStage extends BasicScenarioGivenStage {
  @State
  calledRecorder: {
    called: boolean,
  };
  ES5Stage: Function;
  ES5GivenStage: Function;
  ES5WhenStage: Function;
  ES5ThenStage: Function;

  an_es5_stage_class(): this {
    this.calledRecorder = {
      called: false,
    };

    const self = this;

    // $FlowIgnore
    function ES5Stage() {}
    ES5Stage.prototype = {
      an_action_is_performed(): ES5Stage {
        self.calledRecorder.called = true;
        return this;
      },
      anHiddenStep(): ES5Stage {
        return this;
      },
      some_value_$(value: string): ES5Stage {
        return this;
      },
    };
    Object.setPrototypeOf(ES5Stage.prototype, Stage.prototype);
    Object.setPrototypeOf(ES5Stage, Stage);

    // $FlowIgnore
    Hidden.addHiddenStep(ES5Stage, 'anHiddenStep');
    // $FlowIgnore
    Quoted.formatParameter(ES5Stage, 'some_value_$', 'value');

    this.ES5Stage = ES5Stage;

    return this;
  }

  a_scenario_that_uses_this_stage_class(): this {
    this.scenarioRunner.scenarios(
      'group_name',
      this.ES5Stage,
      ({ given, when, then }) => {
        return {
          scenario_using_stages: scenario({}, () => {
            given();
            when().an_action_is_performed();
            then();
          }),
        };
      }
    );
    return this;
  }

  a_scenario_that_uses_hidden_steps(): this {
    this.scenarioRunner.scenarios(
      'group_name',
      this.ES5Stage,
      ({ given, when, then }) => {
        return {
          scenario_name: scenario({}, () => {
            given();
            when()
              .an_action_is_performed()
              .and()
              .anHiddenStep();
            then();
          }),
        };
      }
    );
    return this;
  }

  a_scenario_that_uses_formatted_parameters(): this {
    this.scenarioRunner.scenarios(
      'group_name',
      this.ES5Stage,
      ({ given, when, then }) => {
        return {
          scenario_name: scenario({}, () => {
            given().some_value_$(1337);
            when();
            then();
          }),
        };
      }
    );
    return this;
  }

  three_state_full_es5_stage_classes(): this {
    this.calledRecorder = {
      called: false,
    };
    const self = this;

    // $FlowIgnore
    function ES5GivenStage() {}
    ES5GivenStage.prototype = {
      a_number: function(value: number) {
        this.value = value;
      },
    };
    Object.setPrototypeOf(ES5GivenStage.prototype, Stage.prototype);
    Object.setPrototypeOf(ES5GivenStage, Stage);
    // $FlowIgnore
    State.addProperty(ES5GivenStage, 'value');
    this.ES5GivenStage = ES5GivenStage;

    // $FlowIgnore
    function ES5WhenStage() {}
    ES5WhenStage.prototype = {
      it_is_incremented() {
        this.value++;
      },
    };
    Object.setPrototypeOf(ES5WhenStage.prototype, Stage.prototype);
    Object.setPrototypeOf(ES5WhenStage, Stage);
    // $FlowIgnore
    State.addProperty(ES5WhenStage, 'value');
    this.ES5WhenStage = ES5WhenStage;

    // $FlowIgnore
    function ES5ThenStage() {}
    ES5ThenStage.prototype = {
      its_new_value_is(value: number) {
        expect(this.value).to.equal(value);
        self.calledRecorder.called = true;
      },
    };
    Object.setPrototypeOf(ES5ThenStage.prototype, Stage.prototype);
    Object.setPrototypeOf(ES5ThenStage, Stage);
    // $FlowIgnore
    State.addProperty(ES5ThenStage, 'value');
    this.ES5ThenStage = ES5ThenStage;

    return this;
  }

  a_scenario_that_uses_these_stage_classes(): this {
    this.scenarioRunner.scenarios(
      'group_name',
      [this.ES5GivenStage, this.ES5WhenStage, this.ES5ThenStage],
      ({ given, when, then }) => {
        return {
          scenario_using_stages: scenario({}, () => {
            given().a_number(1);
            when().it_is_incremented();
            then().its_new_value_is(2);
          }),
        };
      }
    );
    return this;
  }
}

class ES5ThenStage extends BasicScenarioThenStage {
  @State
  calledRecorder: {
    called: boolean,
  };

  the_es_5_stage_has_been_used(): this {
    expect(this.calledRecorder.called).to.be.true;
    return this;
  }

  the_report_does_not_include_the_hidden_steps(): this {
    const { steps } = this.findPartByKind('WHEN');
    expect(steps.map(({ name }) => name)).to.deep.equal([
      'When an action is performed',
    ]);
    return this;
  }

  the_report_includes_formatted_parameters(): this {
    const { steps } = this.findPartByKind('GIVEN');
    expect(steps.map(({ name }) => name)).to.deep.equal([
      'Given some value "1337"',
    ]);
    return this;
  }
}

scenarios(
  'core.support.es5',
  [ES5GivenStage, BasicScenarioWhenStage, ES5ThenStage],
  ({ given, when, then }) => {
    return {
      scenarios_can_use_an_es5_stage_class: scenario({}, () => {
        given()
          .a_scenario_runner()
          .and()
          .an_es5_stage_class()
          .and()
          .a_scenario_that_uses_this_stage_class();

        when().the_scenario_is_executed();

        then().the_es_5_stage_has_been_used();
      }),

      scenarios_can_use_es5_stage_classes_and_share_state: scenario({}, () => {
        given()
          .a_scenario_runner()
          .and()
          .three_state_full_es5_stage_classes()
          .and()
          .a_scenario_that_uses_these_stage_classes();

        when().the_scenario_is_executed();

        then().the_es_5_stage_has_been_used();
      }),

      scenarios_can_use_an_es5_stage_class_with_hidden_steps: scenario(
        {},
        () => {
          given()
            .a_scenario_runner()
            .and()
            .an_es5_stage_class()
            .and()
            .a_scenario_that_uses_hidden_steps();

          when().the_scenario_is_executed();

          then().the_report_does_not_include_the_hidden_steps();
        }
      ),

      scenarios_can_use_an_es5_stage_class_with_steps_using_formatted_parameters: scenario(
        {},
        () => {
          given()
            .a_scenario_runner()
            .and()
            .an_es5_stage_class()
            .and()
            .a_scenario_that_uses_formatted_parameters();

          when().the_scenario_is_executed();

          then().the_report_includes_formatted_parameters();
        }
      ),
    };
  }
);
