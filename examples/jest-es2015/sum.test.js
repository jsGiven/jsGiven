// tag::ImportJsGiven[]
import { scenario, scenarios, setupForRspec, Stage } from 'js-given';
// end::ImportJsGiven[]

import { sum } from './sum';

// tag::setupForRspec[]
setupForRspec(describe, it);
// end::setupForRspec[]

// tag::SumStage[]
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
// end::SumStage[]

// tag::scenarios[]
// tag::scenariosCallFirstPart[]
scenarios('sum', SumStage, ({ given, when, then }) => {
    // end::scenariosCallFirstPart[]
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
    // tag::scenariosCallSecondPart[]
});
// end::scenariosCallSecondPart[]
// end::scenarios[]
