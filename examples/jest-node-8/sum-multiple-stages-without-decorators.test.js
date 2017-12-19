import { scenario, scenarios, setupForRspec, Stage, State } from 'js-given';

import { sum } from './sum';

setupForRspec(describe, it);

class SumGivenStage extends Stage {
    a_number(value) {
        this.number1 = value;
        return this;
    }

    another_number(value) {
        this.number2 = value;
        return this;
    }
}
State.addProperty(SumGivenStage, 'number1');
State.addProperty(SumGivenStage, 'number2');

class SumWhenStage extends Stage {
    they_are_summed() {
        this.result = this.number1 + this.number2;
        return this;
    }
}
State.addProperty(SumWhenStage, 'number1');
State.addProperty(SumWhenStage, 'number2');
State.addProperty(SumWhenStage, 'result');

class SumThenStage extends Stage {
    the_result_is(expectedResult) {
        expect(this.result).toEqual(expectedResult);
        return this;
    }
}
State.addProperty(SumThenStage, 'result');

scenarios(
    'sum',
    [SumGivenStage, SumWhenStage, SumThenStage],
    ({ given, when, then }) => {
        return {
            two_numbers_can_be_added: scenario({}, () => {
                given()
                    .a_number(1)
                    .and()
                    .another_number(2);

                when().they_are_summed();

                then().the_result_is(3);
            }),
        };
    }
);
