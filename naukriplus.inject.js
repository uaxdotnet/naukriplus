(function () {
  let _fetch = window.fetch;
  Object.defineProperty(window, 'fetch', {
    get: function () { return patchedFetch; },
    set: function (fn) { _fetch = fn; },
    configurable: false
  });

  function patchedFetch(...args) {
    const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
    const result = _fetch.apply(this, args);

    if (url.includes('/jobapi/v4/job/')) {
      result.then((response) => {
        response.clone().json().then((data) => {
          const c = data?.jobDetails?.applyCount;
          if (c !== undefined) window.postMessage({ type: 'NAUKRI_APPLY_COUNT', count: c }, '*');
        }).catch(() => { });
      });
    }
    return result;
  }

  let _XHR = window.XMLHttpRequest;
  Object.defineProperty(window, 'XMLHttpRequest', {
    get: function () { return PatchedXHR; },
    set: function (fn) { _XHR = fn; },
    configurable: false
  });

  function PatchedXHR() {
    const xhr = new _XHR();

    const origOpen = xhr.open;
    xhr.open = function (method, url) {
      const urlStr = typeof url === 'string' ? url : (url?.href || '');
      if (urlStr.includes('/jobapi/v4/job/')) {
        xhr.addEventListener('readystatechange', function () {
          if (xhr.readyState === 4) {
            try {
              const data = xhr.responseType === 'json' ? xhr.response : JSON.parse(xhr.responseText);
              const c = data?.jobDetails?.applyCount;
              if (c !== undefined) window.postMessage({ type: 'NAUKRI_APPLY_COUNT', count: c }, '*');
            } catch (e) { }
          }
        });
      }
      return origOpen.apply(xhr, arguments);
    };

    const origSend = xhr.send;
    xhr.send = function () {
      return origSend.apply(xhr, arguments);
    };

    return xhr;
  }
  PatchedXHR.prototype = _XHR.prototype;
})();
