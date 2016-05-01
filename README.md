[![Build Status](https://travis-ci.org/jsGiven/jsGiven.svg?branch=master)](https://travis-ci.org/jsGiven/jsGiven)


# jsGiven

A JavaScript frontend to [JGiven](http://jgiven.org/)

It aims to provide a BDD frontend (behaving very much like jGiven) producing json reports compatible with JGiven's web application.
```javascript
scenarios('recipes', {given, when, then} => {
  return {
     a_pancake_can_be_fried_out_of_an_egg_milk_and_flour() {
      given().an_egg().
        and().some_milk().
        and().the_ingredient('flour')

      when().the_cook_mangles_everthing_to_a_dough().
        and().the_cook_fries_the_dough_in_a_pan()

      then().the_resulting_meal_is_a_pan_cake()
  }
})
```

It's not a test runner, it's not replacing Jest, Ava, Tap, Mocha, Jasmine, Karma, Webdriver, Nightwatch or Protractor.
It aims to be usable with those runners.

It's neither a test assertion library, it's not aimed to replace ChaiJS, Jasmine or the test runner assertion library.
It aims to be usable with your favourite assertion library.

It aims to provide the most confortable developper experience with optional ES6 syntax, and optional FlowType or TypeScript typings.

It's not usable yet !
