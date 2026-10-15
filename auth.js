
/* LUMORA — Authentication, Registration & Email Verification */
'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const config = window.LUMORA_SUPABASE_CONFIG;

  const notice = document.getElementById('notice');
  const form = document.getElementById('authForm');
  const submitButton = document.getElementById('submitButton');

  const firstName = document.getElementById('firstName');
  const lastName = document.getElementById('lastName');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  const nameFields = document.getElementById('nameFields');
  const formTitle = document.getElementById('formTitle');
  const formIntro = document.getElementById('formIntro');

  const loginTab = document.getElementById('loginTab');
  const signupTab = document.getElementById('signupTab');
  const tabs = document.getElementById('tabs');

  const formView = document.getElementById('formView');
  const successView = document.getElementById('successView');
  const privacy = document.getElementById('privacy');

  const forgotWrap = document.getElementById('forgotWrap');
  const passwordHint = document.getElementById('passwordHint');

  let currentMode = 'signup';
  let pendingEmail = '';

  function showMessage(text, isError = false) {
    notice.textContent = text;
    notice.classList.toggle('error', isError);
    notice.style.display = 'block';
  }

  function clearMessage() {
    notice.textContent = '';
    notice.style.display = 'none';
    notice.classList.remove('error');
  }

  function friendlyError(error) {
    const text =
      error?.message || 'Something went wrong. Please try again.';

    if (/already registered|already exists/i.test(text)) {
      return 'An account may already exist for this email. Try logging in instead.';
    }

    if (/invalid login credentials/i.test(text)) {
      return 'Incorrect email or password. Please check your details.';
    }

    if (/email not confirmed/i.test(text)) {
      return 'Please verify your email before logging in. Check your inbox and Spam folder.';
    }

    if (/rate limit|too many requests/i.test(text)) {
      return 'Too many requests. Please wait a little and try again.';
    }

    return text;
  }

  // Check required HTML elements and Supabase configuration.
  const requiredElements = [
    notice, form, submitButton, firstName, lastName,
    emailInput, passwordInput, nameFields, formTitle,
    formIntro, loginTab, signupTab, tabs, formView,
    successView, privacy, forgotWrap, passwordHint
  ];

  if (requiredElements.some(element => !element)) {
    console.error('Lumora auth: one or more required HTML elements are missing.');
    return;
  }

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

  const params = new URLSearchParams(window.location.search);

  /*
   * IMPORTANT:
   * Do not redirect users away from auth.html just because
   * a previous Supabase session exists.
   */
  try {
    const { error } = await supabaseClient.auth.getSession();

    if (error) {
      console.warn('Session check:', error.message);
    }
  } catch (error) {
    console.warn('Unable to check the current session:', error);
  }

  currentMode =
    params.get('mode') === 'login' ? 'login' : 'signup';

  function setMode(mode) {
    currentMode = mode;

    const isLogin = mode === 'login';

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

  function showConfirmation(email) {
    pendingEmail = email;

    document.getElementById('sentEmail').textContent = email;

    formView.hidden = true;
    successView.hidden = false;
    tabs.hidden = true;
    privacy.hidden = true;
  }

  setMode(currentMode);

  if (params.get('verified') === '1') {
    setMode('login');
    showMessage(
      'Verification link opened. Please log in to continue. If verification did not complete, try the latest email link again.'
    );
  }

  // Login tab
  loginTab.addEventListener('click', event => {
    event.preventDefault();

    history.replaceState(
      null,
      '',
      './auth.html?mode=login'
    );

    if (successView.hidden === false) {
      successView.hidden = true;
      formView.hidden = false;
      tabs.hidden = false;
      privacy.hidden = false;
    }

    setMode('login');
  });

  // Signup tab
  signupTab.addEventListener('click', event => {
    event.preventDefault();

    history.replaceState(
      null,
      '',
      './auth.html?mode=signup'
    );

    if (successView.hidden === false) {
      successView.hidden = true;
      formView.hidden = false;
      tabs.hidden = false;
      privacy.hidden = false;
    }

    setMode('signup');
  });

  // Login and signup form submission
  form.addEventListener('submit', async event => {
    event.preventDefault();
    clearMessage();

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    if (!email || !password) {
      showMessage(
        'Please enter your email address and password.',
        true
      );
      return;
    }

    if (
      currentMode === 'signup' &&
      (!firstName.value.trim() || !lastName.value.trim())
    ) {
      showMessage(
        'Please enter both your first name and last name.',
        true
      );
      return;
    }

    if (currentMode === 'signup' && password.length < 8) {
      showMessage(
        'Your password must contain at least 8 characters.',
        true
      );
      return;
    }

    const submittedMode = currentMode;

    submitButton.disabled = true;
    submitButton.textContent =
      submittedMode === 'login'
        ? 'Logging in…'
        : 'Creating account…';

    try {
      if (submittedMode === 'login') {
        const { data, error } =
          await supabaseClient.auth.signInWithPassword({
            email,
            password
          });

        if (error) {
          throw error;
        }

        if (!data.session) {
          showMessage(
            'Login did not create a session. Please try again.',
            true
          );
          return;
        }

        window.location.assign('./index.html');
        return;
      }

      // Signup
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

      if (error) {
        throw error;
      }

      if (data.user && !data.session) {
        showConfirmation(email);
        return;
      }

      if (data.session) {
        window.location.assign('./index.html');
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

  // Resend email verification
  const resendButton = document.getElementById('resendButton');
  const resendHint = document.getElementById('resendHint');

  if (resendButton && resendHint) {
    resendButton.addEventListener('click', async () => {
      if (!pendingEmail) {
        return;
      }

      resendButton.disabled = true;
      resendHint.textContent =
        'Requesting a new verification email…';

      try {
        const redirectUrl = new URL(
          './auth.html?verified=1',
          window.location.href
        ).href;

        const { error } = await supabaseClient.auth.resend({
          type: 'signup',
          email: pendingEmail,
          options: {
            emailRedirectTo: redirectUrl
          }
        });

        if (error) {
          throw error;
        }

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
  const forgotLink = document.getElementById('forgotLink');

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
          await supabaseClient.auth.resetPasswordForEmail(
            email,
            {
              redirectTo: redirectUrl
            }
          );

        if (error) {
          throw error;
        }

        showMessage(
          'If an account exists for this email, a password reset link has been requested.'
        );

      } catch (error) {
        showMessage(friendlyError(error), true);
      }
    });
  }
});
