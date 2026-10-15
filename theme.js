
(() => {
  "use strict";

  const STORAGE_KEY = "lumora-theme";

  const themes = {
    arctic: {
      bg: "#F4F7FB",
      bgSoft: "#EAF0F6",
      panel: "#FFFFFF",
      panelLight: "#F0F5F9",
      accent: "#087E8B",
      accentBright: "#0A9AA8",
      secondary: "#16A085",
      text: "#172B42",
      muted: "#63758B",
      border: "rgba(35,76,105,.18)",
      header: "rgba(244,247,251,.96)",
      buttonText: "#FFFFFF",
      shadow: "rgba(28,58,83,.10)",
      glow: "rgba(8,126,139,.10)"
    },

    emerald: {
      bg: "#071A16",
      bgSoft: "#0B241D",
      panel: "#112D25",
      panelLight: "#183B30",
      accent: "#34D399",
      accentBright: "#42E6A7",
      secondary: "#B7F36B",
      text: "#F0FFF7",
      muted: "#B0D1C2",
      border: "rgba(112,226,174,.20)",
      header: "rgba(7,26,22,.96)",
      buttonText: "#062219",
      shadow: "rgba(0,0,0,.25)",
      glow: "rgba(52,211,153,.11)"
    },

    amethyst: {
      bg: "#09070E",
      bgSoft: "#100C18",
      panel: "#191322",
      panelLight: "#241A31",
      accent: "#B18CFF",
      accentBright: "#C6A8FF",
      secondary: "#E1A8FF",
      text: "#F8F3FF",
      muted: "#C2B6D3",
      border: "rgba(190,157,255,.20)",
      header: "rgba(9,7,14,.96)",
      buttonText: "#160D26",
      shadow: "rgba(0,0,0,.32)",
      glow: "rgba(177,140,255,.12)"
    }
  };

  const root = document.documentElement;
  const STYLE_ID = "lumora-theme-styles";

  const css = `
    :root {
      --bg: var(--lumora-bg);
      --bg-soft: var(--lumora-bg-soft);
      --panel: var(--lumora-panel);
      --panel-light: var(--lumora-panel-light);
      --cyan: var(--lumora-accent);
      --cyan-bright: var(--lumora-accent-bright);
      --green: var(--lumora-secondary);
      --text: var(--lumora-text);
      --muted: var(--lumora-muted);
      --border: var(--lumora-border);
    }

    html[data-lumora-theme="arctic"] {
      color-scheme: light;
    }

    html[data-lumora-theme="emerald"],
    html[data-lumora-theme="amethyst"] {
      color-scheme: dark;
    }

    body {
      background: var(--lumora-bg) !important;
      color: var(--lumora-text) !important;
      transition: background-color .25s ease, color .25s ease;
    }

    body::before {
      background:
        radial-gradient(
          ellipse at 15% 12%,
          var(--lumora-glow),
          transparent 38%
        ),
        radial-gradient(
          ellipse at 88% 45%,
          color-mix(in srgb, var(--lumora-secondary) 8%, transparent),
          transparent 32%
        ),
        linear-gradient(
          180deg,
          var(--lumora-bg),
          var(--lumora-bg-soft) 55%,
          var(--lumora-bg)
        ) !important;
    }

    .site-header {
      background: var(--lumora-header) !important;
      border-color: var(--lumora-border) !important;
    }

    .site-header .brand-name,
    .site-header .nav-links a,
    .site-header .login-link {
      color: var(--lumora-text) !important;
    }

    .site-header .brand-name span {
      color: var(--lumora-accent) !important;
    }

    .feature-card,
    .auth-card,
    .auth-panel,
    .login-card,
    .signup-card,
    .dashboard-card,
    .stat-card,
    .chart-card,
    .panel,
    .card,
    .reading-card,
    .calculator-card {
      background: var(--lumora-panel) !important;
      border-color: var(--lumora-border) !important;
      color: var(--lumora-text) !important;
    }

    .feature-card:hover {
      background: var(--lumora-panel-light) !important;
      border-color: var(--lumora-accent) !important;
    }

    .step-card {
      background: linear-gradient(
        180deg,
        var(--lumora-panel),
        transparent
      ) !important;
      border-color: var(--lumora-border) !important;
    }

    .about-mark {
      background:
        radial-gradient(
          circle at 50% 45%,
          var(--lumora-glow),
          transparent 55%
        ),
        var(--lumora-panel) !important;
      border-color: var(--lumora-border) !important;
    }

    /* CTA panel and heading contrast fix */
    .cta-panel {
      background:
        radial-gradient(
          ellipse at 50% 0%,
          var(--lumora-glow),
          transparent 65%
        ),
        linear-gradient(
          135deg,
          var(--lumora-panel-light),
          var(--lumora-panel)
        ) !important;
      border-color: var(--lumora-border) !important;
      color: var(--lumora-text) !important;
    }

    .cta-panel h2 {
      color: var(--lumora-text) !important;
      -webkit-text-fill-color: var(--lumora-text) !important;
      opacity: 1 !important;
      visibility: visible !important;
    }

    .cta-panel h2 .gradient-text {
      color: var(--lumora-accent) !important;
      background: none !important;
      -webkit-background-clip: initial !important;
      background-clip: initial !important;
      -webkit-text-fill-color: var(--lumora-accent) !important;
      opacity: 1 !important;
    }

    .cta-panel p {
      color: var(--lumora-muted) !important;
    }

    .cta-panel .section-kicker {
      color: var(--lumora-accent) !important;
    }

    /* General readable text */
    h1, h2, h3, h4 {
      color: var(--lumora-text);
    }

    .hero-description,
    .section-heading p,
    .feature-card p,
    .step-card p,
    .about-copy p,
    .cta-panel p {
      color: var(--lumora-muted) !important;
    }

    .section-kicker,
    .feature-icon,
    .step-number,
    .about-point svg {
      color: var(--lumora-accent) !important;
    }

    .eyebrow {
      color: var(--lumora-accent) !important;
      background: color-mix(
        in srgb,
        var(--lumora-accent) 9%,
        transparent
      ) !important;
      border-color: var(--lumora-border) !important;
    }

    .gradient-text {
      background: linear-gradient(
        100deg,
        var(--lumora-accent-bright),
        var(--lumora-secondary)
      ) !important;
      -webkit-background-clip: text !important;
      background-clip: text !important;
      -webkit-text-fill-color: transparent !important;
    }

    .button-primary,
    .btn-primary,
    input[type="submit"] {
      color: var(--lumora-button-text) !important;
      background: linear-gradient(
        135deg,
        var(--lumora-accent-bright),
        var(--lumora-accent)
      ) !important;
      border-color: transparent !important;
    }

    .button-outline,
    .btn-outline {
      color: var(--lumora-text) !important;
      background: var(--lumora-panel) !important;
      border-color: var(--lumora-border) !important;
    }

    input,
    select,
    textarea {
      color: var(--lumora-text) !important;
      background: var(--lumora-panel) !important;
      border-color: var(--lumora-border) !important;
    }

    input::placeholder,
    textarea::placeholder {
      color: var(--lumora-muted) !important;
    }

    .site-footer {
      background: var(--lumora-bg-soft) !important;
      border-color: var(--lumora-border) !important;
    }

    .trust-strip,
    .trust-strip strong,
    .about-point,
    .footer-links,
    .footer-bottom,
    .footer-brand p,
    .hero-note,
    .login-link,
    .nav-links > a:not(.button) {
      color: var(--lumora-muted) !important;
    }

    .footer-links a:hover,
    .nav-links a:hover {
      color: var(--lumora-accent) !important;
    }

    /* Customize button and theme picker */
    #lumora-theme-widget {
      position: fixed;
      right: 22px;
      bottom: 22px;
      z-index: 99999;
      font-family: "DM Sans", system-ui, sans-serif;
    }

    #lumora-theme-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 9px;
      min-height: 46px;
      padding: 0 17px;
      border: 1px solid var(--lumora-border);
      border-radius: 999px;
      background: var(--lumora-panel);
      color: var(--lumora-text);
      box-shadow: 0 10px 30px var(--lumora-shadow);
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: transform .2s ease, border-color .2s ease;
    }

    #lumora-theme-toggle:hover {
      border-color: var(--lumora-accent);
      transform: translateY(-2px);
    }

    #lumora-theme-menu {
      position: absolute;
      right: 0;
      bottom: 58px;
      width: min(320px, calc(100vw - 28px));
      padding: 15px;
      border: 1px solid var(--lumora-border);
      border-radius: 18px;
      background: var(--lumora-panel);
      color: var(--lumora-text);
      box-shadow: 0 18px 55px var(--lumora-shadow);
    }

    #lumora-theme-menu[hidden] {
      display: none !important;
    }

    .theme-menu-title {
      margin: 2px 4px 4px;
      color: var(--lumora-text);
      font-size: 15px;
      font-weight: 800;
    }

    .theme-menu-subtitle {
      margin: 0 4px 13px;
      color: var(--lumora-muted);
      font-size: 11px;
    }

    .lumora-theme-option {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 11px;
      padding: 11px;
      margin-top: 7px;
      border: 1px solid var(--lumora-border);
      border-radius: 12px;
      text-align: left;
      background: transparent;
      color: var(--lumora-text);
      cursor: pointer;
    }

    .lumora-theme-option:hover,
    .lumora-theme-option[aria-pressed="true"] {
      border-color: var(--lumora-accent);
      background: var(--lumora-panel-light);
    }

    .theme-swatches {
      display: flex;
      flex-shrink: 0;
      gap: 3px;
    }

    .theme-swatches i {
      width: 13px;
      height: 29px;
      border-radius: 5px;
      border: 1px solid rgba(127,127,127,.2);
    }

    .theme-option-copy {
      display: grid;
      gap: 2px;
      flex: 1;
    }

    .theme-option-copy strong {
      color: var(--lumora-text);
      font-size: 12px;
    }

    .theme-option-copy small {
      color: var(--lumora-muted);
      font-size: 10px;
    }

    .theme-check {
      color: var(--lumora-accent);
      font-size: 16px;
    }

    @media (max-width: 480px) {
      #lumora-theme-widget {
        right: 12px;
        bottom: 12px;
      }

      #lumora-theme-toggle {
        min-height: 43px;
        padding: 0 14px;
      }

      #lumora-theme-menu {
        bottom: 53px;
      }
    }
  `;

  function applyTheme(key) {
    if (!themes[key]) key = "amethyst";
    const theme = themes[key];

    root.dataset.lumoraTheme = key;

    const variables = {
      "--lumora-bg": theme.bg,
      "--lumora-bg-soft": theme.bgSoft,
      "--lumora-panel": theme.panel,
      "--lumora-panel-light": theme.panelLight,
      "--lumora-accent": theme.accent,
      "--lumora-accent-bright": theme.accentBright,
      "--lumora-secondary": theme.secondary,
      "--lumora-text": theme.text,
      "--lumora-muted": theme.muted,
      "--lumora-border": theme.border,
      "--lumora-header": theme.header,
      "--lumora-button-text": theme.buttonText,
      "--lumora-shadow": theme.shadow,
      "--lumora-glow": theme.glow
    };

    Object.entries(variables).forEach(([name, value]) => {
      root.style.setProperty(name, value);
    });

    try {
      localStorage.setItem(STORAGE_KEY, key);
    } catch (error) {
      console.warn("Could not save Lumora theme.", error);
    }

    document.querySelectorAll("[data-theme-choice]").forEach(button => {
      const active = button.dataset.themeChoice === key;
      button.setAttribute("aria-pressed", String(active));

      const check = button.querySelector(".theme-check");
      if (check) check.textContent = active ? "✓" : "";
    });
  }

  function createWidget() {
    if (document.getElementById("lumora-theme-widget")) return;

    const widget = document.createElement("div");
    widget.id = "lumora-theme-widget";

    widget.innerHTML = `
      <div id="lumora-theme-menu"
           role="dialog"
           aria-label="Choose website theme"
           hidden>
        <div class="theme-menu-title">Customize appearance</div>
        <div class="theme-menu-subtitle">
          Choose your Lumora theme.
        </div>

        <button class="lumora-theme-option"
                data-theme-choice="arctic"
                aria-pressed="false"
                type="button">
          <span class="theme-swatches" aria-hidden="true">
            <i style="background:#F4F7FB"></i>
            <i style="background:#087E8B"></i>
            <i style="background:#172B42"></i>
          </span>
          <span class="theme-option-copy">
            <strong>01. Arctic Light</strong>
            <small>White · Cool Gray · Deep Teal</small>
          </span>
          <span class="theme-check"></span>
        </button>

        <button class="lumora-theme-option"
                data-theme-choice="emerald"
                aria-pressed="false"
                type="button">
          <span class="theme-swatches" aria-hidden="true">
            <i style="background:#071A16"></i>
            <i style="background:#34D399"></i>
            <i style="background:#B7F36B"></i>
          </span>
          <span class="theme-option-copy">
            <strong>02. Emerald Grid</strong>
            <small>Forest Green · Emerald · Lime</small>
          </span>
          <span class="theme-check"></span>
        </button>

        <button class="lumora-theme-option"
                data-theme-choice="amethyst"
                aria-pressed="false"
                type="button">
          <span class="theme-swatches" aria-hidden="true">
            <i style="background:#09070E"></i>
            <i style="background:#B18CFF"></i>
            <i style="background:#E1A8FF"></i>
          </span>
          <span class="theme-option-copy">
            <strong>03. Black Amethyst</strong>
            <small>Black · Violet · Lavender</small>
          </span>
          <span class="theme-check"></span>
        </button>
      </div>

      <button id="lumora-theme-toggle"
              type="button"
              aria-expanded="false"
              aria-controls="lumora-theme-menu">
        <span aria-hidden="true">◐</span>
        Customize
      </button>
    `;

    document.body.appendChild(widget);

    const toggle = widget.querySelector("#lumora-theme-toggle");
    const menu = widget.querySelector("#lumora-theme-menu");

    toggle.addEventListener("click", () => {
      const opening = menu.hidden;
      menu.hidden = !opening;
      toggle.setAttribute("aria-expanded", String(opening));
    });

    widget.querySelectorAll("[data-theme-choice]").forEach(button => {
      button.addEventListener("click", () => {
        applyTheme(button.dataset.themeChoice);
        menu.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
      });
    });

    document.addEventListener("click", event => {
      if (!widget.contains(event.target)) {
        menu.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
      }
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        menu.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  function init() {
    let style = document.getElementById(STYLE_ID);

    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }

    style.textContent = css;

    let savedTheme = "amethyst";

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && themes[stored]) savedTheme = stored;
    } catch (error) {
      console.warn("Could not read Lumora theme.", error);
    }

    applyTheme(savedTheme);
    createWidget();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
