(function(){
/**
 * JS-Mediator
 *
 * Key idea
 * - Write independent, standalone modules.
 * - For every module, define a public API and emit events.
 * - Write mediator to couple modules: on event, call public API
 *
 * Getting started
 * - Register all modules and instances you want to couple using `Mediator.register`
 * - Couple modules using `Mediator.couple`
 * - Couple instances using `Mediator.forEach`
 *
 *  Note: A module can be created only once (a singleton), whereas an instance
 *  can be created multiple times. A module name MUST start with UpperCase. 
 *  A instance name MUST start with lowerCase.
 *
 * Tips:
 * - If you can, avoid dependencies between modules
 * - If you can't, make the dependency explicit by using `Mediator.couple`
 * - If that doesn't make sense, break the rules :)
 * - Modules should use words that make sense in their context. Example: 
 *   A `button` instance should have an event called `clicked`
 *   instead of `tweet`
 */

// Global Module register
var Modules = {};

// List of callbacks when waiting for specific modules
var ModuleCallbackList = [];

// List of ForEachCallbackList (all modules)
var ForEachCallbackList = [];

/**
 * Mediator.register(name,module)
 *
 * Register a module or instance
 */
Mediator.register = function MediatorRegister(name,object){
  // validate if name is a string
  if(typeof name !== 'string'){
    throw new Error('Name must be a string!');
  }
  // validate if module is an object
  if(typeof object !== 'object'){
    throw new Error('Must register an object!');
  }
  // set 'isInstance': When name starts with lowercase letter
  var isInstance = name[0] === name[0].toLowerCase();
  // if instance
  if(isInstance){
    // create array if needed
    if(!Modules[name]) Modules[name] = [];
    // push instance to array
    Modules[name].push(object);

  // if module
  } else {
    // check if module name already exists
    if(Modules[name]){
      throw new Error('Module '+name+' already exists!');
    }
    // store module
    Modules[name] = object;

    // Invoke 'mediate' callbacks
    for(var callbackIndex = ModuleCallbackList.length-1; callbackIndex >= 0; callbackIndex--){
      var item = ModuleCallbackList[callbackIndex];
      // it this callback waiting for current module?
      var moduleIndex = item.waitFor.indexOf(name);
      // if so...
      if(moduleIndex > -1){
        // ...remove module from 'wait' list
        item.waitFor.splice(moduleIndex,1);
        // Are we finished loading all modules?
        if(item.waitFor.length === 0){
          // map names to actual modules
          var modules = getModules(item.modules);
          // invoke callback
          item.callback.apply(null,modules);
          // remove callback from list
          ModuleCallbackList.splice(callbackIndex,1);
        }
      }
    }
  }
  ForEachCallbackList.forEach(function(callback){
    callback(object,name);
  });
  return object;
};

/**
 * Mediator.couple(modules,callback)
 *
 * @param  {Array:string} array of module names to wait for
 * @param  {Function}     callback
 *
 * Waits until modules are created, then fires callback.
 *
 * Example: RouterMediator.js
 *
 *    Mediator.couple(['Router','PageController'],function(router,page) {
 *      router.on('change',page.update)
 *    })
 */
Mediator.couple = function MediatorCouple(modules,callback){
  var waitFor = modules.filter(function(name){ return !Modules[name]; });
  // All modules are already loaded! Invoke immediatly
  if(waitFor.length === 0){
    callback.apply(null,getModules(modules));
  // Waiting for modules. Invoke later.
  } else {
    ModuleCallbackList.push({
      waitFor:waitFor,
      modules:modules,
      callback:callback
    });
  }
  return Mediator;
};

/**
 * Mediator.forEach([filter],[modules],fn)
 *
 * Execute a function for every module and instance
 *
 * @param  {string}       filter: instance name (optional)
 * @param  {array:string} modules: list of modules (optional)
 * @param  {Function}     fn: forEach callback
 *
 * Examples:
 *
 * Mediator.forEach('page',['App'],function(page,name,App){
 *    App.addPage(page);
 * })
 *
 * Mediator.forEach(['TwitterFeed'],function(module,name,TwitterFeed){
 *    if(module.onTweet) {
 *      TwitterFeed.addTweetListener(module.onTweet)
 *    }
 * })
 *
 * Mediator.forEach(function(module,name){
 *    console.log('registered:',name);
 * });
 */
Mediator.forEach = function MediatorForEach(filter,moduleNames,fn){
  if(Array.isArray(filter) && typeof moduleNames === 'function'){
    fn = moduleNames;
    moduleNames = filter;
    filter = null;
  }
  // forEach(fn)
  if(typeof filter === 'function'){
    fn = filter;
    moduleNames = [];
    filter = null;
  }
  // forEach(filter,fn)
  if(typeof moduleNames === 'function'){
    fn = moduleNames;
    moduleNames = [];
  }
  if(typeof fn !== 'function'){
    throw new Error('Callback is not a function!');
  }
  Mediator.couple(moduleNames,function(modules){
    if(filter && Mediator.DEBUG_COUPLED) 

    modules = Array.prototype.slice.apply(arguments);
    var callback = function EnhanceForEachCallback(module,name){
      if(filter === false || filter === name){
        fn.apply(null,[module,name].concat(modules));
      }
    };

    // Push callback to list (for modules that are registered in future)
    ForEachCallbackList.push(callback);

    // Call callback for modules that are already registered
    Object.keys(Modules).forEach(function(name){

      // Get module(s)
      var modules = Modules[name];
      // If Module
      if(!Array.isArray(modules)) {
        callback(modules,name);
      // If Instance
      } else {
        modules.forEach(function(module){
          callback(module,name);
        });
      }
    });
  });
  return Mediator;
};

/**
 * Helper function to map module names to actual modules
 * @param  {Array:string} names
 * @return {Array:object} modules
 */
function getModules(names){
  return names.map(function(name){
    return Modules[name];
  });
}

window.Mediator = Mediator;
if(module && module.exports) module.exports = Mediator;
})();