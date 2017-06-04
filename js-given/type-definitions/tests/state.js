// @flow

import {Stage, State} from '../index.js';

class SingleStage extends Stage {
    @State property: number;
}

// $ExpectError
State.unknownMethod(SingleStage, 'property');

// $ExpectError
State.addProperty();

// $ExpectError
State.addProperty(SingleStage);

State.addProperty(SingleStage, 'property');


class ClassThatDoesNotExtendsStage {}
// $ExpectError
State.addProperty(ClassThatDoesNotExtendsStage, 'property');
