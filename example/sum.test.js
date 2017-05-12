import {scenarios, setupForRspec, Stage} from 'js-given';

import {sum} from './sum';

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

    they_are_summed() {
        this.result = this.number1 + this.number2;
        return this;
    }

    the_result_is(expectedResult) {
        expect(this.result).toEqual(expectedResult);
        return this;
    }
}

scenarios('sum', SumStage, ({given, when, then}) => {
    return {
        two_numbers_can_be_saved() {
            given().a_number(1).and().another_number(2);

            when().they_are_summed();

            then().the_result_is(3);
        },
    };
});
