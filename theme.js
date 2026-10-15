
(() => {
  "use strict";

  const STORAGE_KEY = "lumora-theme";

  const themes = {
    arctic: {
      bg: "#F4F7FB",
      bgSoft: "#EAF0F6",
      panel: "#FFFFFF",
      panelLight: "#F0F5F9",
      cyan: "#087E8B",
      cyanBright: "#0A9AA8",
      green: "#16A085",
      text: "#172B42",
      muted: "#63758B",
      border: "rgba(35,76,105,.16)",
      header: "rgba(244,247,251,.92)"
    },

    emerald: {
      bg: "#071A16",
      bgSoft: "#0B241D",
      panel: "#112D25",
      panelLight: "#183B30",
      cyan: "#34D399",
      cyanBright: "#42E6A7",
      green: "#B7F36B",
      text: "#F0FFF7",
      muted: "#9AC6B4",
      border: "rgba(112,226,174,.18)",
      header: "rgba(7,26,22,.92)"
    },

    amethyst: {
      bg: "#09070E",
      bgSoft: "#100C18",
      panel: "#191322",
      panelLight: "#241A31",
      cyan: "#B18CFF",
      cyanBright: "#C6A8FF",
      green: "#E1A8FF",
      text: "#F8F3FF",
      muted: "#B4A7C8",
      border: "rgba(190,157,255,.18)",
      header: "rgba(9,7,14,.92)"
    }
  };

  const root = document.documentElement;
  const styleId = "lumora-theme-fix";

  function applyTheme(key) {
    if (!themes[key]) key = "amethyst";

    const t = themes[key];

    root.dataset.lumoraTheme = key;

    const variables = {
      "--bg": t.bg,
      "--bg-soft": t.bgSoft,
      "--panel": t.panel,
      "--panel-light": t.panelLight,
      "--cyan": t.cyan,
      "--cyan-bright": t.cyanBright,
      "--green": t.green,
      "--text": t.text,
      "--muted": t.muted,
      "--border": t.border,

      "--lumora-bg": t.bg,
      "--lumora-bg-soft": t.bgSoft,
      "--lumora-panel": t.panel,
      "--lumora-panel-light": t.panelLight,
      "--lumora-accent": t.cyan,
      "--lumora-accent-bright": t.cyanBright,
      "--lumora-secondary": t.green,
      "--lumora-text": t.text,
      "--lumora-muted": t.muted,
      "--lumora-border": t.border,
      "--lumora-header": t.header
    };

    Object.entries(variables).forEach(([name, value]) => {
      root.style.setProperty(name, value);
    });

    try {
      localStorage.setItem(STORAGE_KEY, key);
    } catch (_) {}

    document.querySelectorAll("[data-theme-choice]").forEach(button => {
      const active = button.dataset.themeChoice === key;
      button.setAttribute("aria-pressed", String(active));

      const mark = button.querySelector(".theme-check");
      if (mark) mark.textContent = active ? "✓" : "";
    });
  }

  function addStyles() {
    let style = document.getElementById(styleId);

    if (!style) {
      style = document.createElement("style");
      style.id = styleId;
      document.head.appendChild(style);
    }

    style.textContent = `
      /* Keep the existing page layout and backgrounds intact. */

      html[data-lumora-theme="arctic"] {
        color-scheme: light;
      }

      html[data-lumora-theme="emerald"],
      html[data-lumora-theme="amethyst"] {
        color-scheme: dark;
      }

      /* CTA remains dark, so its heading must remain light. */
      .cta-panel h2 {
        color: #F2F8FF !important;
        -webkit-text-fill-color: #F2F8FF !important;
        opacity: 1 !important;
      }

      .cta-panel h2 .gradient-text {
        background: linear-gradient(
          100deg,
          var(--cyan-bright),
          var(--green)
        ) !important;
        -webkit-background-clip: text !important;
        background-clip: text !important;
        -webkit-text-fill-color: transparent !important;
      }

      .cta-panel .section-kicker {
        color: var(--cyan) !important;
      }

      /* Arctic: make text readable on the light page background. */
      html[data-lumora-theme="arctic"] body {
        color: #172B42;
      }

      html[data-lumora-theme="arctic"] .hero-description,
      html[data-lumora-theme="arctic"] .section-heading p,
      html[data-lumora-theme="arctic"] .feature-card p,
      html[data-lumora-theme="arctic"] .step-card p,
      html[data-lumora-theme="arctic"] .about-copy p,
      html[data-lumora-theme="arctic"] .about-point,
      html[data-lumora-theme="arctic"] .trust-strip,
      html[data-lumora-theme="arctic"] .footer-links,
      html[data-lumora-theme="arctic"] .footer-bottom,
      html[data-lumora-theme="arctic"] .footer-brand p {
        color: #63758B !important;
      }

      html[data-lumora-theme="arctic"] .site-header .nav-links a,
      html[data-lumora-theme="arctic"] .site-header .login-link {
        color: #40566F !important;
      }

      /* Customize menu */
      #lumora-theme-widget {
        position: fixed;
        right: 22px;
        bottom: 22px;
        z-index: 99999;
        font-family: "DM Sans", sans-serif;
      }

      #lumora-theme-toggle {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 9px;
        min-height: 46px;
        padding: 0 17px;
        border: 1px solid var(--border);
        border-radius: 999px;
        background: var(--panel);
        color: var(--text);
        box-shadow: 0 10px 30px rgba(0,0,0,.12);
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
      }

      #lumora-theme-menu {
        position: absolute;
        right: 0;
        bottom: 58px;
        width: min(320px, calc(100vw - 28px));
        padding: 15px;
        border: 1px solid var(--border);
        border-radius: 18px;
        background: var(--panel);
        color: var(--text);
        box-shadow: 0 18px 45px rgba(0,0,0,.16);
      }

      #lumora-theme-menu[hidden] {
        display: none !important;
      }

      .theme-menu-title {
        margin: 2px 4px 4px;
        color: var(--text);
        font-size: 15px;
        font-weight: 800;
      }

      .theme-menu-subtitle {
        margin: 0 4px 13px;
        color: var(--muted);
        font-size: 11px;
      }

      .lumora-theme-option {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 11px;
        padding: 11px;
        margin-top: 7px;
        border: 1px solid var(--border);
        border-radius: 12px;
        text-align: left;
        background: transparent;
        color: var(--text);
        cursor: pointer;
      }

      .lumora-theme-option:hover,
      .lumora-theme-option[aria-pressed="true"] {
        border-color: var(--cyan);
        background: var(--panel-light);
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
        color: var(--text);
        font-size: 12px;
      }

      .theme-option-copy small {
        color: var(--muted);
        font-size: 10px;
      }

      .theme-check {
        color: var(--cyan);
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
          <span class="theme-swatches">
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
          <span class="theme-swatches">
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
          <span class="theme-swatches">
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
      const open = menu.hidden;
      menu.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
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
    addStyles();

    let saved = "amethyst";

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && themes[stored]) saved = stored;
    } catch (_) {}

    applyTheme(saved);
    createWidget();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
