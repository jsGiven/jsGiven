// @flow
export class Stage {
    and(): this {
        return this;
    }

    but(): this {
        return this;
    }

    with(): this {
        return this;
    }

    given(): this {
        return this;
    }

    when(): this {
        return this;
    }

    then(): this {
        return this;
    }

    static addExtension<T>(subClass: Class<T>) {
        Object.setPrototypeOf(subClass.prototype, Stage.prototype);
        Object.setPrototypeOf(subClass, Stage);
    }
}
