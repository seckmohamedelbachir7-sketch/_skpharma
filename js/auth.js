// auth.js — Authentification (login, register, logout, showApp)

async function init() {
  const { data: { session } } = await sb.auth.getSession();
  if (session) showApp(session.user);
}

async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pwd = document.getElementById('login-pwd').value;
  showMsg('login-msg', '', '');

  if (!email || !pwd) return showMsg('login-msg', 'Veuillez remplir tous les champs.', 'error');

  const { data, error } = await sb.auth.signInWithPassword({ email, password: pwd });

  if (error) {
    const msgs = {
      'Invalid login credentials': 'Email ou mot de passe incorrect.',
      'Email not confirmed': 'Veuillez confirmer votre email avant de vous connecter. Vérifiez votre boîte mail (et les spams).',
      'Too many requests': 'Trop de tentatives. Veuillez patienter quelques minutes.',
    };
    const msg = msgs[error.message] || error.message;
    return showMsg('login-msg', msg, 'error');
  }

  showApp(data.user);
}

// ---- MOT DE PASSE OUBLIÉ ----
function showForgotPassword() {
  document.getElementById('tab-login').style.display = 'none';
  document.getElementById('tab-forgot').style.display = 'block';
  document.getElementById('forgot-email').value = document.getElementById('login-email').value || '';
  showMsg('forgot-msg', '', '');
}

function hideForgotPassword() {
  document.getElementById('tab-forgot').style.display = 'none';
  document.getElementById('tab-login').style.display = 'block';
  showMsg('login-msg', '', '');
}

async function doForgotPassword() {
  const email = document.getElementById('forgot-email').value.trim();
  if (!email) return showMsg('forgot-msg', 'Veuillez entrer votre adresse email.', 'error');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return showMsg('forgot-msg', 'Adresse e-mail invalide.', 'error');

  const btn = document.getElementById('forgot-btn');
  btn.disabled = true;
  btn.textContent = 'Envoi en cours…';
  showMsg('forgot-msg', '', '');

  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + window.location.pathname
  });

  btn.disabled = false;
  btn.textContent = 'Envoyer le lien';

  if (error) {
    const msgs = {
      'Email rate limit exceeded': 'Trop de demandes. Veuillez réessayer dans 1 heure.',
    };
    return showMsg('forgot-msg', msgs[error.message] || ('Erreur : ' + error.message), 'error');
  }

  showMsg('forgot-msg', '✅ Un lien de réinitialisation a été envoyé à ' + email + '. Vérifiez vos spams.', 'success');
  btn.textContent = '✅ Email envoyé';
}

// ---- RÉINITIALISATION MOT DE PASSE (après clic sur le lien email) ----
async function doResetPassword() {
  const pwd  = document.getElementById('reset-pwd').value;
  const pwd2 = document.getElementById('reset-pwd2').value;

  if (!pwd || pwd.length < 6)
    return showMsg('reset-msg', 'Le mot de passe doit contenir au moins 6 caractères.', 'error');
  if (pwd !== pwd2)
    return showMsg('reset-msg', 'Les mots de passe ne correspondent pas.', 'error');

  const btn = document.getElementById('reset-btn');
  btn.disabled = true;
  btn.textContent = 'Enregistrement…';

  const { error } = await sb.auth.updateUser({ password: pwd });

  btn.disabled = false;
  btn.textContent = 'Enregistrer le nouveau mot de passe';

  if (error) return showMsg('reset-msg', 'Erreur : ' + error.message, 'error');

  showMsg('reset-msg', '✅ Mot de passe modifié avec succès !', 'success');
  setTimeout(() => {
    document.getElementById('modal-reset-pwd').classList.remove('open');
    document.getElementById('auth-wrap').style.display = 'flex';
  }, 2000);
}

async function doRegister() {
  const name   = document.getElementById('reg-name').value.trim();
  const pharma = document.getElementById('reg-pharma').value.trim();
  const email  = document.getElementById('reg-email').value.trim();
  const pwd    = document.getElementById('reg-pwd').value;

  if (!name || !email || !pwd)
    return showMsg('reg-msg', 'Veuillez remplir tous les champs obligatoires.', 'error');
  if (pwd.length < 6)
    return showMsg('reg-msg', 'Le mot de passe doit contenir au moins 6 caractères.', 'error');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return showMsg('reg-msg', 'Adresse e-mail invalide.', 'error');

  showMsg('reg-msg', 'Création du compte en cours…', '');

  const { data, error } = await sb.auth.signUp({
    email,
    password: pwd,
    options: { data: { full_name: name, pharmacy_name: pharma } }
  });

  if (error) {
    const msgs = {
      'User already registered': 'Un compte existe déjà avec cet email.',
      'Password should be at least 6 characters': 'Le mot de passe doit contenir au moins 6 caractères.',
      'Email rate limit exceeded': 'Limite d\'envoi d\'emails atteinte. Veuillez réessayer dans 1 heure.',
      'Signups not allowed for this instance': 'Les inscriptions sont temporairement désactivées.',
      'Unable to validate email address: invalid format': 'Adresse e-mail invalide.',
    };
    const msg = msgs[error.message] || ('Erreur : ' + error.message);
    return showMsg('reg-msg', msg, 'error');
  }

  if (data?.user && data.user.identities && data.user.identities.length === 0) {
    return showMsg('reg-msg', 'Un compte existe déjà avec cet email. Utilisez "Se connecter".', 'error');
  }

  showMsg('reg-msg', '✅ Un code à 6 chiffres a été envoyé à votre email.', 'success');
  document.getElementById('otp-section').style.display = 'block';
  document.getElementById('otp-email-hidden').value = email;

  document.getElementById('reg-name').value   = '';
  document.getElementById('reg-pharma').value = '';
  document.getElementById('reg-email').value  = '';
  document.getElementById('reg-pwd').value    = '';
}

async function doLogout() {
  await sb.auth.signOut();
  document.getElementById('auth-wrap').style.display = 'flex';
  document.getElementById('app-wrap').style.display  = 'none';
  currentUser = null;
}

function showApp(user) {
  currentUser = user;
  document.getElementById('auth-wrap').style.display = 'none';
  document.getElementById('app-wrap').style.display  = 'flex';
  const meta = user.user_metadata || {};
  const name = meta.full_name || user.email;
  document.getElementById('nav-name').textContent   = name;
  document.getElementById('nav-avatar').textContent = name.charAt(0).toUpperCase();
  loadDashboard();
  loadPatients();
  initMedicaments();
  initAutoTrash();
  setTodayDate();
}

function setTodayDate() {
  const today = new Date().toISOString().split('T')[0];
  const d = document.getElementById('o-date');
  if (d) d.value = today;
}

// ---- ÉCOUTE DES CHANGEMENTS DE SESSION ----
sb.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session) {
    // Si on revient d'un lien de reset password, ouvrir le modal
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      document.getElementById('auth-wrap').style.display = 'flex';
      document.getElementById('app-wrap').style.display  = 'none';
      document.getElementById('modal-reset-pwd').classList.add('open');
      return;
    }
    showApp(session.user);
  }
  if (event === 'PASSWORD_RECOVERY') {
    document.getElementById('auth-wrap').style.display = 'flex';
    document.getElementById('app-wrap').style.display  = 'none';
    document.getElementById('modal-reset-pwd').classList.add('open');
  }
  if (event === 'SIGNED_OUT') {
    document.getElementById('auth-wrap').style.display = 'flex';
    document.getElementById('app-wrap').style.display  = 'none';
    currentUser = null;
  }
  if (event === 'TOKEN_REFRESHED' && session) {
    currentUser = session.user;
  }

  });

async function verifyOtp() {
  const email = document.getElementById('otp-email-hidden').value;
  const token = document.getElementById('otp-input').value.trim();
  if (!token || token.length < 4)
    return showMsg('otp-msg', 'Entrez le code reçu par email.', 'error');
  const { data, error } = await sb.auth.verifyOtp({ email, token, type: 'signup' });
  if (error)
    return showMsg('otp-msg', 'Code incorrect ou expiré. Vérifiez votre email.', 'error');
  showMsg('otp-msg', '✅ Compte confirmé !', 'success');
  showApp(data.user);
}
