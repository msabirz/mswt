import { LOCALES, LANG_NAMES, t } from "./i18n.mjs";

const FONTS = {
  base: "family=Montserrat:wght@400;500;600;700",
  hi: "family=Poppins:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700",
  mr: "family=Poppins:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700",
  gu: "family=Noto+Sans+Gujarati:wght@400;500;600;700",
  display: "family=Bodoni+Moda:opsz,wght@6..96,500;6..96,600",
};

export function fontLink(families) {
  return `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${families.map((f) => FONTS[f]).join("&")}&display=swap">`;
}

export const tbd = (label, ref) => `<span class="tbd">[${label}${ref ? ` – ${ref}` : ""}]</span>`;

// depth = how many folders below design/mockups the page lives (0 for index/styleguide, 1 for en/…)
export function doc({ lang = "en", title, depth = 1, body, fonts, bodyClass = "" }) {
  const up = "../".repeat(depth);
  const fam = fonts ?? (lang === "en" ? ["base"] : ["base", lang]);
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${title}</title>
${fontLink(fam)}
<link rel="stylesheet" href="${up}assets/tokens.css">
<link rel="stylesheet" href="${up}assets/base.css">
<link rel="icon" href="${up}assets/mswt-mark-compact.svg" type="image/svg+xml">
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ""}>
${body}
<script>
document.querySelectorAll("[data-menu-toggle]").forEach((btn) => {
  const nav = document.getElementById(btn.getAttribute("aria-controls"));
  btn.addEventListener("click", () => {
    const open = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!open));
    nav.classList.toggle("is-open", !open);
  });
});
</script>
</body>
</html>
`;
}

export function mockBanner(lang, up) {
  const sample = lang === "en" ? "" : " Translations are samples and need human review.";
  return `<aside class="mock-banner" aria-label="Mockup notice">Design mockup — sample content, not real Trust data.${sample} <a href="${up}index.html">All mockups</a></aside>`;
}

// Pages that exist in every locale; other pages switch language to that locale's home.
const ALL_LOCALE_PAGES = new Set(["home", "donate"]);

export function header({ lang, current, page, depth = 1 }) {
  const s = t[lang];
  const up = "../".repeat(depth);
  const items = ["about", "causes", "gallery", "events", "news", "transparency", "contact"];
  const href = (k) => (["about", "causes", "contact"].includes(k) && lang === "en" ? `${k}.html` : "#");
  const langLinks = LOCALES.map(
    (l) => `<li><a href="${up}${l}/${ALL_LOCALE_PAGES.has(page) || l === lang ? page : "home"}.html" lang="${l}" hreflang="${l}"${l === lang ? ' aria-current="true"' : ""}>${LANG_NAMES[l]}</a></li>`
  ).join("");
  return `<a class="skip-link" href="#main">${s.skip}</a>
${mockBanner(lang, up)}
<header class="site-header">
  <div class="container site-header__inner">
    <a class="site-header__logo" href="home.html"><img src="${up}assets/mswt-logo-horizontal.svg" alt="${s.logoHome}" width="204" height="64"></a>
    <button class="btn btn--ghost menu-toggle" type="button" data-menu-toggle aria-expanded="false" aria-controls="site-nav">${s.menu}</button>
    <nav class="nav" id="site-nav" aria-label="${lang === "en" ? "Main" : s.menu}">
      <ul>${items.map((k) => `<li><a href="${href(k)}"${k === current ? ' aria-current="page"' : ""}>${s.nav[k]}</a></li>`).join("")}</ul>
    </nav>
    <div class="header-actions">
      <details class="lang-switch">
        <summary><span class="visually-hidden">${s.language}: </span>${LANG_NAMES[lang]}</summary>
        <ul>${langLinks}</ul>
      </details>
      <a class="btn btn--primary" href="donate.html">${s.donate}</a>
    </div>
  </div>
</header>`;
}

export function footer({ lang, depth = 1 }) {
  const s = t[lang];
  const f = s.footer;
  const up = "../".repeat(depth);
  return `<footer class="site-footer on-dark">
  <div class="container">
    <div class="footer-grid">
      <div class="stack">
        <a class="footer-logo" href="home.html"><img src="${up}assets/mswt-logo-horizontal-reversed.svg" alt="${s.logoHome}" width="240" height="75"></a>
        <p>${f.about}</p>
        <p class="small">${f.noFcra}</p>
      </div>
      <nav aria-label="${f.explore}"><h2>${f.explore}</h2><ul>
        <li><a href="#">${s.nav.causes}</a></li><li><a href="#">${s.nav.events}</a></li><li><a href="#">${s.nav.news}</a></li><li><a href="#">${s.nav.gallery}</a></li>
      </ul></nav>
      <nav aria-label="${f.trust}"><h2>${f.trust}</h2><ul>
        <li><a href="#">${s.nav.about}</a></li><li><a href="#">${s.nav.transparency}</a></li><li><a href="#">${f.disclaimer}</a></li>
      </ul></nav>
      <div><h2>${f.help}</h2><ul>
        <li><a href="#">${s.nav.contact}</a></li>
        <li><a href="mailto:info@mswelfaretrust.org">info@mswelfaretrust.org</a></li>
        <li>${tbd(lang === "en" ? "Phone" : "फ़ोन / Phone", "C3")}</li>
      </ul></div>
    </div>
    <div class="footer-legal">
      <p>${f.rights}. ${f.reg}.</p>
      <p><a href="#">${f.privacy}</a> · <a href="#">${f.terms}</a> · <a href="#">${f.refund}</a></p>
    </div>
  </div>
</footer>`;
}

export function page({ lang = "en", title, current, pageKey, main, depth = 1, fonts }) {
  return doc({
    lang,
    title,
    depth,
    fonts,
    body: `${header({ lang, current, page: pageKey, depth })}
<main id="main" tabindex="-1">
${main}
</main>
${footer({ lang, depth })}`,
  });
}
