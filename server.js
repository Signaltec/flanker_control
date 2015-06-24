var isWin = /^win/.test(process.platform);

var port = (isWin) ? 80 : 3000;
var portIo = 3003;
var getStateInterval = 1000; // Интервал обновления состояния

var TMPPATH = "./tmp/";
var CONFPATH = './configs/';
var CONFEXT = '.xls';

var REBOOT_SCRIPT = (isWin) ? 'reboot.bat' : './mock.sh';
var RESTART_SCRIPT = (isWin) ? 'restart.bat' : './mock.sh';
var CONFIGURE_SCRIPT = (isWin) ? 'configure.bat' : './mock.sh';

var logFilename = './server.log';
var stateFilename = './state.dnt';

var fs = require('fs');
var path = require('path');
var server = require('http').Server(app);
var sys = require('sys');
var exec = require('child_process').exec;

// External npm
var express = require('express');
var busboy = require('connect-busboy');
var io = require('socket.io')(server);
var tail = require('file-tail').startTailing(logFilename);

var basicAuth = require('basic-auth');
var auth = function(username, password) {
  return function(req, res, next) {
    var user = basicAuth(req);

    if (!user || user.name !== username || user.pass !== password) {
      res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
      return res.send(401);
    }

    next();
  };
};

// Log to file
var log4js = require('log4js');
log4js.configure({
    appenders: [
      { type: 'console' },
      { type: 'file', filename: logFilename, category: 'cheese', layout: {
          type: 'pattern',
          pattern: "[%r] - %m%n"
      }}
    ]
});
var log = log4js.getLogger('cheese');

  // Express
  var app = express();

  // Static handler
  app.use('/', auth('admin', '0000'));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(busboy());


  app.route('/').get(function(req, res, next) {
    res.sendfile('public/index.html');
  });

  app.route('/upload')
      .post(function (req, res, next) {

          var fstream;
          req.pipe(req.busboy);
          req.busboy.on('file', function (fieldname, file, filename) {
              log.info("Uploading: " + filename);
              fstream = fs.createWriteStream(TMPPATH + filename);
              file.pipe(fstream);
              fstream.on('close', function () {
                fs.renameSync(TMPPATH + filename, CONFPATH + filename);
                sendConfigs(io.sockets);
                exec(CONFIGURE_SCRIPT + ' ' + filename, function(error, stdout, stderr) {
                  if (error) {
                    log.error(error);
                  } else {
                    log.info(stdout);
                  }
                });
                
            });
        });
    });


  // send state file to client
  function sendStateFile(socket) {
    fs.readFile(stateFilename, {encoding: 'utf8'}, function (err, data) {
        if (err) {
            log.error(err);
        } else {
            socket.emit('updateState', data);
        }
    });
  }

  // send state file to client
  function sendConfigs(socket) {
      // send configs
      fs.readdir(CONFPATH, function(err, files) {
        if (err) {
          console.error(err);
        } else {
          // Only xls files
          //var files2 = files.filter(function(file) { return file.substr(-CONFEXT.length) === CONFEXT; })
          var files2 = files;
          var files3 = files2.map(function(file) { return {file: file, time: fs.statSync(CONFPATH + '/' + file).mtime.getTime()}; })
          
          socket.emit('sendConfigs', files3);
        }
      });  
  }


  var interval = null;

  // SocketIO connection
  io.sockets.on('connection', function(socket) {
      socket.emit('updateLog', "Ready…");

      sendConfigs(socket);
    
      socket.on('getState', function () {
        sendStateFile(socket);
      });

      socket.on('restart', function () {
        log.info('restart');  
        exec(RESTART_SCRIPT, function(error, stdout, stderr) {
          if (error) {
            log.error(error);
          } else {
            log.info(stdout);
          }
        });

      });

      socket.on('reboot', function () {
        log.info('reboot'); 
        exec(REBOOT_SCRIPT, function(error, stdout, stderr) {
          if (error) {
            log.error(error);
          } else {
            log.info(stdout);
          }
        });
      });
    
      socket.on('restoreConfig', function (data) {
        log.info('restoreConfig', data);
        exec(CONFIGURE_SCRIPT + ' ' + data, function(error, stdout, stderr) {
          if (error) {
            log.error(error);
          } else {
            log.info(stdout);
          }
        });
      });  
            
  
      // Interval for check «state.dnt» file
      if (interval) clearInterval(interval);
      
      interval = setInterval(function() {
        sendStateFile(socket);
      }, getStateInterval);
  });

  // Tail log file
  tail.on('line', function(data) {
      io.sockets.emit('updateLog', data);
  });
  


/*
  // Watch state file
  fs.watchFile(stateFilename, function (err, curr, prev) {
    if (err) {
      log.error(err);
    } else {
        sendStateFile(io.sockets);
    }
  });
*/
  app.listen(port, function() {
    log.debug('WEB server listening on port ', port);
  });

  server.listen(portIo, function() {
    log.debug("SockeIO on port " + portIo);
  });
