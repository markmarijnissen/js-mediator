(function(){
/*****************************************************
// js-mediator
// Mark Marijnissen
// https://github.com/markmarijnissen/js-mediator
******************************************************/

// Mediator object
var Mediator = {};

// Global Module register
var Modules = {};

// List of callbacks when waiting for specific modules
var ModuleCallbackList = [];

// List of ForEachCallbackList (all modules)
var ForEachCallbackList = [];

// Modules that are already coupled/grouped
var Connected = {};

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
  // validate if module exists
  if(typeof object === 'undefined'){
    throw new Error('Mediator.register takes two arguments');
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
 * Mediator.connect(modules,callback)
 *
 * @param  {Array:string} array of module names to wait for
 * @param  {Function}     callback
 *
 * Waits until modules are created, then fires callback.
 *
 * Example: RouterMediator.js
 *
 *    Mediator.connect(['Router','PageController'],function(router,page) {
 *      router.on('change',page.update)
 *    })
 */
Mediator.connect = function MediatorConnect(modules,callback){
  claimed = modules.filter(function(name){
    var available = !!Connected[name];
    if(available) Connected[name] = true;
    return available;
  });
  if(claimed.length > 0){
    throw new Error('Cannot group modules '+claimed.join(',')+': They are already coupled!');
  }
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
  Mediator.connect(moduleNames,function(modules){
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
 * Group Modules
 *
 * A new Module is created with `name`.
 * The grouped modules cannot be connected anymore -
 * the group encapsulates the modules. 
 * 
 * @param  {string}   name    
 * @param  {Array<string>} moduleNames 
 * @param  {Function} callback(module,module,module,....)
 * @return {Mediator}               
 */
Mediator.group = function MediatorGroup(name,moduleNames,callback){
  if(name[0] !== name[0].toUpperCase()){
    throw new Error('Group is a Module, so the name should start with UpperCase.');
  }
  Mediator.connect(moduleNames,function MediatorGroupCallback(){
    var module = {};
    module = callback.apply(module,arguments) || module;
    Mediator.register(name,module);
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

Mediator.module = Modules;

window.Mediator = Mediator;
if(module && module.exports) module.exports = Mediator;
})();