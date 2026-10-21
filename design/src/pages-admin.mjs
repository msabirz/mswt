import { doc, mockBanner, tbd } from "./layout.mjs";
import { rupees } from "./i18n.mjs";

const NAV = [
  ["dashboard", "Dashboard"], ["donations", "Donations"], ["donors", "Donors"], ["causes", "Causes"],
  ["content", "Content"], ["messages", "Messages"], ["reports", "Reports"], ["settings", "Settings"], ["users", "Users & roles"], ["audit", "Audit log"],
];
const LINKS = { dashboard: "dashboard.html", donations: "donations.html" };

function shell({ title, current, main }) {
  return doc({
    lang: "en", title: `${title} – MSWT Admin`, depth: 1,
    body: `<a class="skip-link" href="#main">Skip to main content</a>
${mockBanner("en", "../")}
<div class="admin">
  <aside class="admin-side on-dark">
    <img src="../assets/mswt-logo-horizontal-reversed.svg" alt="MS Welfare Trust admin" width="200" height="63">
    <nav aria-label="Admin"><ul>
      ${NAV.map(([k, label]) => `<li><a href="${LINKS[k] ?? "#"}"${k === current ? ' aria-current="page"' : ""}>${label}</a></li>`).join("")}
    </ul></nav>
  </aside>
  <main id="main" class="admin-main" tabindex="-1">${main}</main>
</div>`,
  });
}

const rows = [
  ["MSWT/2026-27/000123", "20 Oct 2026, 11:42", "Rahul M.", "School support", "Online · UPI", 500000, "Paid", "80G"],
  ["—", "20 Oct 2026, 11:05", "Asha K.", "General fund", "Online · Card", 250000, "Pending", "—"],
  ["MSWT/ACK/2026-27/000017", "19 Oct 2026, 16:20", "Anonymous display", "Relief kits", "Cash", 300000, "Paid", "Ack"],
  ["MSWT/2026-27/000122", "19 Oct 2026, 09:13", "Fatema S.", "Medical help", "NEFT", 1000000, "Paid", "80G"],
  ["—", "18 Oct 2026, 21:47", "Vikram P.", "School support", "Online · Netbanking", 100000, "Failed", "—"],
];
const statusBadge = { Paid: "badge--success", Pending: "badge--warning", Failed: "badge--error" };

function table(withActions) {
  return `<div class="table-wrap" tabindex="0" role="region" aria-label="Donations table"><table>
  <caption class="visually-hidden">Donations, newest first</caption>
  <thead><tr><th scope="col">Receipt no.</th><th scope="col">Received (IST)</th><th scope="col">Donor</th><th scope="col">Cause</th><th scope="col">Mode</th><th scope="col" class="num">Amount</th><th scope="col">Status</th><th scope="col">Receipt</th>${withActions ? '<th scope="col"><span class="visually-hidden">Actions</span></th>' : ""}</tr></thead>
  <tbody>
    ${rows.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td><td class="num">${rupees(r[5])}</td><td><span class="badge ${statusBadge[r[6]]}">${r[6]}</span></td><td>${r[7]}</td>${withActions ? `<td><a href="#">View<span class="visually-hidden"> donation ${r[0]}</span></a></td>` : ""}</tr>`).join("")}
  </tbody></table></div>`;
}

export function login() {
  return doc({
    lang: "en", title: "Sign in – MSWT Admin", depth: 1,
    body: `${mockBanner("en", "../")}
<main id="main" class="auth-wrap">
  <div class="stack" style="width:100%; max-width: 26rem">
    <div class="auth-card">
      <img src="../assets/mswt-logo-horizontal.svg" alt="MS Welfare Trust" width="208" height="65">
      <h1 style="font-size: var(--text-2xl)">Sign in to admin</h1>
      <form class="form" action="#" method="post" novalidate>
        <div class="field"><label for="l-email">Email</label><input class="input" id="l-email" type="email" autocomplete="username"></div>
        <div class="field"><label for="l-pass">Password</label><input class="input" id="l-pass" type="password" autocomplete="current-password"><p class="hint">Paste and password managers are allowed.</p></div>
        <button class="btn btn--primary btn--block" type="submit">Continue</button>
      </form>
    </div>
    <div class="auth-card">
      <span class="state-label">Step 2 — two-factor code</span>
      <h2 style="font-size: var(--text-xl)">Enter your 6-digit code</h2>
      <form class="form" action="#" method="post" novalidate>
        <div class="field"><label for="l-otp">Code from your authenticator app</label><p class="hint" id="l-otp-hint">You can paste the code.</p><input class="input" id="l-otp" inputmode="numeric" autocomplete="one-time-code" maxlength="6" aria-describedby="l-otp-hint" style="max-width: 12rem; letter-spacing: var(--tracking-caps)"></div>
        <button class="btn btn--primary btn--block" type="submit">Verify and sign in</button>
        <p class="small"><a href="#">Use a recovery code instead</a></p>
      </form>
    </div>
  </div>
</main>`,
  });
}

export function dashboard() {
  return shell({
    title: "Dashboard", current: "dashboard",
    main: `
<div class="admin-top"><h1>Dashboard</h1><a class="btn btn--primary" href="donation-new.html">Record offline donation</a></div>
<div class="kpis">
  <div class="kpi"><span class="muted small">Today</span><strong>${rupees(1050000)}</strong><span class="small muted">4 donations</span></div>
  <div class="kpi"><span class="muted small">FY 2026-27 to date</span><strong>${rupees(332500000)}</strong><span class="small muted">812 donations</span></div>
  <div class="kpi"><span class="muted small">Pending confirmation</span><strong>3</strong><span class="small muted">oldest 12 min ago</span></div>
  <div class="kpi"><span class="muted small">Last reconciliation</span><strong>03:00 IST</strong><span class="badge badge--success">OK · 0 changes</span></div>
</div>
<div class="grid grid--dash">
  <section class="stack" aria-labelledby="recent-h"><h2 id="recent-h" style="font-size: var(--text-xl)">Recent donations</h2>${table(false)}<p><a href="donations.html">All donations</a></p></section>
  <section class="panel stack" aria-labelledby="bycause-h"><h2 id="bycause-h" style="font-size: var(--text-xl)">This FY by cause</h2>
    <div class="table-wrap" tabindex="0" role="region" aria-label="Totals by cause"><table><tbody>
      <tr><th scope="row">School support</th><td class="num">${rupees(182500000)}</td></tr>
      <tr><th scope="row">Medical help</th><td class="num">${rupees(94000000)}</td></tr>
      <tr><th scope="row">Relief kits</th><td class="num">${rupees(56000000)}</td></tr>
    </tbody></table></div>
    <p class="small muted">Sample figures.</p>
  </section>
</div>`,
  });
}

export function donations() {
  return shell({
    title: "Donations", current: "donations",
    main: `
<div class="admin-top"><h1>Donations</h1><div class="actions" style="margin:0"><a class="btn btn--secondary" href="#">Export CSV</a><a class="btn btn--secondary" href="#">Export Excel</a><a class="btn btn--primary" href="donation-new.html">Record offline donation</a></div></div>
<form class="filters" action="#" role="search" aria-label="Filter donations">
  <div class="field"><label for="f-q">Donor, email or receipt no.</label><input class="input" id="f-q" type="search"></div>
  <div class="field"><label for="f-fy">Financial year</label><select class="select" id="f-fy"><option>2026-27</option><option>2025-26</option></select></div>
  <div class="field"><label for="f-from">From</label><input class="input" id="f-from" type="date"></div>
  <div class="field"><label for="f-to">To</label><input class="input" id="f-to" type="date"></div>
  <div class="field"><label for="f-cause">Cause</label><select class="select" id="f-cause"><option>All causes</option></select></div>
  <div class="field"><label for="f-mode">Mode</label><select class="select" id="f-mode"><option>All modes</option><option>Online</option><option>Cash</option><option>Cheque</option><option>NEFT</option><option>UPI (offline)</option></select></div>
  <div class="field"><label for="f-status">Status</label><select class="select" id="f-status"><option>All statuses</option><option>Paid</option><option>Pending</option><option>Failed</option><option>Refunded</option></select></div>
  <div class="field"><label for="f-rcpt">Receipt type</label><select class="select" id="f-rcpt"><option>All</option><option>80G</option><option>Acknowledgement</option></select></div>
  <button class="btn btn--primary" type="submit">Apply filters</button>
</form>
<p class="small muted" role="status">Showing 1–5 of 812 donations</p>
${table(true)}
<nav aria-label="Pagination" class="actions"><a class="btn btn--ghost" aria-disabled="true">Previous</a><a class="btn btn--ghost" href="#">Next</a></nav>`,
  });
}

export function donationNew() {
  return shell({
    title: "Record offline donation", current: "donations",
    main: `
<div class="admin-top"><h1>Record offline donation</h1></div>
<form class="form" action="#" method="post" novalidate style="max-width: 48rem">
  <fieldset class="panel stack"><legend><h2 style="font-size: var(--text-xl); margin:0">Donation</h2></legend>
    <fieldset class="field"><legend>Mode <span class="req">(required)</span></legend>
      <div class="grid grid--2 grid--4">
        ${["Cash", "Cheque", "NEFT / RTGS", "UPI (offline)"].map((m, i) => `<div class="choice"><input type="radio" name="mode" id="mode-${i}"${i === 0 ? " checked" : ""}><label for="mode-${i}">${m}</label></div>`).join("")}
      </div>
    </fieldset>
    <div class="grid grid--2">
      <div class="field"><label for="o-amt">Amount <span class="req">(required)</span></label><div class="input-prefix"><span aria-hidden="true">₹</span><input class="input" id="o-amt" inputmode="numeric" value="3000" aria-describedby="cash-warning"></div></div>
      <div class="field"><label for="o-date">Received on <span class="req">(required)</span></label><input class="input" id="o-date" type="date" value="2026-10-19"></div>
    </div>
    <div class="alert alert--warning" id="cash-warning" role="status"><span class="alert__icon" aria-hidden="true">!</span><div><strong>Cash above ₹2,000 isn't eligible for 80G</strong><p>An acknowledgement receipt (MSWT/ACK/…) will be issued instead of an 80G receipt. Ask the donor to pay by cheque, NEFT or UPI if they need an 80G receipt.</p></div></div>
    <div class="grid grid--2">
      <div class="field"><label for="o-ref">Cheque no. / UTR <span class="req">(for non-cash)</span></label><input class="input" id="o-ref" disabled></div>
      <div class="field"><label for="o-bank">Bank <span class="req">(for non-cash)</span></label><input class="input" id="o-bank" disabled></div>
    </div>
    <div class="field"><label for="o-cause">Cause</label><select class="select" id="o-cause"><option>General fund</option><option>Relief kits</option></select></div>
  </fieldset>
  <fieldset class="panel stack"><legend><h2 style="font-size: var(--text-xl); margin:0">Donor</h2></legend>
    <div class="field"><label for="o-find">Find existing donor</label><input class="input" id="o-find" type="search" placeholder="Name, PAN, email or phone"></div>
    <div class="grid grid--2">
      <div class="field"><label for="o-name">Full name <span class="req">(required)</span></label><input class="input" id="o-name"></div>
      <div class="field"><label for="o-pan">PAN <span class="req">(required for 80G)</span></label><input class="input" id="o-pan" autocapitalize="characters"></div>
      <div class="field"><label for="o-email">Email</label><input class="input" id="o-email" type="email"></div>
      <div class="field"><label for="o-phone">Mobile</label><input class="input" id="o-phone" type="tel"></div>
    </div>
    <div class="field"><label for="o-addr">Address</label><input class="input" id="o-addr"></div>
    <div class="choice"><input type="checkbox" id="o-cit" checked><label for="o-cit">Donor has declared Indian citizenship</label></div>
  </fieldset>
  <div class="actions"><button class="btn btn--primary" type="submit">Save and issue receipt</button><a class="btn btn--secondary" href="donations.html">Cancel</a></div>
  <p class="small muted">Saving records an audit-log entry with your name and the time.</p>
</form>`,
  });
}

export { tbd };
