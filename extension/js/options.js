(function(){

  var ids = ['filter'];

  // Save to localStorage
  function saveOptions() {
    for (var i = 0, len = ids.length; i < len; i++) {
      var elem = document.getElementById(ids[i]);
      if (elem.type === 'checkbox') {
        localStorage[ids[i]] = elem.checked ? true : '';
      }
      else {
        localStorage[ids[i]] = elem.value;
      }
    }
    var status = document.getElementById("status");
    chrome.runtime.sendMessage({cmd: 'update_settings', data: {}});
    setStatus('Saved', 'success', 1000);
    setTimeout(function(){
      //window.close();
    }, 1000);
  }


  // Restore from localStorage
  function restoreOptions() {
    for (var i = 0, len = ids.length; i < len; i++) {
      var elem = document.getElementById(ids[i]);
      console.log(ids[i]);
      if (elem.type === 'checkbox') {
        elem.checked = !!localStorage[ids[i]];
      }
      else elem.value = localStorage[ids[i]] || '';
    }
  }


  function setStatus (text, className, timeout){
    className = 'alert alert-' + className;
    var status = document.getElementById("status");
    status.className = className;
    status.textContent = text;
    status.style.display = 'block';
    if (timeout) {
      setTimeout(function(){
        status.textContent = '';
        status.style.display = 'none';
      }, timeout);
    }
  }


  window.onload = function () {
    restoreOptions();
    $('form').submit(function(e){
      e.preventDefault();
    });
    document.getElementById('save').onclick = function (e) {
      e.preventDefault();
      saveOptions();
    };
  };


})();
