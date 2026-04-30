(async function () {
  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return;

  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const loginError = document.getElementById('loginError');
  const submitButton = loginForm.querySelector('button[type="submit"]');

  function setLoginError(message) {
    loginError.textContent = String(message || '');
  }

  loginForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    setLoginError('');
    if (submitButton) submitButton.disabled = true;

    try {
      const username = String(usernameInput.value || '').trim();
      const password = String(passwordInput.value || '').trim();
      const result = await window.AppAuth.login(username, password);

      if (!result.ok) {
        setLoginError(result.message);
        return;
      }

      if (result.session.role === 'master') {
        window.location.href = 'mestre.html';
        return;
      }

      window.location.href = 'personagem.html';
    } catch (error) {
      console.error(error);
      setLoginError((error && error.message) ? error.message : 'Erro inesperado ao entrar.');
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });

  try {
    const currentSession = await window.AppAuth.getSession();
    if (currentSession) {
      setLoginError(`Sessao ativa detectada para ${currentSession.username || currentSession.email}. Entre novamente para trocar de conta ou continue usando os atalhos da sessao atual.`);
    }
  } catch (error) {
    console.error(error);
  }
})();
