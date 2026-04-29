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
    // Messages d'erreur traduits en français
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

async function doRegister() {
  const name   = document.getElementById('reg-name').value.trim();
  const pharma = document.getElementById('reg-pharma').value.trim();
  const email  = document.getElementById('reg-email').value.trim();
  const pwd    = document.getElementById('reg-pwd').value;

  // Validations côté client
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
    // Messages traduits
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

  // ⚠️ Cas silencieux : Supabase renvoie data.user mais identities vide
  // = email déjà utilisé mais Supabase ne retourne pas d'erreur explicite
  if (data?.user && data.user.identities && data.user.identities.length === 0) {
    return showMsg('reg-msg', 'Un compte existe déjà avec cet email. Utilisez "Se connecter".', 'error');
  }

  showMsg('reg-msg', '✅ Un code à 6 chiffres a été envoyé à votre email.', 'success');
document.getElementById('otp-section').style.display = 'block';
document.getElementById('otp-email-hidden').value = email;

  // Vider le formulaire après succès
  document.getElementById('reg-name').value  = '';
  document.getElementById('reg-pharma').value = '';
  document.getElementById('reg-email').value = '';
  document.getElementById('reg-pwd').value   = '';
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

// ---- PATIENTS ----
// Écoute les changements de session en temps réel
sb.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session) {
    showApp(session.user);
  }
  if (event === 'SIGNED_OUT') {
    document.getElementById('auth-wrap').style.display = 'flex';
    document.getElementById('app-wrap').style.display  = 'none';
    currentUser = null;
  }
  if (event === 'TOKEN_REFRESHED' && session) {
    // Evite le clignotement lors du refresh du token
    currentUser = session.user;
  }
  async function verifyOtp() {
  const email = document.getElementById('otp-email-hidden').value;
  const token = document.getElementById('otp-input').value.trim();

  if (!token || token.length !== 6)
    return showMsg('otp-msg', 'Entrez le code à 6 chiffres reçu par email.', 'error');

  const { data, error } = await sb.auth.verifyOtp({
    email,
    token,
    type: 'signup'
  });

  if (error)
    return showMsg('otp-msg', 'Code incorrect ou expiré. Vérifiez votre email.', 'error');

  showMsg('otp-msg', '✅ Compte confirmé !', 'success');
  showApp(data.user);
}
});

