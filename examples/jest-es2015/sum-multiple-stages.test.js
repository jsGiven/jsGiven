import {scenarios, setupForRspec, Stage, State} from 'js-given';

import {sum} from './sum';

setupForRspec(describe, it);

// tag::SumStages[]
class SumGivenStage extends Stage {
    @State
    number1;

    @State
    number2;

    a_number(value) {
        this.number1 = value;
        return this;
    }

    another_number(value) {
        this.number2 = value;
        return this;
    }
}

class SumWhenStage extends Stage {
    @State
    number1;

    @State
    number2;

    @State
    result;

    they_are_summed() {
        this.result = this.number1 + this.number2;
        return this;
    }
}

class SumThenStage extends Stage {
    @State
    result: 0;

    the_result_is(expectedResult) {
        expect(this.result).toEqual(expectedResult);
        return this;
    }
}
// end::SumStages[]

// tag::SumMultipleStagesScenario[]
// tag::SumMultipleStagesScenarioDeclaration[]
scenarios('sum', [SumGivenStage, SumWhenStage, SumThenStage], ({given, when, then}) => {
// end::SumMultipleStagesScenarioDeclaration[]
    return {
        two_numbers_can_be_added() {
            given().a_number(1).and().another_number(2);

            when().they_are_summed();

            then().the_result_is(3);
        },
    };
});
// end::SumMultipleStagesScenario[]
