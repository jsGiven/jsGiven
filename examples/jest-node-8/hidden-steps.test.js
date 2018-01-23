import { scenario, scenarios, setupForRspec, Stage, Hidden } from 'js-given';

import { sum } from './sum';

setupForRspec(describe, it);

class SumStage extends Stage {
  a_number(value) {
    this.number1 = value;
    return this;
  }

  another_number(value) {
    this.number2 = value;
    return this;
  }

  @Hidden
  buildTechnicalObject(value) {
    return this;
  }

  they_are_summed() {
    this.result = this.number1 + this.number2;
    return this;
  }

  the_result_is(expectedResult) {
    expect(this.result).toEqual(expectedResult);
    return this;
  }
}

scenarios('sum with hidden steps', SumStage, ({ given, when, then }) => {
  return {
    two_numbers_can_be_added: scenario({}, () => {
      given()
        .a_number(1)
        .and()
        .another_number(2)
        .and()
        .buildTechnicalObject();

      when().they_are_summed();

      then().the_result_is(3);
    }),
  };
});
class StageClass extends Stage {
  aCompletelyHiddenStep() {
    return this;
  }
}
Hidden.addHiddenStep(StageClass, 'aCompletelyHiddenStep');

scenarios('hidden steps', StageClass, ({ given, when, then }) => {
  return {
    a_scenario: scenario({}, () => {
      given().aCompletelyHiddenStep();
      when();
      then();
    }),
  };
});
