import { readFileSync } from "node:fs";
import { doc } from "./layout.mjs";

const contrastRows = (brandMd) =>
  brandMd
    .split("\n")
    .filter((l) => /^\| (Text|Brand text|Links|Buttons|UI|Bands|Footer|Status|Logo) \|/.test(l))
    .map((l) => l.split("|").slice(1, -1).map((c) => c.trim()));

export function styleguide(root) {
  const tokens = JSON.parse(readFileSync(`${root}/tokens/design-tokens.json`, "utf8"));
  const brandMd = readFileSync(`${root}/docs/brand.md`, "utf8");
  const steps = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];
  const scale = (name) => `<h3>${name}</h3><div class="swatch-grid">${steps
    .map((s) => `<div class="swatch"><div style="background: var(--color-${name}-${s})"></div><p><strong>${name}.${s}</strong><br>${tokens.color[name][s].$value}</p></div>`)
    .join("")}</div>`;
  const rows = contrastRows(brandMd);
  const marathi = "मराठी: ळ, ऱ्य, क्ष, ज्ञ, श्र, द्ध, ह्म — शाळेतील मुलांना मदत करण्यासाठी देणगी द्या.";
  const hindi = "हिन्दी: ज़रूरतमंद परिवारों की मदद करें — क्ष, त्र, ज्ञ, श्र, द्ध।";
  const gujarati = "ગુજરાતી: જરૂરિયાતમંદ પરિવારોને મદદ કરો — ક્ષ, જ્ઞ, શ્ર, દ્ધ.";
  return doc({
    lang: "en", title: "Style guide – MSWT mockups", depth: 0,
    fonts: ["base", "hi", "gu"],
    body: `<a class="skip-link" href="#main">Skip to main content</a>
<aside class="mock-banner" aria-label="Mockup notice">Design mockup — style guide generated from tokens/design-tokens.json. <a href="index.html">All mockups</a></aside>
<main id="main" class="container section stack" tabindex="-1">
  <img src="assets/mswt-logo-horizontal.svg" alt="MS Welfare Trust" width="240" height="75">
  <h1 class="heading-rule">Style guide</h1>
  <p class="lead muted">Every colour, type style and component used in the mockups, straight from the design tokens.</p>

  <section class="stack" aria-labelledby="dec-h">
    <h2 id="dec-h">Typeface</h2>
    <div class="alert alert--success"><span class="alert__icon" aria-hidden="true">✓</span><div><strong>Decided: Poppins everywhere</strong><p>Poppins is the site font for English, Hindi and Marathi, for headings and body text. Gujarati uses Noto Sans Gujarati because Poppins has no Gujarati letters. Admins can change the site font in Settings → Appearance.</p></div></div>
    <div class="grid grid--3">
      <div class="panel stack"><span class="state-label">English · Poppins</span>
        <p style="font-size: var(--text-3xl); font-weight: var(--font-weight-semibold); line-height: var(--leading-tight); margin:0; color: var(--color-fg-strong)">Help families in need</p>
        <p style="margin:0">Every donation is receipted the moment it is received. ₹1,00,000 · MSWT/2026-27/000123</p></div>
      <div class="panel stack" lang="mr"><span class="state-label" lang="en">Marathi · Poppins</span>
        <p style="font-size: var(--text-3xl); font-weight: var(--font-weight-semibold); line-height: var(--leading-tight); margin:0; color: var(--color-fg-strong)">गरजू कुटुंबांना मदत करा</p>
        <p style="margin:0">${marathi}</p><p style="margin:0" lang="hi">${hindi}</p></div>
      <div class="panel stack" lang="gu"><span class="state-label" lang="en">Gujarati · Noto Sans Gujarati</span>
        <p style="font-size: var(--text-3xl); font-weight: var(--font-weight-semibold); line-height: var(--leading-tight); margin:0; color: var(--color-fg-strong)">જરૂરિયાતમંદ પરિવારોને મદદ કરો</p>
        <p style="margin:0">${gujarati}</p></div>
    </div>
  </section>

  <section class="stack" aria-labelledby="col-h">
    <h2 id="col-h">Colour</h2>
    <div class="swatch-grid">
      ${["green", "ink", "slate"].map((k) => `<div class="swatch"><div style="background: var(--color-brand-${k})"></div><p><strong>brand.${k}</strong><br>${tokens.color.brand[k].$value}</p></div>`).join("")}
    </div>
    ${scale("primary")}${scale("neutral")}${scale("success")}${scale("warning")}${scale("error")}${scale("info")}
  </section>

  <section class="stack" aria-labelledby="con-h">
    <h2 id="con-h">Contrast (from docs/brand.md §2.5)</h2>
    <div class="table-wrap" tabindex="0" role="region" aria-label="Table, scrolls sideways on small screens"><table>
      <thead><tr><th scope="col">Group</th><th scope="col">Use</th><th scope="col">Foreground</th><th scope="col">Background</th><th scope="col" class="num">Ratio</th><th scope="col">Result</th></tr></thead>
      <tbody>${rows.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2].replace(/`/g, "")}</td><td>${r[3].replace(/`/g, "")}</td><td class="num">${r[4]}</td><td>${/PASS/.test(r[6]) ? '<span class="badge badge--success">PASS</span>' : /FAIL/.test(r[6]) ? '<span class="badge badge--error">FAIL · not allowed</span>' : '<span class="badge badge--neutral">exempt</span>'}</td></tr>`).join("")}</tbody>
    </table></div>
  </section>

  <section class="stack" aria-labelledby="type-h">
    <h2 id="type-h">Typography</h2>
    ${["5xl", "4xl", "3xl", "2xl", "xl", "lg", "base", "sm", "xs"].map((s) => `<p style="font-size: var(--text-${s}); margin:0; line-height: var(--leading-snug)"><span class="small muted">text-${s}</span> Every donation is receipted</p>`).join("")}
    <span class="eyebrow">Eyebrow — tracked caps</span>
    <div class="grid grid--3">
      <div class="panel" lang="hi"><h3>हिन्दी</h3><p>हर दान मिलते ही उसकी रसीद जारी होती है। आपका PAN केवल आपकी 80G रसीद के लिए उपयोग होता है।</p></div>
      <div class="panel" lang="mr"><h3>मराठी</h3><p>प्रत्येक देणगी मिळताच तिची पावती दिली जाते. तुमचा PAN फक्त तुमच्या 80G पावतीसाठी वापरला जातो.</p></div>
      <div class="panel" lang="gu"><h3>ગુજરાતી</h3><p>દરેક દાન મળતાં જ તેની રસીદ આપવામાં આવે છે. તમારો PAN ફક્ત તમારી 80G રસીદ માટે વપરાય છે.</p></div>
    </div>
  </section>

  <section class="stack" aria-labelledby="comp-h">
    <h2 id="comp-h">Components</h2>
    <h3>Buttons</h3>
    <div class="actions"><a class="btn btn--primary" href="#">Primary</a><a class="btn btn--secondary" href="#">Secondary</a><a class="btn btn--ghost" href="#">Ghost</a><button class="btn btn--primary" disabled>Disabled</button><a class="btn btn--primary btn--lg" href="#">Large primary</a></div>
    <div class="band on-dark panel actions" style="margin:0"><a class="btn btn--on-brand" href="#">On brand band</a><a href="#">Link on brand band</a></div>
    <p class="small muted">Tab through this page to see focus rings: 3px <code>focus.ring</code>, 2px offset; white on dark surfaces.</p>
    <h3>Form fields</h3>
    <div class="grid grid--2">
      <div class="field"><label for="sg-1">Default field</label><p class="hint" id="sg-1-hint">Hint text uses fg.hint.</p><input class="input" id="sg-1" aria-describedby="sg-1-hint" placeholder="Placeholder"></div>
      <div class="field"><label for="sg-2">Field with error</label><p class="error-text" id="sg-2-error">Enter a PAN in the format ABCDE1234F</p><input class="input" id="sg-2" aria-invalid="true" aria-describedby="sg-2-error" value="ABCD1234"></div>
      <div class="field"><label for="sg-3">Disabled field</label><input class="input" id="sg-3" disabled value="Not editable"></div>
      <div class="field"><label for="sg-4">Select</label><select class="select" id="sg-4"><option>General fund</option></select></div>
    </div>
    <div class="choice"><input type="checkbox" id="sg-5" checked><label for="sg-5">Checkbox, checked</label></div>
    <h3>Alerts and badges</h3>
    ${["success", "warning", "error", "info"].map((k) => `<div class="alert alert--${k}"><span class="alert__icon" aria-hidden="true">${{ success: "✓", warning: "!", error: "!", info: "i" }[k]}</span><p><strong>${k[0].toUpperCase() + k.slice(1)}</strong> Message text uses status.${k}.fg on status.${k}.bg.</p></div>`).join("")}
    <div class="actions"><span class="badge badge--success">Paid</span><span class="badge badge--warning">Pending</span><span class="badge badge--error">Failed</span><span class="badge badge--info">Info</span><span class="badge badge--neutral">Neutral</span></div>
    <h3>Rules (logo motif)</h3>
    <h4 class="heading-rule">Section heading with rule</h4>
    <hr class="rule">
  </section>

  <section class="stack" aria-labelledby="logo-h">
    <h2 id="logo-h">Logo</h2>
    <div class="grid grid--3">
      <div class="panel"><img src="assets/mswt-logo-horizontal.svg" alt="Horizontal logo on white" width="240" height="75"></div>
      <div class="panel band on-dark" style="background: var(--color-bg-inverse)"><img src="assets/mswt-logo-horizontal-reversed.svg" alt="Reversed logo on footer background" width="240" height="75"></div>
      <div class="panel" style="display:flex; gap: var(--spacing-6); align-items:center"><img src="assets/mswt-mark.svg" alt="Mark with rules" width="72" height="76"><img src="assets/mswt-mark-compact.svg" alt="Compact mark for icons" width="32" height="32"><img src="assets/mswt-mark-compact.svg" alt="Compact mark at 16px" width="16" height="16"></div>
    </div>
  </section>
</main>`,
  });
}

export function index(groups) {
  return doc({
    lang: "en", title: "MSWT design mockups", depth: 0,
    body: `<a class="skip-link" href="#main">Skip to main content</a>
<main id="main" class="container section stack" tabindex="-1">
  <img src="assets/mswt-logo-horizontal.svg" alt="MS Welfare Trust" width="240" height="75">
  <h1 class="heading-rule">Design mockups — Step 1</h1>
  <p class="lead muted">Static HTML pages built only from the brand tokens. Review each one at phone width (360px) and desktop width (1440px). Sample content is not real Trust data; <span class="tbd">[highlighted]</span> items are details we still need from the Trust.</p>
  <div class="alert alert--success"><span class="alert__icon" aria-hidden="true">✓</span><div><strong>Typeface decided</strong><p>Poppins for English, Hindi and Marathi; Noto Sans Gujarati for Gujarati. Admins can change the site font later in Settings → Appearance. See the <a href="styleguide.html">style guide</a>.</p></div></div>
  ${groups.map((g) => `<section class="stack" aria-labelledby="${g.id}"><h2 id="${g.id}" style="font-size: var(--text-xl)">${g.title}</h2><ul>${g.links.map(([href, label]) => `<li><a href="${href}">${label}</a></li>`).join("")}</ul></section>`).join("")}
</main>`,
  });
}
