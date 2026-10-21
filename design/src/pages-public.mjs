import { t, causes, rupees } from "./i18n.mjs";
import { d } from "./donate-i18n.mjs";
import { page, tbd } from "./layout.mjs";

const ph = (cls, alt) => `<div class="ph ${cls}" role="img" aria-label="${alt}"><span>${alt}</span></div>`;

function causeCard(c, lang, { headingLevel = 3 } = {}) {
  const s = t[lang].home;
  const pct = Math.round((c.raised / c.goal) * 100);
  const href = lang === "en" ? `cause-detail.html` : "#";
  return `<article class="card">
  ${ph("ph--photo", lang === "en" ? `Photo for “${c.title}” (Trust photo needed)` : c.title)}
  <div class="card__body">
    <h${headingLevel}><a href="${href}">${c.title}</a></h${headingLevel}>
    <p class="muted">${c.summary}</p>
    <div class="progress">
      <div class="progress__bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="${c.title}: ${pct}%"><span style="width:${pct}%"></span></div>
      <div class="progress__meta"><span><strong>${rupees(c.raised, lang)}</strong> ${s.raised}</span><span>${s.goal} ${rupees(c.goal, lang)}</span></div>
    </div>
    <div class="card__footer"><a class="btn btn--secondary btn--block" href="donate.html">${t[lang].donate}<span class="visually-hidden">: ${c.title}</span></a></div>
  </div>
</article>`;
}

export function home(lang) {
  const s = t[lang].home;
  const en = lang === "en";
  const news = [
    { date: "2026-10-02", title: en ? "Sample news headline about a recent programme" : `${t[lang].nav.news} — 1` },
    { date: "2026-09-18", title: en ? "Sample update on the school support drive" : `${t[lang].nav.news} — 2` },
    { date: "2026-08-30", title: en ? "Sample annual report published" : `${t[lang].nav.news} — 3` },
  ];
  const dateFmt = new Intl.DateTimeFormat(`${lang}-IN`, { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata", numberingSystem: "latn" });
  return page({
    lang, pageKey: "home", current: null,
    title: en ? "MS Welfare Trust – Donate to education, healthcare and relief" : `${t[lang].footer.rights.replace("© 2026 ", "")}`,
    main: `
<section class="hero">
  <div class="container hero__grid">
    <div>
      <span class="eyebrow">${s.eyebrow}</span>
      <h1>${s.h1}</h1>
      <p class="lead">${s.lead}</p>
      <div class="actions">
        <a class="btn btn--primary btn--lg" href="donate.html">${s.ctaDonate}</a>
        <a class="btn btn--secondary btn--lg" href="${en ? "causes.html" : "#"}">${s.ctaCauses}</a>
      </div>
    </div>
    ${ph("ph--photo", s.heroAlt)}
  </div>
</section>

<section class="section section--subtle" aria-labelledby="why-h">
  <div class="container">
    <h2 id="why-h" class="visually-hidden">${en ? "Why give through the Trust" : s.eyebrow}</h2>
    <div class="grid grid--3">
      <div class="stat"><h3>${s.trust1t}</h3><p class="muted">${s.trust1}</p></div>
      <div class="stat"><h3>${s.trust2t}</h3><p class="muted">${s.trust2}</p></div>
      <div class="stat"><h3>${s.trust3t}</h3><p class="muted">${s.trust3}</p></div>
    </div>
  </div>
</section>

<section class="section" aria-labelledby="causes-h">
  <div class="container">
    <h2 id="causes-h" class="heading-rule">${s.causesH}</h2>
    <p class="muted">${s.causesLead}</p>
    <div class="grid grid--3" style="margin-top: var(--spacing-8)">
      ${causes[lang].map((c) => causeCard(c, lang)).join("\n")}
    </div>
    <p style="margin-top: var(--spacing-6)"><a href="${en ? "causes.html" : "#"}">${s.allCauses}</a></p>
  </div>
</section>

<section class="section band on-dark" aria-labelledby="band-h">
  <div class="container hero__grid">
    <div>
      <h2 id="band-h">${s.bandH}</h2>
      <p>${s.bandP}</p>
    </div>
    <div class="actions"><a class="btn btn--on-brand btn--lg" href="donate.html">${s.ctaDonate}</a></div>
  </div>
</section>

<section class="section" aria-labelledby="news-h">
  <div class="container">
    <h2 id="news-h" class="heading-rule">${s.newsH}</h2>
    <div class="grid grid--3" style="margin-top: var(--spacing-8)">
      ${news.map((n) => `<article class="card">
        ${ph("ph--wide", en ? `Photo for “${n.title}”` : n.title)}
        <div class="card__body">
          <p class="small muted"><time datetime="${n.date}">${dateFmt.format(new Date(n.date + "T12:00:00+05:30"))}</time></p>
          <h3><a href="#">${n.title}</a></h3>
        </div>
      </article>`).join("\n")}
    </div>
    <p style="margin-top: var(--spacing-6)"><a href="#">${s.allNews}</a></p>
  </div>
</section>`,
  });
}

export function donate(lang, { errors = false } = {}) {
  const s = d[lang];
  const en = lang === "en";
  const presets = [100000, 250000, 500000, 1000000];
  const selected = errors ? null : 500000;
  const req = `<span class="req">(${s.required})</span>`;
  const opt = `<span class="req">(${s.optional})</span>`;
  const err = (id, msg) => (errors ? `<p class="error-text" id="${id}-error">${msg}</p>` : "");
  const inv = (id) => (errors ? ` aria-invalid="true" aria-describedby="${id}-error ${id}-hint"` : ` aria-describedby="${id}-hint"`);
  const fee = tbd(en ? "₹ fee" : "₹", "B3");
  const amt = rupees(selected ?? 500000, lang);
  const summary = errors
    ? ""
    : `<div class="alert alert--info" style="margin-bottom: var(--spacing-8)"><span class="alert__icon" aria-hidden="true">i</span><p>${s.lead}</p></div>`;
  const errorSummary = errors
    ? `<div class="alert alert--error" role="alert" tabindex="-1" id="error-summary" style="margin-bottom: var(--spacing-8)">
  <span class="alert__icon" aria-hidden="true">!</span>
  <div><strong>${s.errSummary}</strong>
    <ul style="margin: var(--spacing-2) 0 0; padding-left: var(--spacing-5)">
      <li><a href="#other-amount">${s.errAmount}</a></li>
      <li><a href="#email">${s.errEmail}</a></li>
      <li><a href="#pan">${s.errPan}</a></li>
      <li><a href="#citizen">${s.errCitizen}</a></li>
    </ul></div>
</div>`
    : "";
  return page({
    lang, pageKey: errors ? "donate-errors" : "donate", current: null,
    title: `${errors ? (en ? "Error: " : "⚠ ") : ""}${s.title} – MS Welfare Trust`,
    main: `
<div class="container section">
  <nav class="breadcrumbs" aria-label="${en ? "Breadcrumb" : s.crumbHome}"><ol><li><a href="home.html">${s.crumbHome}</a></li><li><span aria-current="page">${s.title}</span></li></ol></nav>
  <div class="layout-aside">
    <div>
      <h1 class="heading-rule">${s.title}</h1>
      ${errorSummary}${summary}
      <form class="form" action="#" method="post" novalidate>
        <fieldset class="panel stack">
          <legend><h2 style="font-size: var(--text-xl); margin: 0">${s.step1}</h2></legend>
          <div class="field">
            <label for="cause">${s.cause} ${req}</label>
            <select class="select" id="cause" name="cause">
              <option>${s.general}</option>
              ${causes[lang].map((c) => `<option>${c.title}</option>`).join("")}
            </select>
          </div>
          <fieldset class="field">
            <legend>${s.amount} ${req}</legend>
            <div class="amounts">
              ${presets.map((p, i) => `<div class="amount"><input type="radio" name="amount" id="amt-${i}" value="${p}"${p === selected ? " checked" : ""}><label for="amt-${i}">${rupees(p, lang)}</label></div>`).join("")}
            </div>
          </fieldset>
          <div class="field">
            <label for="other-amount">${s.other}</label>
            <p class="hint" id="other-amount-hint">${s.otherHint}</p>
            ${err("other-amount", s.errAmount)}
            <div class="input-prefix"><span aria-hidden="true">₹</span><input class="input" id="other-amount" name="other" inputmode="numeric" autocomplete="off"${errors ? ' value="50"' : ""}${inv("other-amount")}></div>
          </div>
        </fieldset>

        <fieldset class="panel stack">
          <legend><h2 style="font-size: var(--text-xl); margin: 0">${s.step2}</h2></legend>
          <div class="field"><label for="name">${s.name} ${req}</label><input class="input" id="name" name="name" autocomplete="name"${errors ? ' value="Rahul Mehta"' : ""}></div>
          <div class="grid grid--2">
            <div class="field">
              <label for="email">${s.email} ${req}</label>
              <p class="hint" id="email-hint">${s.emailHint}</p>
              ${err("email", s.errEmail)}
              <input class="input" id="email" name="email" type="email" autocomplete="email"${errors ? ' value="rahul@"' : ""}${inv("email")}>
            </div>
            <div class="field"><label for="phone">${s.phone} ${req}</label><input class="input" id="phone" name="phone" type="tel" autocomplete="tel" inputmode="tel"></div>
          </div>
          <div class="choice"><input type="checkbox" id="want80g" name="want80g" checked aria-describedby="want80g-hint"><div><label for="want80g"><strong>${s.want80g}</strong></label><p class="hint" id="want80g-hint">${s.want80gHint}</p></div></div>
          <div class="field">
            <label for="pan">${s.pan} ${req}</label>
            <p class="hint" id="pan-hint">${s.panHint}</p>
            ${err("pan", s.errPan)}
            <input class="input" id="pan" name="pan" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="10" style="max-width: 16rem"${errors ? ' value="ABCD1234"' : ""}${inv("pan")}>
          </div>
          <div class="field"><label for="address">${s.address} ${req}</label><input class="input" id="address" name="address" autocomplete="street-address"></div>
          <div class="grid grid--3">
            <div class="field"><label for="city">${s.city} ${req}</label><input class="input" id="city" name="city" autocomplete="address-level2"></div>
            <div class="field"><label for="state">${s.state} ${req}</label><select class="select" id="state" name="state" autocomplete="address-level1"><option value="">${s.select}</option><option>Maharashtra</option><option>Gujarat</option></select></div>
            <div class="field"><label for="pin">${s.pin} ${req}</label><input class="input" id="pin" name="pin" inputmode="numeric" autocomplete="postal-code" maxlength="6"></div>
          </div>
        </fieldset>

        <fieldset class="panel stack">
          <legend><h2 style="font-size: var(--text-xl); margin: 0">${s.step3}</h2></legend>
          <div class="field">
            ${err("citizen", s.errCitizen)}
            <div class="choice"><input type="checkbox" id="citizen" name="citizen" required${errors ? ' aria-invalid="true" aria-describedby="citizen-error citizen-hint"' : ' aria-describedby="citizen-hint"'}><div><label for="citizen"><strong>${s.citizen}</strong> ${req}</label><p class="hint" id="citizen-hint">${s.citizenHint}</p></div></div>
          </div>
          <div class="choice"><input type="checkbox" id="fee" name="fee" aria-describedby="fee-hint"><div><label for="fee">${s.fee(fee)} ${opt}</label><p class="hint" id="fee-hint">${s.feeHint}</p></div></div>
          <div class="choice"><input type="checkbox" id="anon" name="anon" aria-describedby="anon-hint"><div><label for="anon">${s.anon} ${opt}</label><p class="hint" id="anon-hint">${s.anonHint}</p></div></div>
          <div class="ph" style="min-height: var(--spacing-16); align-items: center"><span>${s.captcha}</span></div>
          <button class="btn btn--primary btn--lg btn--block" type="submit">${s.pay(amt)}</button>
          <p class="hint">${s.secure}</p>
        </fieldset>
      </form>
    </div>
    <aside class="panel panel--brand stack" aria-labelledby="sum-h" style="position: sticky; top: var(--spacing-6)">
      <h2 id="sum-h" style="font-size: var(--text-xl)">${s.summary}</h2>
      <table><tbody>
        <tr><th scope="row">${s.donation}</th><td class="num">${errors ? "—" : amt}</td></tr>
        <tr><th scope="row">${s.gatewayFee}</th><td class="num">${rupees(0, lang)}</td></tr>
        <tr><th scope="row">${s.total}</th><td class="num"><strong>${errors ? "—" : amt}</strong></td></tr>
      </tbody></table>
      <p class="small muted">${t[lang].home.trust1}</p>
    </aside>
  </div>
</div>`,
  });
}

export function thankYou() {
  return page({
    lang: "en", pageKey: "thank-you", current: null,
    title: "Thank you for your donation – MS Welfare Trust",
    main: `
<div class="container section stack">
  <h1 class="heading-rule">Thank you, Rahul</h1>
  <p class="muted">This page shows three states. Only one appears to a donor; it updates on its own while we wait for the payment confirmation from Cashfree.</p>

  <section class="panel stack" aria-labelledby="s1">
    <span class="state-label" id="s1">State 1 — waiting for confirmation</span>
    <div class="alert alert--info" role="status" aria-live="polite"><span class="alert__icon" aria-hidden="true">…</span><div><strong>Confirming your payment</strong><p>This usually takes a few seconds. Please don't close this page or pay again.</p></div></div>
  </section>

  <section class="panel stack" aria-labelledby="s2">
    <span class="state-label" id="s2">State 2 — payment confirmed</span>
    <div class="alert alert--success" role="status"><span class="alert__icon" aria-hidden="true">✓</span><div><strong>We received your donation of ₹5,000</strong><p>Receipt number <strong>MSWT/2026-27/000123</strong>. We've also emailed it to r•••@example.com.</p></div></div>
    <div class="actions"><a class="btn btn--primary" href="#">Download 80G receipt (PDF, 80 KB)</a><a class="btn btn--secondary" href="home.html">Back to home</a></div>
    <p class="small muted">Your 80G receipt includes your PAN and the Trust's 80G registration number. Keep it for your income-tax return.</p>
  </section>

  <section class="panel stack" aria-labelledby="s3">
    <span class="state-label" id="s3">State 3 — payment failed or cancelled</span>
    <div class="alert alert--error" role="alert"><span class="alert__icon" aria-hidden="true">!</span><div><strong>Your payment didn't go through</strong><p>No money was taken. If an amount was debited, it will be refunded automatically by your bank within 5–7 working days.</p></div></div>
    <div class="actions"><a class="btn btn--primary" href="donate.html">Try again</a><a class="btn btn--secondary" href="contact.html">Contact us</a></div>
  </section>
</div>`,
  });
}

export function about() {
  const trustees = [1, 2, 3, 4];
  return page({
    lang: "en", pageKey: "about", current: "about",
    title: "About Munira Shoaib Welfare Trust – trustees and registration",
    main: `
<div class="container section">
  <nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="home.html">Home</a></li><li><span aria-current="page">About</span></li></ol></nav>
  <div class="hero__grid">
    <div>
      <span class="eyebrow">About the Trust</span>
      <h1>Munira Shoaib Welfare Trust</h1>
      <p class="lead muted">${tbd("Mission statement in 1–2 sentences", "C7")}</p>
      <p>${tbd("Short history: founded on [date], why, and who the Trust serves", "C1, C7")}</p>
    </div>
    ${ph("ph--photo", "Photo: the Trust's work (Trust photo needed)")}
  </div>
</div>
<section class="section section--subtle" aria-labelledby="trustees-h">
  <div class="container">
    <h2 id="trustees-h" class="heading-rule">Trustees</h2>
    <div class="grid grid--4" style="margin-top: var(--spacing-8)">
      ${trustees.map((i) => `<div class="stack" style="text-align:center">
        <div style="max-width: 10rem; margin-inline: auto">${ph("ph--round", `Trustee ${i} photo`)}</div>
        <h3 style="margin-bottom: 0">${tbd(`Trustee ${i} name`, "C4")}</h3>
        <p class="muted small">${tbd("Role, e.g. Managing Trustee")}</p>
      </div>`).join("")}
    </div>
  </div>
</section>
<section class="section" aria-labelledby="reg-h">
  <div class="container">
    <h2 id="reg-h" class="heading-rule">Registration and tax status</h2>
    <div class="table-wrap" tabindex="0" role="region" aria-label="Registration details" style="margin-top: var(--spacing-6); max-width: 48rem">
      <table>
        <tbody>
          <tr><th scope="row">Legal name</th><td>Munira Shoaib Welfare Trust</td></tr>
          <tr><th scope="row">Trust registration</th><td>${tbd("Number and authority", "B1")}</td></tr>
          <tr><th scope="row">PAN</th><td>${tbd("Trust PAN", "B1")}</td></tr>
          <tr><th scope="row">12A registration</th><td>${tbd("Number and date", "B1")}</td></tr>
          <tr><th scope="row">80G registration</th><td>${tbd("Number, valid from – to", "B1")}</td></tr>
          <tr><th scope="row">FCRA</th><td>Not registered. We accept donations from Indian citizens only.</td></tr>
        </tbody>
      </table>
    </div>
    <p style="margin-top: var(--spacing-6)"><a href="#">Read our annual reports and audited accounts</a></p>
  </div>
</section>`,
  });
}

export function causesList() {
  return page({
    lang: "en", pageKey: "causes", current: "causes",
    title: "Causes you can support – MS Welfare Trust",
    main: `
<div class="container section">
  <nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="home.html">Home</a></li><li><span aria-current="page">Causes</span></li></ol></nav>
  <h1 class="heading-rule">Causes you can support</h1>
  <p class="lead muted">Give to a specific cause, or to the general fund. Every donation gets a receipt, and progress is updated as donations are confirmed.</p>
  <div class="grid grid--3" style="margin-top: var(--spacing-10)">
    ${causes.en.map((c) => causeCard(c, "en", { headingLevel: 2 })).join("\n")}
  </div>
</div>`,
  });
}

export function causeDetail() {
  const c = causes.en[0];
  const pct = Math.round((c.raised / c.goal) * 100);
  return page({
    lang: "en", pageKey: "cause-detail", current: "causes",
    title: `${c.title} – donate to education | MS Welfare Trust`,
    main: `
<div class="container section">
  <nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="home.html">Home</a></li><li><a href="causes.html">Causes</a></li><li><span aria-current="page">${c.title}</span></li></ol></nav>
  <div class="layout-aside">
    <article class="stack">
      <span class="eyebrow">Education</span>
      <h1>${c.title}</h1>
      <p class="lead muted">${c.summary}</p>
      ${ph("ph--wide", "Photo: children receiving school kits (Trust photo needed)")}
      <h2>Why this matters</h2>
      <p>Sample body copy. The Content Editor writes this in the CMS for each language: what the problem is, what the Trust does about it, and what a donation pays for.</p>
      <h2>What your donation pays for</h2>
      <ul><li>₹1,000 — sample: books for one child for a year</li><li>₹2,500 — sample: uniform and bag</li><li>₹5,000 — sample: one term's fees</li></ul>
      <p class="small muted">Amounts are illustrative examples set by the Trust in the CMS.</p>
    </article>
    <aside class="panel stack" aria-labelledby="give-h" style="position: sticky; top: var(--spacing-6)">
      <h2 id="give-h" style="font-size: var(--text-xl)">Support this cause</h2>
      <div class="progress">
        <div class="progress__bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="${pct}% of goal raised"><span style="width:${pct}%"></span></div>
        <div class="progress__meta"><span><strong>${rupees(c.raised)}</strong> raised</span><span>goal ${rupees(c.goal)}</span></div>
      </div>
      <a class="btn btn--primary btn--lg btn--block" href="donate.html">Donate to this cause</a>
      <p class="small muted">80G tax receipt available. Indian citizens only.</p>
    </aside>
  </div>
</div>`,
  });
}

export function contact() {
  return page({
    lang: "en", pageKey: "contact", current: "contact",
    title: "Contact MS Welfare Trust – address, phone and email",
    main: `
<div class="container section">
  <nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="home.html">Home</a></li><li><span aria-current="page">Contact</span></li></ol></nav>
  <h1 class="heading-rule">Contact us</h1>
  <div class="hero__grid" style="align-items: start; margin-top: var(--spacing-6)">
    <form class="form panel" action="#" method="post" novalidate>
      <div class="field"><label for="c-name">Your name <span class="req">(required)</span></label><input class="input" id="c-name" autocomplete="name"></div>
      <div class="grid grid--2">
        <div class="field"><label for="c-email">Email <span class="req">(required)</span></label><input class="input" id="c-email" type="email" autocomplete="email"></div>
        <div class="field"><label for="c-phone">Phone <span class="req">(optional)</span></label><input class="input" id="c-phone" type="tel" autocomplete="tel"></div>
      </div>
      <div class="field"><label for="c-subject">Subject <span class="req">(required)</span></label><select class="select" id="c-subject"><option value="">Select</option><option>Donation or receipt</option><option>Volunteering</option><option>Request for help</option><option>Other</option></select></div>
      <div class="field"><label for="c-msg">Message <span class="req">(required)</span></label><textarea class="textarea" id="c-msg"></textarea></div>
      <div class="ph" style="min-height: var(--spacing-16); align-items: center"><span>Security check (Cloudflare Turnstile)</span></div>
      <button class="btn btn--primary" type="submit">Send message</button>
      <div class="alert alert--success" role="status"><span class="alert__icon" aria-hidden="true">✓</span><p><strong>Sample success message:</strong> Thanks — we've received your message and will reply within 2 working days.</p></div>
    </form>
    <div class="stack">
      <h2 style="font-size: var(--text-xl)">Office</h2>
      <address style="font-style: normal">${tbd("Registered address", "C2")}</address>
      <p><strong>Phone:</strong> ${tbd("Phone", "C3")}<br><strong>Email:</strong> <a href="mailto:info@mswelfaretrust.org">info@mswelfaretrust.org</a><br><strong>Hours:</strong> ${tbd("Office hours", "C3")}</p>
      <p><a href="#">Open in Google Maps</a></p>
      ${ph("ph--wide", "Static map image (no embedded map script)")}
    </div>
  </div>
</div>`,
  });
}

export function notFound() {
  return page({
    lang: "en", pageKey: "404", current: null,
    title: "Page not found – MS Welfare Trust",
    main: `
<div class="container section" style="text-align:center">
  <span class="eyebrow">Error 404</span>
  <h1>We can't find that page</h1>
  <p class="lead muted" style="margin-inline:auto">The link may be out of date, or the page may have moved.</p>
  <div class="actions" style="justify-content:center"><a class="btn btn--primary" href="home.html">Go to the home page</a><a class="btn btn--secondary" href="donate.html">Donate</a><a class="btn btn--secondary" href="contact.html">Contact us</a></div>
</div>`,
  });
}
