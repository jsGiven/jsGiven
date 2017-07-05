import { scenario, scenarios, setupForRspec, Stage, State } from 'js-given';

import { sum } from './sum';

setupForRspec(describe, it);

class SumGivenStage extends Stage {
    @State number1: number;
    @State number2: number;

    a_number(value: number): this {
        this.number1 = value;
        return this;
    }

    another_number(value: number): this {
        this.number2 = value;
        return this;
    }
}

class SumWhenStage extends Stage {
    @State number1: number;
    @State number2: number;
    @State result: number;

    they_are_summed(): this {
        this.result = sum(this.number1, this.number2);
        return this;
    }
}

class SumThenStage extends Stage {
    @State result: number;

    the_result_is(expectedResult: number): this {
        expect(this.result).toEqual(expectedResult);
        return this;
    }
}

scenarios(
    'sum-multiple-stages',
    [SumGivenStage, SumWhenStage, SumThenStage],
    ({ given, when, then }) => {
        return {
            two_numbers_can_be_added: scenario({}, () => {
                given().a_number(1).and().another_number(2);

                when().they_are_summed();

                then().the_result_is(3);
            }),
        };
    }
);
