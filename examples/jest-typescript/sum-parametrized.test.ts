import {
    scenario,
    scenarios,
    setupForRspec,
    Stage,
    parametrized3,
} from 'js-given';

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

scenarios('sum-parametrized', SumStage, ({ given, when, then }) => {
    return {
        two_numbers_can_be_added: scenario(
            {},
            parametrized3([[1, 2, 3], [2, 3, 5]], (x, y, result) => {
                given()
                    .a_number(x)
                    .and()
                    .another_number(y);

                when().they_are_summed();

                then().the_result_is(result);
            })
        ),
    };
});
