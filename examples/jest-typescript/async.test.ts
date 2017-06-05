import {
    doAsync,
    scenario,
    scenarios,
    setupForRspec,
    Stage,
} from 'js-given';

import {sum} from './sum';

setupForRspec(describe, it);

async function httpRequest(url: string) {
    return {statusCode: 200};
}

class AsyncStage extends Stage {
    url: string;
    statusCode: number;

    the_url(url: string) {
        this.url = url;
        return this;
    }

    making_an_http_request_to_that_url() {
        doAsync(async () => {
            const {statusCode} = await httpRequest(this.url);
            this.statusCode = statusCode;
        });
        return this;
    }

    the_status_code_is(expectedStatusCode: number) {
        expect(this.statusCode).toEqual(expectedStatusCode);
        return this;
    }
}


scenarios('async', AsyncStage, ({given, when, then}) => {
    return {
        an_async_scenario_can_be_executed: scenario({}, () => {
            given().the_url('https://jsgiven.org');

            when().making_an_http_request_to_that_url();

            then().the_status_code_is(200);
        }),
    };
});

class PromiseStage extends Stage {
    url: string;
    statusCode: number;

    the_url(url: string) {
        this.url = url;
        return this;
    }

    making_an_http_request_to_that_url() {
        doAsync(() => {
            return httpRequest(this.url).then(({statusCode}) => {
                this.statusCode = statusCode;
            });
        });
        return this;
    }

    the_status_code_is(expectedStatusCode: number) {
        expect(this.statusCode).toEqual(expectedStatusCode);
        return this;
    }
}

scenarios('async', PromiseStage, ({given, when, then}) => {
    return {
        an_async_scenario_with_promises_can_be_executed: scenario({}, () => {
            given().the_url('https://jsgiven.org');

            when().making_an_http_request_to_that_url();

            then().the_status_code_is(200);
        }),
    };
});