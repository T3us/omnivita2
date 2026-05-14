(function () {
  const runtime = window.OMNIVITA_RUNTIME_CONFIG || {};
  const runtimeApiBaseUrl = String(runtime.apiBaseUrl || '').trim();

  window.APP_CONFIG = {
    appName: 'OmniVita Campaign Panel',
    storageKey: 'omnivita_campaign_cache_v1',
    legacyStorageKey: 'omnivita_campaign_data_v2',
    sessionKey: 'omnivita_api_session_v1',
    legacySessionKey: 'omnivita_session_v2',
    apiBaseUrl: runtimeApiBaseUrl,
    defaultLocalApiBaseUrl: '',
    runtimeApiBaseUrl
  };
})();
