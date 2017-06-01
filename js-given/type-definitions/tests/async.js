// @flow
import {doAsync, scenarios, Stage} from '../index.js';

class AsyncStage extends Stage {
    somethingAsync(): this {
        // $ExpectError
        doAsync();

        // $ExpectError
        doAsync(() => {});

        doAsync(async () => {});
        return this;
    }
}

scenarios('group.name', AsyncStage, ({given, when, then}) => ({
    a_scenario() {
        given().somethingAsync();
        when().somethingAsync();
        then().somethingAsync();
    },
}));
