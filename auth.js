
/* LUMORA — Authentication, Registration & Email Verification */
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const config = window.LUMORA_SUPABASE_CONFIG;

  const $ = id => document.getElementById(id);

  const notice = $('notice');
  const form = $('authForm');
  const submitButton = $('submitButton');

  const firstName = $('firstName');
  const lastName = $('lastName');
  const emailInput = $('email');
  const passwordInput = $('password');

  const nameFields = $('nameFields');
  const formTitle = $('formTitle');
  const formIntro = $('formIntro');

  const loginTab = $('loginTab');
  const signupTab = $('signupTab');
  const tabs = $('tabs');

  const formView = $('formView');
  const successView = $('successView');
  const privacy = $('privacy');

  const forgotWrap = $('forgotWrap');
  const passwordHint = $('passwordHint');

  let currentMode = 'signup';
  let pendingEmail = '';

  function showMessage(message, isError = false) {
    if (!notice) return;

    notice.textContent = message;
    notice.classList.toggle('error', isError);
    notice.style.display = 'block';
  }

  function clearMessage() {
    if (!notice) return;

    notice.textContent = '';
    notice.style.display = 'none';
    notice.classList.remove('error');
  }

  function friendlyError(error) {
    const message =
      error?.message || 'Something went wrong. Please try again.';

    if (/invalid login credentials/i.test(message)) {
      return 'Incorrect email or password. Please check your details.';
    }

    if (/email not confirmed/i.test(message)) {
      return 'Please verify your email before logging in. Check your inbox and Spam folder.';
    }

    if (/already registered|already exists/i.test(message)) {
      return 'An account may already exist for this email. Try logging in instead.';
    }

    if (/rate limit|too many requests/i.test(message)) {
      return 'Too many requests. Please wait a little and try again.';
    }

    return message;
  }

  const requiredElements = [
    notice, form, submitButton, firstName, lastName,
    emailInput, passwordInput, nameFields, formTitle,
    formIntro, loginTab, signupTab, tabs,
    formView, successView, privacy, forgotWrap, passwordHint
  ];

  if (requiredElements.some(element => !element)) {
    console.error('Lumora: required authentication elements are missing.');
    return;
  }

  // Set the page mode immediately, before any asynchronous operation.
  function setMode(mode) {
    currentMode = mode === 'login' ? 'login' : 'signup';

    const isLogin = currentMode === 'login';

    loginTab.classList.toggle('active', isLogin);
    signupTab.classList.toggle('active', !isLogin);

    nameFields.hidden = isLogin;
    firstName.required = !isLogin;
    lastName.required = !isLogin;

    formTitle.textContent = isLogin
      ? 'Welcome back'
      : 'Create your account';

    formIntro.textContent = isLogin
      ? 'Sign in to access your personal energy readings and insights.'
      : 'Create a Lumora account to securely save your energy readings.';

    submitButton.textContent = isLogin
      ? 'Login to Lumora'
      : 'Create account';

    passwordInput.autocomplete = isLogin
      ? 'current-password'
      : 'new-password';

    passwordInput.minLength = isLogin ? 1 : 8;
    passwordInput.placeholder = isLogin
      ? 'Enter your password'
      : 'Create a password';

    passwordHint.textContent = isLogin
      ? 'Enter your account password.'
      : 'Use at least 8 characters.';

    forgotWrap.hidden = !isLogin;

    clearMessage();
  }

  function switchMode(mode) {
    if (!successView.hidden) {
      successView.hidden = true;
      formView.hidden = false;
      tabs.hidden = false;
      privacy.hidden = false;
    }

    const nextMode = mode === 'login' ? 'login' : 'signup';

    history.replaceState(
      null,
      '',
      `./auth.html?mode=${nextMode}`
    );

    setMode(nextMode);
  }

  function showConfirmation(email) {
    pendingEmail = email;

    const sentEmail = $('sentEmail');
    if (sentEmail) sentEmail.textContent = email;

    formView.hidden = true;
    successView.hidden = false;
    tabs.hidden = true;
    privacy.hidden = true;
  }

  // Initialize mode directly from the URL.
  const params = new URLSearchParams(window.location.search);

  setMode(params.get('mode') === 'login' ? 'login' : 'signup');

  // Register tab handlers immediately.
  loginTab.addEventListener('click', event => {
    event.preventDefault();
    switchMode('login');
  });

  signupTab.addEventListener('click', event => {
    event.preventDefault();
    switchMode('signup');
  });

  if (params.get('verified') === '1') {
    setMode('login');
    showMessage(
      'Verification link opened. Please log in to continue. If verification did not complete, try the latest email link again.'
    );
  }

  // Validate configuration after the tabs are already functional.
  if (
    !config ||
    !config.url ||
    !config.publishableKey ||
    !window.supabase ||
    typeof window.supabase.createClient !== 'function'
  ) {
    showMessage(
      'Authentication could not load. Please check supabase-config.js and refresh the page.',
      true
    );
    return;
  }

  const supabaseClient = window.supabase.createClient(
    config.url,
    config.publishableKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );

  // Login and signup
  form.addEventListener('submit', async event => {
    event.preventDefault();
    clearMessage();

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    const submittedMode = currentMode;

    if (!email || !password) {
      showMessage('Please enter your email address and password.', true);
      return;
    }

    if (
      submittedMode === 'signup' &&
      (!firstName.value.trim() || !lastName.value.trim())
    ) {
      showMessage('Please enter both your first name and last name.', true);
      return;
    }

    if (submittedMode === 'signup' && password.length < 8) {
      showMessage('Your password must contain at least 8 characters.', true);
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent =
      submittedMode === 'login' ? 'Logging in…' : 'Creating account…';

    try {
      if (submittedMode === 'login') {
        const { data, error } =
          await supabaseClient.auth.signInWithPassword({
            email,
            password
          });

        if (error) throw error;

        if (!data.session) {
          showMessage(
            'Login did not create a session. Please try again.',
            true
          );
          return;
        }

        window.location.replace('./dashboard.html');
        return;
      }

      const first = firstName.value.trim();
      const last = lastName.value.trim();

      const redirectUrl = new URL(
        './auth.html?verified=1',
        window.location.href
      ).href;

      const { data, error } =
        await supabaseClient.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              first_name: first,
              last_name: last,
              full_name: `${first} ${last}`
            }
          }
        });

      if (error) throw error;

      if (data.user && !data.session) {
        showConfirmation(email);
        return;
      }

      if (data.session) {
        window.location.replace('./dashboard.html');
        return;
      }

      showConfirmation(email);

    } catch (error) {
      console.error('Lumora authentication error:', error);
      showMessage(friendlyError(error), true);

    } finally {
      submitButton.disabled = false;
      submitButton.textContent =
        currentMode === 'login'
          ? 'Login to Lumora'
          : 'Create account';
    }
  });

  // Resend verification email
  const resendButton = $('resendButton');
  const resendHint = $('resendHint');

  if (resendButton && resendHint) {
    resendButton.addEventListener('click', async () => {
      if (!pendingEmail) return;

      resendButton.disabled = true;
      resendHint.textContent = 'Requesting a new verification email…';

      try {
        const redirectUrl = new URL(
          './auth.html?verified=1',
          window.location.href
        ).href;

        const { error } = await supabaseClient.auth.resend({
          type: 'signup',
          email: pendingEmail,
          options: { emailRedirectTo: redirectUrl }
        });

        if (error) throw error;

        resendHint.textContent =
          'A new verification email has been requested. Check your inbox and Spam/Junk folder.';

      } catch (error) {
        resendHint.textContent = friendlyError(error);

      } finally {
        resendButton.disabled = false;
      }
    });
  }

  // Forgot password
  const forgotLink = $('forgotLink');

  if (forgotLink) {
    forgotLink.addEventListener('click', async event => {
      event.preventDefault();

      const email = emailInput.value.trim().toLowerCase();

      if (!email) {
        showMessage(
          'Enter your email address first, then click Forgot password.',
          true
        );
        emailInput.focus();
        return;
      }

      try {
        const redirectUrl = new URL(
          './auth.html?mode=login',
          window.location.href
        ).href;

        const { error } =
          await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: redirectUrl
          });

        if (error) throw error;

        showMessage(
          'If an account exists for this email, a password reset link has been requested.'
        );

      } catch (error) {
        showMessage(friendlyError(error), true);
      }
    });
  }

  console.info('Lumora authentication initialized.');
});

