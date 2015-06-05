var getSettings = function( cbOnSettings ){
  chrome.runtime.sendMessage(
    {cmd: 'get_settings'},
    function( response ){
      if (!response) return;
      cbOnSettings( response.settings, response.tabId );
  });
};

/**
 * This function will be injected as inline script to the page
 *
 * TODO: save cookies through chrome.cookies.set
 * TODO: return only cookies that has not expired (save cookie instance and check every time in "get" method)
 */
var processCookies = function( prefix ){

  var cookie_str = document.cookie;


  var Cookie = function Cookie(str) {
    this.str = str;

    // First key is the name
    this.name = str.substr(0, str.indexOf('='));

    // Map the key/val pairs
    str.split(/ *; */).reduce(function(obj, pair){
      pair = pair.split(/ *= */);
      obj[pair[0]] = pair[1] || true;
      return obj;
    }, this);

    // Assign value
    this.value = this[this.name];

    // Expires
    this.expires = this.expires
      ? new Date(this.expires)
      : Infinity;

    // Default or trim path
    this.path = this.path
      ? this.path.trim()
      : document.location.pathname;
  };



  Object.defineProperty(document, 'cookie', {
    get: function(){
      var cookies = {};
      var items = cookie_str.split('; ');
      for (var i = 0, len = items.length; i < len; i++) {
        var item = items[i];
        if (item.indexOf(prefix) === 0) {
          item = item.replace( prefix, '');
          var key = item.substr(0, item.indexOf('='));
          cookies[ key ] = item;
        }
      }
      var vals = Object.keys(cookies).map(function (key) {
          return cookies[key];
      });
      return vals.join('; ');
    },
    set: function( value ){
      var c = new Cookie( value );
      var item = prefix + c.name + '=' + c.value;
      if (typeof c === 'object'){
        var timestamp = c.expires.getTime();
        if (timestamp < Date.now()) {
          var re = new RegExp( item + '(;|$)' );
          cookie_str = cookie_str.replace( re, '' );
          cookie_str = cookie_str.replace( ';$', '');
        }
      }
      if (cookie_str) cookie_str += '; ';
      cookie_str += item;
    }
  });

};


var inject = function( prefix ){
  var script = document.createElement('script');
  script.textContent = '(' + processCookies + ')("' + prefix + '")';
  (document.head||document.documentElement).appendChild(script);
  script.parentNode.removeChild(script);
};


getSettings( function( settings, tabId ){
  inject( tabId + settings.separator );
} );
