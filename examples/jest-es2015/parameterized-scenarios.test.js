import {
    scenario,
    scenarios,
    setupForRspec,
    parametrized,
    parametrized1,
    Stage,
} from 'js-given';

setupForRspec(describe, it);

// tag::DemoStage[]
class DemoStage extends Stage {
    number1;
    number2;
    result;

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

    they_are_successfully_added(): this {
        expect(this.result).toEqual(this.number1 + this.number2);
        return this;
    }
}
// end::DemoStage[]

// tag::ParametrizedScenario[]
scenarios('parametrized-scenarios', DemoStage, ({given, when, then}) => {
    return {
        scenarios_can_be_parametrized: scenario(
            {},
            parametrized([[1, 2], [2, 4], [3, 6]], (value, result) => {
                given().a_number(value).and().another_number(value);
                when().they_are_summed();
                then().the_result_is(result);
            })
        ),
    };
});
// end::ParametrizedScenario[]

// tag::Parametrized1Scenario[]
scenarios('parametrized-scenarios', DemoStage, ({given, when, then}) => {
    return {
        scenarios_can_be_parametrized_with_only_one_value: scenario(
            {},
            parametrized1([1, 2, 3], value => {
                given().a_number(value).and().another_number(value);
                when().they_are_summed();
                then().they_are_successfully_added();
            })
        ),
    };
});
// end::Parametrized1Scenario[]
