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

  then(...args: any[]): this {
    if (args.length > 0) {
      throw new Error(
        'Someone is calling jsGiven.Stage.then() with arguments. Maybe you are returning a Stage (return this ?) instead of a Promise.'
      );
    }
    return this;
  }
}
