'user strict';
// Basic types item, list





function AB_item(name) {
  var name = name;
  var storage = Storage(name);

  return {
    on: function(action, callback) {
      switch (action) {
        case 'edit':
          this.set();
          break;
        case 'remove':
          _remove(callback);
          break;
        case 'switch':
          _switch(callback);
          break;
      }
    },  
    get: function(callback) {
      Storage.get(callback);
    },
    set: function(callback) {
      Storage.set(callback);
    }
  };
}









function LIST(name) {
  var Storage = localStorage.getItem(name);
  
  if (!Storage) {
    localStorage.setItem(name, []);
    Storage = localStorage.getItem(name);
  }
  
  function edit(callback) {
    callback();
  }

  return {
    name: name,
    on: function(action, callback) {
      switch (action) {
        case 'add':
          add(callback);
          break;
        case 'edit':
          edit(callback);
          break;
        case 'remove':
          remove(callback);
          break;
        case switch:
          switch(callback);
          break;
      }  
    }
  }
}


function storage(name) {
  var name = name;
  var _storage = localStorage.getItem(name);
  if (!_storage) {
    localStorage.setItem(name, null);
    _storage = localStorage.getItem(name);
  }
  return {
    get: function() {
      return _storage;
    },
    set: function(val) {
      localStorage.setItem(name, val);
      _storage = localStorage.getItem(name);
    }
  };
}
          
function oplog(path) {
  var _path = path;
  var _storage = storage('oplog_' + _path);
  var _oplog = _storage.get();
  var _pointer = 0;
  var _sync = false;
             
  return {
    clear: function() {
      _oplog = [];
      _pointer = 0;
    },
    write: function(action, newValue, oldVal, callback) {
      _oplog[_pointer].push({time: new Date(), state: 0, action: action, data: data, callback: callback});
      _pointer++;
      _oplog.length = _pointer;
      _sync = false;
    },
    read: function() {
      return _oplog[_pointer];
    },
    undo: function() {
      if (!_pointer) {
        return false;
      }
      _pointer--;
      _sync = false;
    },
    redo: function() {
      if (_pointer < _oplog.length) {
        _pointer++;
        _oplog[_pointer].state = 0;
      }
      _sync = false;
    },
    sync: function() {
      if (!_sync) {
        _oplog.forEach(i) {
          if (i.state == 0) {
            // Do action
            i.state = 1;
            server.send(_path, i.action, i.data, function(res) {
              if (typeof i.callback === 'function') i.callback(res);
            });
          }
        };
        _sync = true;
      }
    }
  };
}
          
delete -> add
add -> delete
edit -> edit
switch -> switch
    
    
    
    
          
              
function LISTIMMUTABLE(name) {
  
  function edit(callback) {
    callback();
  }

  return {
    name: name,
    get: function() {
    
    }
  }
}
          
          
          
          
          

db 
  users
  devices
   table.json

