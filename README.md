js-mediator
===============

> Write standalone, independent Modules, and couple them using Mediators.

```bash
  bower install js-mediator
  npm install js-mediator
```
Or include the `mediator.js` script on your page.

## Contents

* [The Idea](#the-idea)
    * [Mediators explicitly couple your app](#mediators-explicitly-couple-your-app)
    * [Mediating Object-Oriented code: Dealing with instances](#mediating-object-oriented-code-dealing-with-instances)
    * [Encapsulate modules into a Group](#encapsulate-modules-into-a-group)
    * [Benefits](#benefits)
    * [Mediator Limitations](#mediator-limitations)
    * [Bad Ideas](#bad-ideas)
* [Example](#example)
* [Summary](#summary)
* [Changelog](#changelog)
* [Contribute](#contribute)
* [Contact](#contact)

## The Idea

### Mediators explicitly couple your app

**The Problem:** Referencing other modules introduces tight coupling.

In MV-Whatever architecture, modules always have a reference to another module. For example, a Controller has a reference to the Model and View.

This breaks the "black box": The modules become coupled and have access to private stuff. As the application grows, it becomes harder to seperate concerns. Applications don't scale as they grow in complexity.

**The Solution:** 

Write independent, standalone Modules. A module should **never** reference another module. Then connect modules with Mediators.

A Mediator is a small piece of code that links two (or more) modules to eachother - it contains no functional code and acts only as a Translator or Bridge.

Instead that modules have an **implicit dependency** on other modules, the **dependency is made explicit** by the Mediator. 

Coupling is done using the public API of a Module - so you should take care to keep your public functions and events small and concise. 

**Key points:**

* `js-mediator` makes no assumptions about your code.
* You need to decide how to split your app into Modules (i.e. Model/View/...)
* Keep the public API small and conscise. Use names that make sense in the context of the Module. 
* Protect the Black Box: A Module **can never** reference another Module!

### Mediating Object-Oriented code: Dealing with instances

Not all application code is best modeled as singletons. Indeed, many frameworks use an Object-Oriented approach where you can instantiate multiple instances of a single class.

**Problem:** How to Mediate between these multiple instances? 

Image you have a Button Module:

```javascript
var button = new Button();
var button.setText('Click Me');
var button.on('clicked',function(){ ... });
```

You could convert this to a Module by creating a "ButtonCollection" to keep track of all instances:

```javascript
var ButtonCollection = {};
ButtonCollection.buttonA = new Button();
ButtonCollection.buttonA.setText('Click Me');
ButtonCollection.buttonA.on('clicked',function(){ ... })
```

However, this approach is cumbersome - you have to write new Modules only to wrap the instances. Also - you need a global reference to ButtonCollection, otherwise you can't keep track of the Buttons! Ouch!

**Solution:** Create instances.

`js-mediator` allows you to register multiple instances:

```javascript
Mediator.register('button',button);
// Note: instance name MUST start with a lowercase letter!
```

Then, if you want to mediate, you can use `forEach`:

```javascript
Mediator.forEach('button',['PdfViewer'],function(button,name,PdfViewer){
  if(button.id === 'x') { ... }
  if(button.action === 'pdf') PdfViewer.open(button.link);
  // etc
});
```

**Key points:**

* To mediate multiple objects of the same class, register an instance.
* Couple instances using `Meditator.forEach`.

### Encapsulate modules into a Group.

**Problem:**

As your application grows, it becomes more and more tricky to understand how all modules are connected together. While each individual Modules might be simple and straightforward, the entire application can be unstable and difficult to debug.

Imagine you are creating a `Blog` which communicates with `Author`, `Posts` and `Comments` Modules.

An **anti-pattern** would be to use the Mediator as a **dependency injector**. This introduces tight coupling:

```javascript
Mediator.connect(['Author','Posts','Comments','Blog'],
  function(Author,Posts,Comments,Blog){

  Blog.Author = Author;
  Blog.Posts = Posts;
  Blog.Comments = Comments;
  Blog.init(); // Let Blog know we've injected all dependencies...
})
```

Additionally, the Blog is **not** your single source of truth** when it comes down to Author, Posts and Comments. You can still connect these modules in other places, which might introduce unforeseen side-effects.

**Solution:** Create a group: A new module that encapsulates multiple modules.

```javascript
// Create a new Module named `Blog` that connects and manages 
// Authors, Post and Comments:
Mediator.group('Blog',['Authors','Posts','Comments'],function(Authors,Post,Comments){
  
  // Couple internal Modules together, for example:

  // Enhance a post instance with Comments and Author data: 
  Mediator.forEach('post',function(post){
    post.author = Author.get(post.authorId);
    post.comments = Comments.findAll(postId);
  })

  // Create Abstraction for outside world:
  var Blog = {};
  Blog.listMyPosts = function(){
    return Posts.search({authorId: Author.myId});
  }

  // Register 'Blog' module:
  return Blog;
})

// Now you can connect Blog to other Modules:
Mediator.connect(['Blog','View'],function(){
  view.on('menu-clicked',function(item){
    if(item === 'author') {
      view.render('my-posts',Blog.listMyPosts());
    }
  });
});

// You cannot use the individual Author, Post or Comments Module!
//
// They are encapsulated, i.e. they are hidden in the Blog abstraction.
Mediator.connect(['Author','Posts'],function(){
  // will throw an Error!
});
```

**Key points:**

* **A Group contains Mediator code** - it should only connect modules.
* **A Group is registered as a Module** and exposes a higher-level public API (abstraction).

### Benefits:

* **No assumptions about your code:** The Mediator only provides a way to connect/glue your code together - it makes no assumptions about the internal working of your Modules.

* **Re-usable files**: Most frameworks and libraries have intrusive code. Code used in AngularJS, Backbone, Meteor, etc is always wrapped in library-specific code. You can't reuse files - you need to copy-paste and refactor instead. The Mediator, instead, allows you to re-use files. The `Mediator.register` is as unobstrusive as it gets - you can even call `Mediator.register` in a seperate file (if you manage to get a reference to your Module).

* **Follows natural flow of programmer:** Most design patterns have no room for experiments. You follow the pattern to write clean code, or you mess it up. With the Mediator pattern, on the other hand, you can hack and prototype in the Mediators, while keeping the core of your code (i.e. the Modules) clean. Once your implementation is ready, you can extract functionality into individual modules.

* **Testable:** The encapsulated nature of Modules makes it easy to write unit-tests. As you have almost no dependencies and your outside API (methods, events) is as small and conscise as it can be, mocking other modules should not be difficult.

* **Mediators are future-proof.** As JavaScript frameworks are changing so fast, it can be hard to keep up. The Mediator pattern is unobtrusive and makes no assumptions. You can easily swap out different modules for newer technology.

* **It's not all-or-nothing:** Most design patterns are all-or-nothing. The Mediator pattern can be slowly introduced. Starting with one big module, you can slowly extract functionality into multiple modules (and mediate between them).

### Mediator Limitations

Since the Mediator pattern makes no assumptions about your code, you need to decide for yourself:

* How should you split the app into Modules? 
* What should be the domain of a single Mediator? How many Mediators do you create? 
* How does the data flow in your application? 

### Bad ideas

It's still possible to create really bad stuff:

* Use many Mediators on a single Module to create confusion about how the module is connected.
* Put too much logic into the mediators.
* Write bigger and bigger modules.
* Use Mediators as dependency injectors for tight coupling: Just inject a module into another module.
* Use function and event names that make no sense from the perspective of the Module.
* Write too many Modules - one for every function (and don't encapsulate them into groups).
* Coupe Modules using a complicated cascade of events. Bonus points if you create a loop and get Stack Overflow.

## Example

Image you have a Blog-app:

* The **Router** module tracks URL changes
* The **PageController** module renders the page
* The are many **button**s that emit `clicked` events.
* You have business logic in **Post**, **Author** and **Comments** modules.

### Modules

Register your Modules and instances.

```javascript
// Register a Module if you register only once. (A Singleton)
Mediator.register('Router',myRouter);
// Note: name must start with Uppercase.

// Register an instance if you register multiple instances.
Mediator.register('button',myButton);
// Note: name must start with lowercase.
```

### Mediators

Create a Mediator for every domain in your app.

Create a connection to couple modules:
```javascript
// Render a page when the route changes.
Mediator.connect(['Router','PageController'],function(Router,PageController){
  Router.on('change',function(url){
    PageController.set(url);
  });
});
```

Connect every instance to one (or more) Modules
```javascript
// When a button is clicked, navigate using the Router.
Mediator.forEach('button',['Router'],function(button,name,Router){
  button.on('clicked',function(event){
    Router.navigate(event.url);
  });
});
```

Group multiple modules into a single module: (encapsulation)
```javascript
// Create a new Module named `Blog` that connects and manages 
// Authors, Post and Comments:
Mediator.group('Blog',['Authors','Posts','Comments'],function(Authors,Post,Comments){
  
  // Couple internal Modules together, for example:

  // Enhance a post instance with Comments and Author data: 
  Mediator.forEach('post',function(post){
    post.author = Author.get(post.authorId);
    post.comments = Comments.findAll(postId);
  })

  // Create Abstraction for outside world:
  var Blog = {};
  Blog.listMyPosts = function(){
    return Posts.search({authorId: Author.myId});
  }

  // Register 'Blog' module:
  return Blog;
})

// Now you can connect Blog to other Modules:
Mediator.connect(['Blog','View'],function(){
  view.on('menu-clicked',function(item){
    if(item === 'author') {
      view.render('my-posts',Blog.listMyPosts());
    }
  });
});

// You cannot use the individual Author, Post or Comments Module!
//
// They are encapsulated, i.e. they are hidden in the Blog abstraction.
Mediator.connect(['Author','Posts'],function(){
  // will throw an Error!
});
```

Extend every module and instance:
```javascript
// For example, add a 'offline' callback to every module in your app.
Mediator.forEach(['Connection'],function(module,name){
  Connection.on('offline',function(event){
    if(module.setOffline) module.setOffline(event);
  });
});
```


## Summary

**Modules:**<br/>Write many small, independent, standalone Modules (or Instances)

1. A Module **can never** reference an other Module.
2. The public API of your module should be small and conscise, without unnecessary stuff.
3. Function and events should be named in context of your module. (i.e. a `Button` Module has a `click` event instead of a `sendMail` event).

**Instances:** A module that is registered multiple times.

```javascript
Mediator.register(name,object)
// lowerCase = instance - can be registered multiple times
// UpperCase = Module - can be registered only one time (Singleton)
```

**Mediators:**<br/>
Write only a few Mediators (for every domain in your app).

1. Couple Modules explicitly with a Mediator.
2. Hack, prototype and experiment in the Mediators - keep the Modules clean.
3. If you can, extract functionality from the Mediator into a Module.
4. Encapsulate multiple modules into a single Group - to avoid Module clutter.

```javascript
Mediator.connect(ArrayOfModuleNames,callback)
// where callback is:
function callback(Module,Module,Module) { ... }

Mediator.forEach([instanceName],[ArrayOfModuleNames],callback)
// where callback is:
function callback(module,name,Module,Module,etc...) { ... }
```
    
**Group:** A module that encapsulates other modules.

```javascript
Mediator.group(groupModuleName,ArrayofModuleNames,callback)
// where callback is:
function callback(Module,Module,Module) {
  // option 1: return the module
  return groupModule;

  // option 2: use `this`
  this.doStuff = //...

  // default:
  return (this = {})
}
```

## Changelog

### 0.3.0 (20/1/2014)

* Renamed `couple` into `connect`
* Added `group`
* Wrote more README

### 0.2.0 (9/1/2014)

* Initial release

## Contribute

Feel free to contribute to this project in any way. The easiest way to support this project is by giving it a star.

## Contact
-   @markmarijnissen
-   http://www.madebymark.nl
-   info@madebymark.nl

© 2014 - Mark Marijnissen