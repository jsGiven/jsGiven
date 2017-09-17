import { scenario, scenarios, setupForRspec, Stage } from 'js-given';

import { sum } from './sum';

setupForRspec(describe, it);

class SumStage extends Stage {
    number1: number;
    number2: number;
    result: number;

    a_number(value: number): this {
        this.number1 = value;
        return this;
    }

    another_number(value: number): this {
        this.number2 = value;
        return this;
    }

    they_are_summed(): this {
        this.result = sum(this.number1, this.number2);
        return this;
    }

    the_result_is(expectedResult: number): this {
        expect(this.result).toEqual(expectedResult);
        return this;
    }
}

scenarios('sum', SumStage, ({ given, when, then }) => {
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
});
