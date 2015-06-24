
var blocked = false;
 
function toggle(el) {
  el = document.querySelector(el);
  if (el) {
    el.style.display = el.style.display === 'none' ? '' : 'none';
  }
}
  
function restart() {
  socket.emit('restart');
}

function reboot() {
  socket.emit('reboot');
}
  
function uploadConfig(files) {
    var formData = new FormData();
    if (files.length) {
      formData.append('file', files[0]);
      var xhr = new XMLHttpRequest();
      xhr.open('POST', '/upload');
      xhr.send(formData);
    }
}

function restoreConfig(file) {
   socket.emit('restoreConfig', file);
}

// Человеческая дата: 25 марта 05:37 или 25 марта 2012, 05:37
function smartDate(d) {
  function pad(a,b) {return(1e15+a+'').slice(-b)}
  function genitive_case_month(d) {
    var months = ['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь'];
    return (months[d.getMonth()] + 'а').replace(/[ьй]а$/, 'я');
  }
  var now = new Date();
  
    if (d) {
      if (typeof d === 'string') d = new Date(Date.parse(d, 'YYYY/mm/dd hh:MM'));
      if (typeof d === 'number') d = new Date(d);
      //console.log(d);

      var date_part = d.getDate() + '\u00A0' + genitive_case_month(d);
      if (d.getYear() !== now.getYear()) date_part += '\u00A0' + d.getFullYear() + ',\u00A0';
      date_part += '\u00A0' + pad(d.getHours(),2) + ':' + pad(d.getMinutes(),2);

      return date_part;
    }
}

// Get backuped configurations from server
function renderConfigs(data) {
    data.sort(function(a,b) { return b.time - a.time; });
  
    var el = document.querySelector('.configurations');
    var str = '';
    data.forEach(function(i) {
      str += '<li onClick="restoreConfig(\''+ i.file +'\')">' + i.file + '<span>' + smartDate(i.time) + '</span></li>';
    });
    //console.log(str, el);
    el.innerHTML = str;
} 

// Update state
function updateState(state) {
    var data = state.split(' ');
  
    // Render state
    var el, icon; 
    data.forEach(function(i, index) {
      //console.log(i, index);
      var lamp = index + 1;
      el = document.querySelector('.el-' + lamp);
      icon = document.querySelector('.icon-' + lamp);
      
      if (i == 1) {
        if (el) el.className = 'el-' + lamp;
        if (icon) icon.src = 'i/ok.png';
      } else {
        if (el) el.className = 'el-' + lamp + ' error';
        if (icon) icon.src = 'i/error.png';
      }
    });
}
  
// Update log
function updateLog(str) {
  var log = document.querySelector('.log');
  var e = document.createElement('div');
  e.innerHTML = '<div>' + str + '</div>';
  log.appendChild(e);
  log.scrollTop = log.scrollHeight;
}


  
  
// Init
var socket = io.connect('http://localhost:3003');

socket.emit('getState');
  
socket.on('updateLog', function(data) {
  updateLog(data);
});

socket.on('updateState', function(data) {
  updateState(data);
});

socket.on('sendConfigs', function(data) {
  renderConfigs(data);
}); 