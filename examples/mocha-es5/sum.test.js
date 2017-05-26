// tag::ImportJsGivenES5[]
var JsGiven = require('js-given');
var scenarios = JsGiven.scenarios;
var setupForRspec = JsGiven.setupForRspec;
var Stage = JsGiven.Stage;
// end::ImportJsGivenES5[]

var expect = require('chai').expect;

var sum = require('./sum').sum;

setupForRspec(describe, it);

// tag::SumStageES5[]
function SumStage() {
}
SumStage.prototype = {
    a_number(value) {
        this.number1 = value;
        return this;
    },

    another_number(value) {
        this.number2 = value;
        return this;
    },

    they_are_summed() {
        this.result = this.number1 + this.number2;
        return this;
    },

    the_result_is(expectedResult) {
        expect(this.result).to.equal(expectedResult);
        return this;
    },
}
Object.setPrototypeOf(SumStage.prototype, Stage.prototype);
Object.setPrototypeOf(SumStage, Stage);
// end::SumStageES5[]

// tag::scenariosES5[]
scenarios('sum', SumStage, function (it) {
    return {
        two_numbers_can_be_added() {
            it.given().a_number(1).and().another_number(2);

            it.when().they_are_summed();

            it.then().the_result_is(3);
        },
    };
});
// end::scenariosES5[]
