// @flow
import {
    scenario,
    scenarios,
    Stage,
    parametrized1,
    parametrized2,
} from '../index.js';

class ParamStage extends Stage {
    do_something_with_number(value: number): this {
        return this;
    }

    do_something_with_number_and_string(value: number, str: string): this {
        return this;
    }
}

scenarios('group.name', ParamStage, ({given, when, then}) => ({
    a_scenario: scenario(
        {},
        parametrized1([1, 2, 3], (value: number) => {
            given().do_something_with_number(value);
            when().do_something_with_number(value);
            then().do_something_with_number(value);
        })
    ),

    // $ExpectError
    a_scenario_with_strings: scenario(
        {},
        parametrized1(['1', '2', '3'], (value: number) => {
            given().do_something_with_number(value);
            when().do_something_with_number(value);
            then().do_something_with_number(value);
        })
    ),

    a_scenario_with_two_values: scenario(
        {},
        parametrized2(
            [[1, 'one'], [2, 'two'], [3, 'three']],
            (value: number, str: string) => {
                given().do_something_with_number_and_string(value, str);
                when().do_something_with_number_and_string(value, str);
                then().do_something_with_number_and_string(value, str);
            }
        )
    ),

    a_scenario_with_two_values_and_missmatching_param: scenario(
        {},
        parametrized2(
            [
                // $ExpectError
                [1, true],
                [2, 'two'],
                [3, 'three'],
            ],
            (value: number, str: string) => {
                given().do_something_with_number_and_string(value, str);
                when().do_something_with_number_and_string(value, str);
                then().do_something_with_number_and_string(value, str);
            }
        )
    ),

    a_scenario_with_two_values_and_missmatching_case_function_param: scenario(
        {},
        parametrized2(
            [
                // $ExpectError
                [1, 'one'],
                // $ExpectError
                [2, 'two'],
                // $ExpectError
                [3, 'three'],
            ],
            (value: number, str: boolean) => {
                // $ExpectError
                given().do_something_with_number_and_string(value, str);
                when().do_something_with_number_and_string(value, str);
                then().do_something_with_number_and_string(value, str);
            }
        )
    ),
}));
