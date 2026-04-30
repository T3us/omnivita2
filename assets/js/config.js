(function () {
  const runtime = window.OMNIVITA_RUNTIME_CONFIG || {};
  const hostname = String(window.location.hostname || '').trim().toLowerCase();
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const defaultLocalApiBaseUrl = 'http://localhost:3001';
  const runtimeApiBaseUrl = String(runtime.apiBaseUrl || '').trim();

  window.APP_CONFIG = {
    appName: 'OmniVita Campaign Panel',
    storageKey: 'omnivita_campaign_cache_v1',
    legacyStorageKey: 'omnivita_campaign_data_v2',
    sessionKey: 'omnivita_api_session_v1',
    legacySessionKey: 'omnivita_session_v2',
    apiBaseUrl: isLocalhost ? defaultLocalApiBaseUrl : runtimeApiBaseUrl,
    defaultLocalApiBaseUrl,
    runtimeApiBaseUrl
  };
})();
