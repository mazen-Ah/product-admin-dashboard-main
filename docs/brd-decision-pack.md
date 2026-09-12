# BRD Decision Pack — Road Construction & Maintenance PM + Accounting

| Item | Value |
|------|-------|
| Project | Management & accounting system for road construction, rehabilitation and maintenance |
| Source BRD | Version 2.2 (header still says 2.0) |
| Status | **Closed — unlock BRD 2.3 and data model** |
| Date | 12 Sep 2026 |
| Language | English (Arabic terms from BRD glossary in parentheses) |
| Product UI | **Arabic primary (`ar`, `dir=rtl`); English secondary** |
| Client briefs | [client-delivery-brief.ar.md](client-delivery-brief.ar.md) (send first), [client-delivery-brief.en.md](client-delivery-brief.en.md) |

All twelve Client answers below accept the **Recommended default**. Signed for build via the client delivery briefs.

---

## 1. Retention and aging base

**Question:** What number is retention (احتجاز) and aging computed on, if revenue is only cash collected?

**What 2.2 says:** §16 — project revenue = total actually collected; recognised on collection. Retention (10% until handover, or 5% warranty) is computed on “the total at project end,” not per payment. Aging report is required. Chart §18.1 has 1200 Client receivables and 1250 Retention held by the client. BOQ and consultant certificates were dropped (§2). Journal (8) is Dr Bank / Cr Revenue only — nothing hits 1200 or 1250.

**If we guess:** Developers invent a billed or contract total. That invented number becomes the books. You cannot age or withhold retention from cash-in alone.

**Recommended default:** Add one project field `contract_value`. Retention and aging use that number. Collections stay cash-in (4100). Or drop 1200, 1250, and aging from v1.

**Client answer:**

> Accepted: each project has `contract_value`; retention and aging use it; collections stay cash-in (4100).

---

## 2. Owned-equipment profit

**Question:** Does management profit include owned-equipment charge-out (4900), or not?

**What 2.2 says:** §9.1 — owned equipment is charged like rented, offset by internal revenue 4900 within the same project. Journal (6): Dr 5100 / Cr 4900. §20 — Project profit = total collected − total project cost. Cost includes 5100. The profit formula never adds 4900 back.

**If we guess:** Owned kit inflates cost and reduces reported profit even when no cash left the project. Partner distribution (§17) follows the wrong number.

**Recommended default:** Management profit = collected − cash cost (exclude owned charge-out). 4900 stays on the books for cost statements only; it does not reduce partner profit.

**Client answer:**

> Accepted: management profit = collected − cash cost; exclude owned charge-out; 4900 is books-only.

---

## 3. Functional currency and FX (5900)

**Question:** Is LYD the functional currency, and how is account 5900 calculated on a wallet FX transfer?

**What 2.2 says:** §8.2 — multi-currency; every line stores amount, exchange rate, amount in Dinar; rate never recalculated. §8.3 — transfer between currencies at a recorded rate with FX difference posted. §8.4 — custody (عهدة) tracked per project and per currency. Chart has 5900 Foreign exchange differences. Journal (7) posts EGP custody credit as 300 Dinar, not native EGP.

**If we guess:** Custody remainders and wallet reconciliation “per currency” cannot be proven. FX difference (5900) is improvised and partner-visible reports disagree with Excel.

**Recommended default:** Functional currency = LYD. Every wallet and custody line stores native amount + rate + LYD equivalent. On FX transfer: user enters the rate; 5900 = LYD(out) − LYD(in).

**Client answer:**

> Accepted: functional currency = LYD; each line stores native + rate + LYD; 5900 = LYD(out) − LYD(in).

---

## 4. Cross-project home

**Question:** May an Accounts Manager or partner see a list of all their projects?

**What 2.2 says:** §1.1 / §2 / §8.1 — no company level, no company wallet, no consolidated cross-project report. §7.3 — suppliers work across all projects. §8.4 — one person may hold custody on more than one project. §6 — Accounts Manager owns the whole project cycle. §22.2–22.3 — profitability comparison across projects; dashboard of active projects and all wallet balances. §23 — partners view own projects only.

**If we guess:** Either there is no AM/partner home screen, or project B’s costs and prices leak into project A. Shared master data has nowhere to live.

**Recommended default:** No company treasury and no pooled P&L. Shared master data only (users, suppliers, trucks, materials, currencies). Partner and Accounts Manager get a home list of *their* projects only — not a consolidated money report.

**Client answer:**

> Accepted: no company treasury or pooled P&L; shared master data; AM and partner home = their projects only.

---

## 5. Supplier balance scope

**Question:** Are supplier (مورد) balances always per project?

**What 2.2 says:** §7.3 — supplier has balance and open advances; works across all projects; not tied to one. §11.1 — a settlement (مستخلص) belongs to exactly one project. §12 — supplier/carrier statements are project documents. Partners see supplier names and prices on their projects only (§17.3).

**If we guess:** A global balance on the supplier card mixes Suluq and Ajdabiya. Partners see or pay the wrong project’s dues.

**Recommended default:** Supplier is shared master data. Balance, advances, and statements are always `(supplier × project × currency)`. Never a single global balance.

**Client answer:**

> Accepted: supplier balances always `(supplier × project × currency)`.

---

## 6. Paid bon immutability

**Question:** After a settlement is paid, is a bon (بون) immutable?

**What 2.2 says:** §10.3 — Accounts Manager and Managing Partner may amend or cancel a bon at any stage, with a mandatory reason and automatic recalculation. §11.3 — settlement payment is atomic: bons Paid, advances cleared, wallet deducted, journal posted.

**If we guess:** Editing a paid bon rewrites history on a wallet that already moved cash. Payables, paper serials, and cash diverge with no reversal trail.

**Recommended default:** Edit in place only while Pending. After inclusion in a settlement: reversing bon / credit note only. After payment: reverse the settlement (cash back), then create a new bon. Never mutate a paid line.

**Client answer:**

> Accepted: Pending editable; after settlement reverse-only; after pay reverse settlement then new bon.

---

## 7. Standard month hours

**Question:** Is standard monthly hours `26 × that machine’s hours-per-day`, or always 208?

**What 2.2 says:** §9.1 — hourly rate = monthly ÷ 26 ÷ hours per working day. Day is 8 (default) or occasionally 7, set per machine. “A standard month = 26 × 8 = 208 hours.” Above 208 = overtime; below 208 = deducted. Cost formula is linear: actual hours × hourly rate (no floor/ceiling). Salman example uses 8-hour day and 208.

**If we guess:** A 7-hour machine’s true standard month is 182 hours. Using 208 marks every such machine permanently “short.”

**Recommended default:** Standard hours = `26 × that machine’s hours-per-day`. Cost = actual hours × hourly rate. Overtime/shortfall vs standard is informational only. Do not hard-code 208.

**Client answer:**

> Accepted: standard hours = 26 × machine hours-per-day; cost = actual × hourly; no hard-coded 208.

---

## 8. Partial settlement allocation

**Question:** How is a partial payment allocated across bons?

**What 2.2 says:** §11.2 — full payment is the norm; partial payment supported; status Partially Paid. §11.3 — payment effects are atomic but do not define FIFO, user-picked bons, or pro-rata. Volume: up to 15,000 bons/month (§4.2, §28).

**If we guess:** “Partially paid” with no allocation makes supplier statements unreproducible. Advances cannot be cleared safely.

**Recommended default:** User selects which bons to pay. Advances apply oldest-first against the selected set. Unpaid bons stay In Settlement (do not return to Pending).

**Client answer:**

> Accepted: user selects bons; advances oldest-first; unpaid stay In Settlement.

---

## 9. Mid-project surplus formula

**Question:** What is the exact formula for mid-project “surplus” available to withdraw as capital?

**What 2.2 says:** §17.3 — if surplus profit accumulates mid-project and will not be used, partners may withdraw capital up to that surplus. No formula. Retention, tax, partner loans, negative wallets, and owned-equipment cost all change the number. Chart has 3400 Partner capital withdrawals.

**If we guess:** Wrong cap is a partner dispute. Missing cap is an unlimited draw against the project wallet.

**Recommended default:** Surplus = collected − cash costs − unpaid payables − uncleared advances − retention reserve − unpaid partner loans − prior withdrawals. Recalculate on every withdrawal. Cap withdrawals at that amount.

**Client answer:**

> Accepted: surplus = collected − cash costs − unpaid payables − uncleared advances − retention reserve − unpaid loans − prior withdrawals.

---

## 10. Opening balances vs empty v1

**Question:** Do live projects get opening balances, or is v1 an empty new job only?

**What 2.2 says:** §2 #12 / §28 — no migration and no opening balances; existing projects will not be entered; system starts with new projects after launch. §4.2 — live entities: Suluq, Ajdabiya, Internal Roads, the Plant. §27 phase 8 — parallel running against Excel. §25 — replace Excel is a stated goal. Wallet reconciliation (§8.6) still uses “Opening balance + …”.

**If we guess:** The company runs two books forever. The painful high-volume projects stay on Excel while the system sits empty.

**Recommended default:** v1 = one *new* project, plus optional opening balances for wallets, supplier advances/payables, and partner capital/loans on that project. Live jobs stay on Excel until a later migration phase.

**Client answer:**

> Accepted: v1 = one new project + optional opening balances; live Excel projects migrate later.

---

## 11. Partner access in MVP

**Question:** Is partner (شريك) read-only access in MVP, or is goal #1 delayed?

**What 2.2 says:** §25 / §23 — top goal is “account review and partner visibility.” §27 — MVP = phases 1–4 (foundation, bons, settlements, treasury). Partner portal and profitability are phase 7 (weeks 8–9). Target go-live: two months.

**If we guess:** After MVP you can enter bons and pay wallets, but partners still cannot review accounts — the political reason to leave Excel is delayed until the last sprint.

**Recommended default:** MVP includes read-only partner statements for their projects: cost by item, wallet balances, their capital, loans, and management percentage. Profit distribution and closeout wait for a later phase.

**Client answer:**

> Accepted: MVP includes partner read-only (cost, wallets, capital/loans/management %); distribution later.

---

## 12. Tax

**Question:** Tax — per-project rate and journals, or strip 2400 from v1?

**What 2.2 says:** §16 — tax on some projects, rate “averages 5%,” collected in the year the project ends; sometimes withheld up front. Project and client masters carry tax fields (§7.1–7.2). Chart §18.1 has 2400 Taxes and withholdings payable. No sample journal posts tax. §28 — legal requirements: none; no mandated invoice format.

**If we guess:** An unused tax account plus folklore rates produces unauditable books. Coding “average 5%” invents liability.

**Recommended default:** v1 strips tax journals (no postings to 2400). Keep `taxable` (yes/no) on the project as a label only. Ask counsel before any rate or withhold logic. Do not invent rates.

**Client answer:**

> Accepted: v1 no tax journals; `taxable` label only until counsel defines rates.

---

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Client / Accounts Manager | Via client delivery briefs | 12 Sep 2026 | Pending wet signature |
| Managing Partner | Via client delivery briefs | 12 Sep 2026 | Pending wet signature |
| Build lead | Recommended defaults locked | 12 Sep 2026 | Locked for build |

Status is **Closed** for engineering. Wet signatures live on [client-delivery-brief.ar.md](client-delivery-brief.ar.md).
