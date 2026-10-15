
(() => {
  "use strict";

  const config = window.LUMORA_SUPABASE_CONFIG;

  const form = document.getElementById("authForm");
  const loginTab = document.getElementById("loginTab");
  const signupTab = document.getElementById("signupTab");
  const title = document.getElementById("formTitle");
  const subtitle = document.getElementById("formSubtitle");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const passwordHint = document.getElementById("passwordHint");
  const submitButton = document.getElementById("submitButton");
  const forgotLink = document.getElementById("forgotLink");
  const messageBox = document.getElementById("message");

  let mode = "login";
  let supabaseClient = null;

  function showMessage(message, type = "info") {
    messageBox.textContent = message;
    messageBox.className = `message show ${type}`;
  }

  function clearMessage() {
    messageBox.textContent = "";
    messageBox.className = "message";
  }

  function setLoading(loading, label) {
    submitButton.disabled = loading;
    submitButton.textContent = loading ? "Please wait..." : label;
  }

  function setMode(nextMode) {
    mode = nextMode;
    clearMessage();

    const isLogin = mode === "login";

    loginTab.classList.toggle("active", isLogin);
    signupTab.classList.toggle("active", !isLogin);
    loginTab.setAttribute("aria-selected", String(isLogin));
    signupTab.setAttribute("aria-selected", String(!isLogin));

    title.textContent = isLogin ? "Welcome back" : "Create your account";
    subtitle.textContent = isLogin
      ? "Sign in to access your personal energy readings and insights."
      : "Create a Lumora account to securely save your energy readings.";

    passwordInput.autocomplete = isLogin ? "current-password" : "new-password";
    passwordHint.textContent = isLogin
      ? "Enter your account password."
      : "Use at least 8 characters.";

    forgotLink.style.display = isLogin ? "block" : "none";
    setLoading(false, isLogin ? "Login to Lumora" : "Create account");
  }

  function getSafeDashboardUrl() {
    return new URL("./index.html", window.location.href).href;
  }

  function getSafeAuthUrl() {
    return new URL("./auth.html", window.location.href).href;
  }

  async function init() {
    if (!config || !config.url || !config.publishableKey) {
      showMessage(
        "Supabase configuration is missing. Check supabase-config.js.",
        "error"
      );
      submitButton.disabled = true;
      return;
    }

    if (!window.supabase || typeof window.supabase.createClient !== "function") {
      showMessage(
        "Supabase library could not load. Refresh the page and try again.",
        "error"
      );
      submitButton.disabled = true;
      return;
    }

    supabaseClient = window.supabase.createClient(
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

    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
      showMessage("Could not check your session. Please try again.", "error");
      return;
    }

    if (data.session) {
      window.location.replace(getSafeDashboardUrl());
      return;
    }

    const params = new URLSearchParams(window.location.search);

    if (params.get("type") === "recovery") {
      showMessage(
        "Password recovery link detected. Enter your new password below and choose Create account to continue is not supported here. Please use the password reset email flow.",
        "info"
      );
    }
  }

  loginTab.addEventListener("click", () => setMode("login"));
  signupTab.addEventListener("click", () => setMode("signup"));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage();

    if (!supabaseClient) {
      showMessage("Supabase is not ready. Refresh and try again.", "error");
      return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showMessage("Enter your email address and password.", "error");
      return;
    }

    if (password.length < 8) {
      showMessage("Password must contain at least 8 characters.", "error");
      return;
    }

    setLoading(true, "");

    try {
      if (mode === "signup") {
        const { data, error } = await supabaseClient.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: getSafeDashboardUrl()
          }
        });

        if (error) throw error;

        if (data.session) {
          showMessage("Account created. Opening your dashboard...", "success");
          window.location.replace(getSafeDashboardUrl());
          return;
        }

        showMessage(
          "Account request submitted. Check your email for a confirmation link before logging in.",
          "success"
        );
        setMode("login");
      } else {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        if (!data.session) {
          showMessage("Login did not create a session. Please try again.", "error");
          return;
        }

        showMessage("Login successful. Opening Lumora...", "success");
        window.location.replace(getSafeDashboardUrl());
        return;
      }
    } catch (error) {
      const rawMessage = String(error?.message || "").toLowerCase();

      if (rawMessage.includes("invalid login credentials")) {
        showMessage("Email or password is incorrect.", "error");
      } else if (rawMessage.includes("already registered")) {
        showMessage(
          "This email already has an account. Switch to Login instead.",
          "error"
        );
      } else if (rawMessage.includes("password")) {
        showMessage(error.message, "error");
      } else if (rawMessage.includes("rate limit")) {
        showMessage("Too many attempts. Wait a while and try again.", "error");
      } else {
        showMessage(error.message || "Something went wrong. Please try again.", "error");
      }
    } finally {
      setLoading(false, mode === "login" ? "Login to Lumora" : "Create account");
    }
  });

  forgotLink.addEventListener("click", async (event) => {
    event.preventDefault();
    clearMessage();

    if (!supabaseClient) {
      showMessage("Supabase is not ready. Refresh and try again.", "error");
      return;
    }

    const email = emailInput.value.trim();

    if (!email) {
      showMessage("Enter your email address first, then click Forgot password.", "info");
      emailInput.focus();
      return;
    }

    setLoading(true, "");

    try {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: getSafeAuthUrl()
      });

      if (error) throw error;

      showMessage(
        "If an account exists for this address, a password reset email will be sent. Check your inbox.",
        "success"
      );
    } catch (error) {
      showMessage(error.message || "Could not send the reset email.", "error");
    } finally {
      setLoading(false, "Login to Lumora");
    }
  });

  setMode("login");
  init();
})();
