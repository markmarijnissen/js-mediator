js-mediator
===============

> Write standalone, independent Modules, and couple them using Mediators.

At less than 2kb minified, this tiny utility library allows you to write well-designed apps.

## Contents

* [Usage](#usage)
      * `Mediator.register`
      * `Mediator.connect`
      * `Mediator.forEach`
      * `Mediator.group`
* [The rules](#the-rules)
* [Example](#example)
* [Why?](#why)
      * [Decoupled architecture](#problem-1-coupled-architecture)
      * [Introducing Instances](#problem-2-not-every-part-of-an-application-is-a-singleton)
      * [Introducing Groups](#problem-3-too-many-modules-and-mediators-make-the-application-incomprehensible)
* [What the Mediator does not do](#what-the-mediator does-not-do)
* [How to create a mess with Mediators](#how-to-create-a-mess-with-mediators)
* [Changelog](#changelog)
* [Contribute](#contribute)
* [Contact](#contact)


## Usage:

Install using bower or npm

```bash
  bower install js-mediator
  npm install js-mediator
```
Or include the `mediator.js` script on your page.

In your **Modules**:
```javascript
Mediator.register(name,object)
// lowerCase = instance - can be registered multiple times
// UpperCase = Module - can be registered only one time (Singleton)
```

In your **Mediators**:
```javascript
Mediator.connect(ArrayOfModuleNames,callback)
// where callback is:
function callback(Module,Module,Module) { ... }

Mediator.forEach([instanceName],[ArrayOfModuleNames],callback)
// where callback is:
function callback(module,name,Module,Module,etc...) { ... }

Meddiator.group(groupModuleName,ArrayofModuleNames,callback)
// where callback is:
function callback(Module,Module,Module) {
  return groupModule; // defaults to `this`, which is an empty object
}
```

## The Rules

2. Write many small, independent, standalone Modules (or Instances)
    3. A Module **can never** reference an other Module.
    1. The public API of your module should be small and conscise, without unnecessary stuff.
    2. Function and events should be named in context of your module. (i.e. a `Button` Module has a `click` event instead of a `sendMail` event).
3. Write only a few Mediators (for every domain in your app).
    2. Couple Modules explicitly with a Mediator.
    1. Hack, prototype and experiment in the Mediators - keep the Modules clean.
    2. If you can, extract functionality from the Mediator into a Module.
    3. Encapsulate multiple modules into a single Group - to avoid Module clutter.
    

| Modules | Mediators|
|---------|----------|
| Decoupled code | Couple code |
| Standalone | App-specific|
| Reusable | Throw-away|
| Clean code | Dirty code |
| Only know about themselves | Know about everything |

#### Other terms:

* **Instance**: An object that is registered multiple times 
* **Group**: A encapsulated group of Modules to create a reusable abtraction.

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
// Group your business logic
Mediator.group('Blog',['Post','Author','Comments'],function(Post,Author,Comments){
  
  // couple Post, Author and Comment with each other

  // Expose only meaningful functions to outside world
  return {
    list: Post.list,
    comment: Comments.add,
    login: Author.login,
    logout: Author.logout
  };

  // alternative: if you don't return anything, `this` is registered as module:
  this.list = Post.list,
  this.comment = Comments.add,
  // etc
});

Mediator.connect(['Blog'],function(Blog){ // works! });
Mediator.connect(['Post'],function(Post) { // error: Post is encapsulated by Blog! })
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

## Why?

#### Problem #1: Coupled architecture

Model, View and Controller (or whatever) are usually coupled in one of two ways:

* Interactive (or top-down): High-level, abstract modules have references to low-level, specific implementations. I.e. an "AppModel" has a "PageController" has a "Template".
* Reactive (or bottom up, or inversion of control): High-level abstractions are unaware of low-level implementations. Instead, low-level implementations have a reference to high-level abstractions using a dependency injection mechanism. I.e. a "Template" has access to the "PageController" has access to the "AppModel".

However, as soon as independent modules have references to eachother, the "black box" is broken: The modules become coupled and you have access to private stuff you should never see. As the application grows, it becomes harder to seperate concerns - and you may find that your templates contain model logic.

* Concerns are mixed
* Code is coupled

#### Answer #1: Write independent, standalone Modules, and couple them with Mediators.

A module should **never** reference another module. Split your app in standalone, independent modules that have **no knowledge whatsoever** of eachother. You can split the Application in any way your like, for example:

* Model-Modules, which contain business logic
* View-Modules, which contain your template views
* ViewModel-Modules, which translates Model data into Template Date
* Router-Module, which instantiates the correct ViewModel
* Service-Modules, which handle everything else (i.e. caching, HTTP-requests, etc)

When all functionality is implemented, you couple everything together using Mediators. 

A Mediator is a small piece of code that links two (or more) modules to eachother. For example:

* When Model emits a `update` event, `ViewModel.updateData()` is called.
* When ViewModel emits a `render` event, `View.render()` is called.

Instead that modules have an **implicit dependency** on the functions, data of events of another module, the **dependency is made explicit** by the Mediator. **If the events, method signature or data changes**, you only have to update the Mediator (which acts as a "Translator" or "Bridge" between two modules).


#### Problem #2: Not every part of an Application is a Singleton!

Not all application code is best modeled as singletons. What if you instantiate a piece of code multiple times? 

Image you have a Button Module:

```javascript
var button = new Button();
var button.setText('Click Me');
var button.on('clicked',function(){ ... });
```

To make this fit in the Module pattern, you would need to create a Singleton:

```javascript
var ButtonCollection = {};
ButtonCollection.buttonA = new Button();
ButtonCollection.buttonA.setText('Click Me');
ButtonCollection.buttonA.on('clicked',function(){ ... })
```

Everytime you create a button, you have to add it to the ButtonCollection for the Mediator to use. Ouch!

#### Answer #2: Create "Instances"

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

#### Problem #3: Too many modules and mediators make the application incomprehensible.

The smaller your Modules are, the better. Small Modules are easy to understand and more likely to be reusable.

However, mediating all those modules gets increasingly more difficult.

While the Modules themselves are easy, their connections are too many and too complex too easily understand.

Imagine you are creating a `Blog` which communicates with `Author`, `Posts` and `Comments` Modules.

You could create a Mediator as Dependency Injector:

```javascript
Mediator.connect(['Author','Posts','Comments','Blog'],
  function(Author,Posts,Comments,Blog){

  Blog.Author = Author;
  Blog.Posts = Posts;
  Blog.Comments = Comments;
  Blog.init(); // Let Blog know we've injected all dependencies...
})
```

Ouch! Now we're tightly coupling code again!

Also, you can still create connections between `Author` and `Post` in other Mediators - so reading this code still does not give you the whole picture.

#### Answer #3: Create abstractions: Encapsulate Modules in a Group

Create a group: A new module that encapsulates multiple modules.

The encapsulated modules are not accessible in other Mediators, therefore you now have a single abstraction to deal with multiple modules.

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

#### Problem #4: You can't reuse your files.

Every framework has it's own way of declaring a piece of code. This can be a view, controller, model, module, etc. Think of AngularJS, Ember, NoFlo, Backbone, Marionette, React, Meteor, etc.

What if you want to swap from Meteor to Angular? Or use Backbone for your data in a Angular app?

Most of the time you have to copy-paste and refactor code - this is unacceptable.

#### Answer #4: Unobstrusive framework code enables file re-use.

With `js-mediator`, you can do:

```javascript
if(window.Mediator)  Mediator.register('MyModule', {...})
```
This line is as unobstrusive as it can be. It's even possible to register the module in a seperate file (for example when you export your code as a global variable).

## More benefits:

* **Follows natural flow of programmer:** Most design patterns block the natural flow of programming. The Mediator pattern works well with the natural flow, because it allows you to experiment and hack in the Mediators, while keeping the core of your code (i.e. the Modules) clean. Once your implementation is ready, you can extract functionality into individual modules.

* **It's not all-or-nothing:** Most design patterns are all-or-nothing. The Mediator pattern can be slowly introduced. Starting with one big module, you can slowly extract functionality into multiple modules (and mediate between them).

* **Testable:** The encapsulated nature of Modules makes it easy to write unit-tests. As you have almost no dependencies and your outside API (methods, events) is as small and conscise as it can be, mocking other modules should not be difficult.

* **Mediators are future-proof.** As JavaScript frameworks are changing so fast, it can be hard to keep up. The Mediator pattern is unobtrusive and makes no assumptions. You can easily swap out different modules for newer technology.

## What the Mediator does not do

Since the Mediator pattern makes no assumptions about your code, you need to decide for yourself:

* How should you split the app into Modules? 
* What should be the domain of a single Mediator? How many Mediators do you create? 
* How does the data flow in your application? 

## How to create a mess with Mediators

It's still possible to create really bad stuff:

* Use many Mediators on a single Module to create confusion about how the module is connected.
* Put too much logic into the mediators.
* Write bigger and bigger modules.
* Use Mediators as dependency injectors for tight coupling: Just inject a module into another module.
* Use function and event names that make no sense from the perspective of the Module.
* Write too many Modules - one for every function (and don't encapsulate them into groups).
* Coupe Modules using a complicated cascade of events. Bonus points if you create a loop and get Stack Overflow.


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