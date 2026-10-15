```javascript
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

  function showMessage(message, isError = false) {
    notice.textContent = message;
    notice.classList.toggle('error', isError);
    notice.style.display = 'block';
  }

  function clearMessage() {
    notice.textContent = '';
    notice.style.display = 'none';
    notice.classList.remove('error');
  }

  function friendlyError(error) {
    const message =
      error?.message || 'Something went wrong. Please try again.';

    if (/already registered|already exists/i.test(message)) {
      return 'An account may already exist for this email. Try logging in instead.';
    }

    if (/invalid login credentials/i.test(message)) {
      return 'Incorrect email or password. Please check your details.';
    }

    if (/email not confirmed/i.test(message)) {
      return 'Please verify your email before logging in. Check your inbox and Spam folder.';
    }

    if (/rate limit|too many requests/i.test(message)) {
      return 'Too many requests. Please wait a little and try again.';
    }

    return message;
  }

  const requiredElements = [
    notice, form, submitButton, firstName, lastName,
    emailInput, passwordInput, nameFields, formTitle,
    formIntro, loginTab, signupTab, tabs, formView,
    successView, privacy, forgotWrap, passwordHint
  ];

  if (requiredElements.some(element => !element)) {
    console.error(
      'Lumora auth: one or more required HTML elements are missing.'
    );
    return;
  }

  if (
    !config ||
    !config.url ||
    !
