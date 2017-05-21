# [JsGiven](https://jsgiven.org) &middot; [![Build Status](https://travis-ci.org/jsGiven/jsGiven.svg?branch=master)](https://travis-ci.org/jsGiven/jsGiven)

JsGiven aims to bring BDD (Behavior-Driven Development) to plain (or typed) JavaScript.

It is a developer-friendly and pragmatic BDD tool for JavaScript.

Developers write scenarios in plain JavaScript using a fluent, domain-specific API, JsGiven generates reports that are readable by domain experts.

It's a JavaScript port of [JGiven](http://jgiven.org) (written in Java).
JsGiven keeps the JGiven philosophy, concepts and uses its html5 reporting tool.

You can have a look at [JSGiven's own report](https://jsgiven.org/jsgiven-report/)

```javascript
scenarios('recipes', RecipesStage, ({given, when, then}) => ({
  a_pancake_can_be_fried_out_of_an_egg_milk_and_flour() {
    given().an_egg().
      and().some_milk().
      and().the_ingredient('flour')

    when().the_cook_mangles_everything_to_a_dough().
      and().the_cook_fries_the_dough_in_a_pan()

    then().the_resulting_meal_is_a_pan_cake()
  }
}))
```

It can be used with any javascript test runner (like Jest, Ava, Mocha, Jasmine, or Protractor).

It can be used with your favorite assertion library (like ChaiJS, Jasmine), or your framework's assertion library.

It aims to provide the most comfortable developer experience with optional ES6 syntax, and optional FlowType or TypeScript typings.

It's an alpha version. Don't hesitate to give any feedback and to open a GitHub issue https://github.com/jsGiven/jsGiven/issues
