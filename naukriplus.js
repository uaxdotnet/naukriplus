let capturedApplyCount = null;

// Receive applyCount from the injected page script
window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  if (event.data?.type === 'NAUKRI_APPLY_COUNT') {
    capturedApplyCount = event.data.count;
    // console.log("[NaukriPlus] Received applyCount:", capturedApplyCount);
    updateApplyCountInPage(capturedApplyCount);
  }
});

// Inject interceptor into the page's own JS context
function injectPageInterceptor() {
  const script = document.createElement('script');
  script.textContent = `(${pageInterceptor.toString()})();`;
  (document.head || document.documentElement).appendChild(script);
  script.remove();
}

function pageInterceptor() {
  // intercept fetch
  let _fetch = window.fetch;
  Object.defineProperty(window, 'fetch', {
    get: function() { return patchedFetch; },
    set: function(fn) { _fetch = fn; },
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
        }).catch(() => {});
      });
    }
    return result;
  }

  // intercept XHR
  let _XHR = window.XMLHttpRequest;
  Object.defineProperty(window, 'XMLHttpRequest', {
    get: function() { return PatchedXHR; },
    set: function(fn) { _XHR = fn; },
    configurable: false
  });

  function PatchedXHR() {
    const xhr = new _XHR();

    const origOpen = xhr.open;
    xhr.open = function(method, url) {
      const urlStr = typeof url === 'string' ? url : (url?.href || '');
      if (urlStr.includes('/jobapi/v4/job/')) {
        xhr.addEventListener('readystatechange', function() {
          if (xhr.readyState === 4) {
            try {
              const data = xhr.responseType === 'json' ? xhr.response : JSON.parse(xhr.responseText);
              const c = data?.jobDetails?.applyCount;
              if (c !== undefined) window.postMessage({ type: 'NAUKRI_APPLY_COUNT', count: c }, '*');
            } catch (e) {}
          }
        });
      }
      return origOpen.apply(xhr, arguments);
    };

    const origSend = xhr.send;
    xhr.send = function() {
      return origSend.apply(xhr, arguments);
    };

    return xhr;
  }
  PatchedXHR.prototype = _XHR.prototype;
}

injectPageInterceptor();

// DOM update
function updateApplyCountInPage(applyCount) {
  const statElements = document.querySelectorAll('.styles_jhc__stat__PgY67');
  if (statElements.length === 0) {
    console.warn("[NaukriPlus] No stat elements found in DOM — page not ready yet");
    return;
  }

  statElements.forEach(element => {
    const spanChild = element.querySelector('span:last-child');
    if (spanChild && (spanChild.textContent.includes('+'))) {
      spanChild.textContent = applyCount;
      console.log("[NaukriPlus] Updated apply count to:", applyCount);
    } else {
      console.warn("[NaukriPlus] No '+' span found in stat element — selector changed?");
    }
  });
}

// Verify patches
setTimeout(() => {
  console.log("[NaukriPlus] Page interceptor active:",
    typeof window.wrappedJSObject?.fetch?.toString !== 'undefined' &&
    window.wrappedJSObject?.fetch?.toString().includes('patchedFetch'));
}, 1000);

// Startup
if (window.location.pathname.includes('job-listings')) {
  console.log("[NaukriPlus] Job listings page detected");
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (capturedApplyCount !== null) {
        setTimeout(() => updateApplyCountInPage(capturedApplyCount), 500);
      } else {
        console.log("[NaukriPlus] API hasn't responded yet, waiting...");
      }
    });
  }
}
