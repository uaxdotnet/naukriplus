let capturedApplyCount = null;

window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  if (event.data?.type === 'NAUKRI_APPLY_COUNT') {
    capturedApplyCount = event.data.count;
    updateApplyCountInPage(capturedApplyCount);
  }
});

function injectPageInterceptor() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('naukriplus.inject.js');
  (document.head || document.documentElement).appendChild(script);
  script.remove();
}

injectPageInterceptor();

function updateApplyCountInPage(applyCount) {
  const statElements = document.querySelectorAll('.styles_jhc__stat__PgY67');
  if (statElements.length === 0) return;

  statElements.forEach(element => {
    const spanChild = element.querySelector('span:last-child');
    if (spanChild && spanChild.textContent.includes('+')) {
      spanChild.textContent = applyCount;
    }
  });
}

function tryUpdateFromCache() {
  if (capturedApplyCount !== null) {
    updateApplyCountInPage(capturedApplyCount);
  }
}

if (window.location.pathname.includes('job-listings')) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(tryUpdateFromCache, 500);
    });
  } else {
    tryUpdateFromCache();
  }
}
