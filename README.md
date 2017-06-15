# [JsGiven](https://jsgiven.org)
[![Build Status](https://travis-ci.org/jsGiven/jsGiven.svg?branch=master)](https://travis-ci.org/jsGiven/jsGiven) 
[![Code Climate](https://codeclimate.com/github/jsGiven/jsGiven/badges/gpa.svg)](https://codeclimate.com/github/jsGiven/jsGiven) 
[![Known Vulnerabilities](https://snyk.io/test/github/jsgiven/jsgiven/badge.svg?targetFile=js-given%2Fpackage.json)](https://snyk.io/test/github/jsgiven/jsgiven?targetFile=js-given%2Fpackage.json) 
[![Coverage Status](https://coveralls.io/repos/github/jsGiven/jsGiven/badge.svg?branch=master)](https://coveralls.io/github/jsGiven/jsGiven?branch=master) 

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/jsGiven/jsGiven/master/LICENSE)
[![npm version](https://badge.fury.io/js/js-given.svg)](https://badge.fury.io/js/js-given) 
![Quality](https://img.shields.io/badge/quality-beta-orange.svg)

JsGiven aims to bring BDD (Behavior-Driven Development) to plain (or typed) JavaScript.

It is a developer-friendly and pragmatic BDD tool for JavaScript.

Developers write scenarios in plain JavaScript using a fluent, domain-specific API, JsGiven generates reports that are readable by domain experts.

It's a JavaScript port of [JGiven](http://jgiven.org) (written in Java).
JsGiven keeps the JGiven philosophy, concepts and uses its html5 reporting tool.

You can have a look at [JSGiven's own report](https://jsgiven.org/jsgiven-report/)

```javascript
scenarios('recipes', RecipesStage, ({given, when, then}) => ({
    a_pancake_can_be_fried_out_of_an_egg_milk_and_flour: scenario({}, () => {
        given().an_egg().
            and().some_milk().
            and().the_ingredient('flour')

        when().the_cook_mangles_everything_to_a_dough().
            and().the_cook_fries_the_dough_in_a_pan()

        then().the_resulting_meal_is_a_pan_cake()
    })
}))
```

It can be used with any javascript test runner (like Jest, Ava, Mocha, Jasmine, or Protractor).

It can be used with your favorite assertion library (like ChaiJS, Jasmine), or your framework's assertion library.

It aims to provide the most comfortable developer experience with optional ES6 syntax, and optional FlowType or TypeScript typings.


Some features are missing, but we are already using it daily at https://www.fluo.com

Don't hesitate to give any feedback and to open a GitHub issue https://github.com/jsGiven/jsGiven/issues

## Getting started

You can start using JsGiven with the user guide https://jsgiven.org/user-guide.html
