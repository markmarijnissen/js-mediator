js-mediator
===============

> A design pattern to decouple your app using the mediator pattern.

At less than 2kb minified, this tiny utility library allows you to write well-designed apps.

## Getting started

Install using bower or npm

```bash
  bower install js-mediator
  npm install js-mediator
```

Or include the `mediator.js` script on your page.

## The Idea:

> A module **can never** reference an other module.

| Modules | Mediators|
|---------|----------|
| Decoupled| Coupled |
| Standalone | App-specific|
| Reusable | Throw-away|
| Clean | Dirty |

1. Write standalone modules with a public API that emit events. 
2. Couple those modules explicitly with a Mediator.

## Tips:

* Avoid referencing other modules **at all costs!**. 
* Method and event names should make sense **in the context of the current module**. Example: A button should emit a `clicked` event, not a `sendTweet` event.
* Create multiple mediators - one for every app domain.
* Try to keep Mediator code at a minimum. When Mediators get to big, refactor into reusable Modules.
* All hotfixes, hacks, patches, workarounds should be written in a Mediator.

## Benefits:

The Mediator pattern enforces a clear seperation of concerns. Modules have **no reference at all** of other modules. This forces you to think in differently at times - but the benefits are worth it:

* Clean, standalone code.
* Modules are reusable in other projects.
* Implementation can be easily swapped - simply implement the same public API and events.
* Modules are encapsulated and therefore easy to test.
* You are allowed to experiment, discover, learn, hack..... (in the Mediators)
* ....and when you tackled to problem, you can refactor the code into clean modules.

When tackling a difficult problem, write code in the mediator first - you're allowed to do everything there. Once you have a solid understanding of the problem, you can refactor the mediator into clean, decoupled modules. This way, the Mediator pattern plays very nicely with natural software development.

## Usage:

In your code, register Modules and instances.

If you have only one, register a Module:
```javascript
Mediator.register('Router',myRouter);
// Note: name must start with Uppercase.
```

If you have many, register an instance:
```javascript
Mediator.register('button',myButton);
// Note: Module name must start with lowercase.
```

Then create a Mediator for every domain in your app.

You can couple Modules to eachother:
```javascript
// For example, render a page when your Router changes
Mediator.couple(['Router','PageController'],function(Router,PageController){
  Router.on('change',function(url){
    PageController.set(url);
  });
});
```

Or you can couple every instance of a type:
```javascript
// For example, trigger the Router when user clicks any button
Mediator.forEach('button',['Router'],function(button,name,Router){
  button.on('clicked',function(event){
    Router.navigate(event.url);
  });
});
```

Or you can add behavior to every instance and module:
```javascript
// For example, add a 'offline' callback to every module in your app.
Mediator.forEach(['Connection'],function(module,name){
  Connection.on('offline',function(event){
    if(module.setOffline) module.setOffline(event);
  });
});
```

The complete API:
```javascript
Mediator.register(name,object)
// lowerCase = instance - can be registered multiple times
// UpperCase = Module - can be registered only one time (Singleton)

Mediator.couple(ArrayOfModuleNames,callback)
// where callback is
callback(Module,Module,Module)

Mediator.forEach([instanceName],[ArrayOfModuleNames],callback)
// where callback is:
callback(module,name,Module,Module,etc...)
```

## Changelog

### 0.2.0 (9/1/2014)

* Initial release

## Contribute

Feel free to contribute to this project in any way. The easiest way to support this project is by giving it a star.

## Contact
-   @markmarijnissen
-   http://www.madebymark.nl
-   info@madebymark.nl

© 2014 - Mark Marijnissen