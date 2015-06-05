var App = (function(){

  var settings = {
    separator: '_@@@_'
  };

  var init = function(){
    initSettings();
    initMessaging();
    initTabs();
    initWebRequestObserver();
  };


  var initSettings = function(){
    settings.filter = (localStorage.filter || '').split('\n');
    chrome.tabs.query({}, function(tabs){
      for (var i = 0, len = tabs.length; i < len; i++) {
        var tab = tabs[i];
        if ( isWhitelisted( tab.url ) ) removeExtensionCookies( tab.id );
      }
    });
  };


  var initMessaging = function(){
    chrome.runtime.onMessage.addListener(
      function(request, sender, sendResponse) {
        if (request.cmd === 'update_settings') {
          initSettings();
        }
        else if (request.cmd === 'get_settings') {
          if ( isWhitelisted(sender.tab.url) ) {
            sendResponse( {settings: settings, tabId: sender.tab.id} );
          }
        }
      });
  };


  var initTabs = function(){
    chrome.tabs.onRemoved.addListener(function( tabId, removeInfo ){
      removeExtensionCookies( tabId );
    });
  };


  var removeExtensionCookies = function( tabId ){
    chrome.cookies.getAll({}, function(cookies){
      for (var i = 0, len = cookies.length; i < len; i++) {
        var cookie = cookies[i];
        if ( cookie.name.indexOf( tabId + settings.separator ) !== -1 ) {
          chrome.cookies.remove( {url: extrapolateUrlFromCookie(cookie), name: cookie.name, storeId: cookie.storeId} );
        }
      }
    });
  };


  /**
   * http://stackoverflow.com/questions/5460698/removing-a-cookie-from-within-a-chrome-extension#
   */
  function extrapolateUrlFromCookie(cookie) {
      var prefix = cookie.secure ? "https://" : "http://";
      if (cookie.domain.charAt(0) == ".")
          prefix += "www";

      return prefix + cookie.domain + cookie.path;
  }



  var initWebRequestObserver = function(){
    initBeforeSendHeaders();
    initHeadersReceived();
  };


  /**
   * Adding prefix to cookies
   */
  var initHeadersReceived = function(){
    var callback = function( info ){
      if (info.tabId === -1) return;
      if ( !isWhitelisted(info.url) ) return;
      var headers = info.responseHeaders;
      var cookies = [];
      headers.forEach(function(header, i) {
        if (header.name.toLowerCase() === 'set-cookie') {
          if (header.value.match(/Expires=/)) return;
          header.value = addPrefix( header.value, info.tabId );
        }
      });
      return {responseHeaders: headers};
    };

    var filter = {urls: ['<all_urls>']};
    var opt_extraInfoSpec = ["blocking", "responseHeaders"];
    chrome.webRequest.onHeadersReceived.addListener(
      callback, filter, opt_extraInfoSpec
    );
  };


  // Sending only cookies with according tabId
  var initBeforeSendHeaders = function(){

    var callback = function( info ){
      if ( !isWhitelisted(info.url) ) return;
      var headers = info.requestHeaders;
      headers.forEach(function(header, i) {
        if (header.name.toLowerCase() === 'cookie') {
          var newValue = processCookieStr( header.value, info.tabId );
          header.value = newValue;
        }
      });
      return {requestHeaders: headers};
    };

    var filter = {urls: ['<all_urls>']};
    var opt_extraInfoSpec = ["blocking", "requestHeaders"];

    chrome.webRequest.onBeforeSendHeaders.addListener(
      callback, filter, opt_extraInfoSpec
    );
  };


  var isWhitelisted = function( url ){
    for (var i = 0, len = settings.filter.length; i < len; i++) {
      var pattern = settings.filter[i];
      if (!pattern) continue;
      var re = new RegExp( pattern, 'i');
      if ( url.match( re )) {
        return true;
      }
    }
    return false;
  };


  var processCookieStr = function( str, tabId ){
    var pairs = str.split('; ');
    var cookies = {};
    for (var i = 0, len = pairs.length; i < len; i++) {
      var pair = pairs[i].split('=');
      var key = pair[0];
      if (key.indexOf( tabId ) === 0) cookies[ removePrefix(key) ] = pair[1];
      else cookies[key] = pair[1];
    }
    var res = '';
    for (var key in cookies) {
      res += key + '=' + cookies[key] + '; ';
    }
    return res;
  };


  var addPrefix = function( str, tabId){
    return tabId + settings.separator + str;
  };


  var removePrefix = function( str ){
    var re = new RegExp( '\\d+' + settings.separator );
    return str.replace( re, '');
  };


  return {
    init: init
  };

})();


App.init();
