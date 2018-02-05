// @flow
import { expect } from 'chai';

import {
  scenario,
  scenarios,
  setupForRspec,
  setupForAva,
  State,
  Stage,
  Before,
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

class LifeCycleGivenStage extends BasicScenarioGivenStage {
  @State
  sideEffectRecorder: {
    calledDuringBeforeInGivenStage: boolean,
    calledDuringBeforeInWhenStage: boolean,
    calledDuringBeforeInThenStage: boolean,
    calledDuringBefore: boolean,
  };

  initSideEffectRecorder() {
    this.sideEffectRecorder = {
      calledDuringBeforeInGivenStage: false,
      calledDuringBeforeInWhenStage: false,
      calledDuringBeforeInThenStage: false,
      calledDuringBefore: false,
    };
  }

  a_scenario_with_3_stages_that_contain_a_method_with_the_before_annotation(): this {
    this.initSideEffectRecorder();
    const self = this;

    class GivenStageThatRecordBeenCalled extends Stage {
      @Before
      before() {
        self.sideEffectRecorder.calledDuringBeforeInGivenStage = true;
      }
      ensure_before_method_has_been_called(): this {
        expect(self.sideEffectRecorder.calledDuringBeforeInGivenStage).to.be
          .true;
        return this;
      }
    }
    class WhenStageThatRecordBeenCalled extends Stage {
      @Before
      before() {
        self.sideEffectRecorder.calledDuringBeforeInWhenStage = true;
      }
      ensure_before_method_has_been_called(): this {
        expect(self.sideEffectRecorder.calledDuringBeforeInWhenStage).to.be
          .true;
        return this;
      }
    }
    class ThenStageThatRecordBeenCalled extends Stage {
      @Before
      before() {
        self.sideEffectRecorder.calledDuringBeforeInThenStage = true;
      }
      ensure_before_method_has_been_called(): this {
        expect(self.sideEffectRecorder.calledDuringBeforeInThenStage).to.be
          .true;
        return this;
      }
    }

    this.scenarioRunner.scenarios(
      'group_name',
      [
        GivenStageThatRecordBeenCalled,
        WhenStageThatRecordBeenCalled,
        ThenStageThatRecordBeenCalled,
      ],
      ({ given, when, then }) => {
        return {
          scenario_using_stages: scenario({}, () => {
            given().ensure_before_method_has_been_called();
            when().ensure_before_method_has_been_called();
            then().ensure_before_method_has_been_called();
          }),
        };
      }
    );

    return this;
  }

  a_scenario_with_a_stage_that_contains_a_method_with_the_before_annotation(): this {
    this.initSideEffectRecorder();
    const self = this;

    class BeforeStage extends Stage {
      @Before
      before(): this {
        self.sideEffectRecorder.calledDuringBefore = true;
        return this;
      }
      ensure_before_method_has_been_called(): this {
        expect(self.sideEffectRecorder.calledDuringBefore).to.be.true;
        return this;
      }
    }

    this.scenarioRunner.scenarios(
      'group_name',
      BeforeStage,
      ({ given, when, then }) => {
        return {
          scenario_using_stages: scenario({}, () => {
            then().ensure_before_method_has_been_called();
          }),
        };
      }
    );
    return this;
  }
}

class LifeCycleThenStage extends BasicScenarioThenStage {
  @State sideEffectRecorder;

  the_method_annotated_with_the_before_annotation_has_been_called_on_the_3_stages_before_the_scenario_execution(): this {
    expect(this.sideEffectRecorder.calledDuringBeforeInGivenStage).to.be.true;
    expect(this.sideEffectRecorder.calledDuringBeforeInWhenStage).to.be.true;
    expect(this.sideEffectRecorder.calledDuringBeforeInThenStage).to.be.true;
    return this;
  }

  the_method_annotated_with_the_before_annotation_has_been_called_before_the_scenario_execution(): this {
    expect(this.sideEffectRecorder.calledDuringBefore);
    return this;
  }
}

scenarios(
  'core.scenarios.life-cycle',
  [LifeCycleGivenStage, BasicScenarioWhenStage, LifeCycleThenStage],
  ({ given, when, then }) => {
    return {
      before_methods_can_be_defined_on_given_when_then_stage_classes: scenario(
        {},
        () => {
          given()
            .a_scenario_runner()
            .and()
            .a_scenario_with_3_stages_that_contain_a_method_with_the_before_annotation();

          when().the_scenario_is_executed();

          then().the_method_annotated_with_the_before_annotation_has_been_called_on_the_3_stages_before_the_scenario_execution();
        }
      ),

      before_methods_can_be_defined_on_a_single_stage: scenario({}, () => {
        given()
          .a_scenario_runner()
          .and()
          .a_scenario_with_a_stage_that_contains_a_method_with_the_before_annotation();

        when().the_scenario_is_executed();

        then().the_method_annotated_with_the_before_annotation_has_been_called_before_the_scenario_execution();
      }),
    };
  }
);
