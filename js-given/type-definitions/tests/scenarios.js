// @flow
import {scenarios, Stage} from '../index.js';

// $ExpectError missing param
scenarios();

// $ExpectError missing param
scenarios('group.name');

class SingleStage extends Stage {
    something(): this {
        return this;
    }
}

// $ExpectError missing param
scenarios('group.name', SingleStage);

// $ExpectError invalid function
scenarios('group.name', SingleStage, ({given, when, then}) => {

});

scenarios('group.name', SingleStage, ({given, when, then}) => ({
    a_scenario() {
        given().something();
        when().something();
        then().something();
    },
}));

scenarios('group.name', SingleStage, ({given, when, then}) => ({
    a_scenario() {
        // $ExpectError
        given().a_step_not_present_in_stage();
    },
}));

class GivenStage extends Stage {
    something_in_given(): this {
        return this;
    }
}

class WhenStage extends Stage {
    something_in_when(): this {
        return this;
    }
}

class ThenStage extends Stage {
    something_in_then(): this {
        return this;
    }
}

// $ExpectError
scenarios('group.name', [GivenStage, WhenStage], ({given, when, then}) => ({
}));

scenarios('group.name', [GivenStage, WhenStage, ThenStage], ({given, when, then}) => ({
    a_scenario() {
        given().something_in_given();
        // $ExpectError
        when().something_in_given();

        when().something_in_when();

        then().something_in_then();
    },
}));
