# Client Delivery Brief — Road Project Management & Accounting System

| Item | Value |
|------|-------|
| Project | Management and accounting system for road construction, rehabilitation, and maintenance |
| Source document | Business Requirements Document (BRD) version 2.2 |
| Status of this brief | Ready for approval — closes decision points before build |
| Date | 12 September 2026 |
| Default product language | **Arabic (RTL)** — English is secondary via language switch |

---

## Purpose

This brief closes the open money rules in BRD 2.2 before programming starts, and states delivery phases: what ships in the first release (MVP) and what waits.

Please review the decisions and phases and sign at the end.

---

## Part A — Twelve locked decisions

### 1. Retention and aging base

**Question:** What number is retention and aging computed on if revenue is recorded only when collected?

**Rule we will build:** Each project has a **contract value**. Retention and aging use that number. Client money in is still recorded when collected (cash/bank).

**Why it matters:** Without a reference total, retention and overdue tracking cannot be correct.

---

### 2. Owned-equipment profit

**Question:** Does internal owned-equipment charge-out reduce partner profit?

**Rule:** Management/partner profit = collected − cash cost only. Internal owned-equipment charge stays on the books and does not reduce partner profit.

**Why it matters:** Otherwise reported profit is lower than the project’s cash reality.

---

### 3. Functional currency and FX

**Question:** Is LYD the reporting currency, and how is FX difference calculated on wallet transfers?

**Rule:** Libyan Dinar (LYD) is the reporting currency. Every line stores: original amount + exchange rate + LYD equivalent. FX difference = LYD out − LYD in.

**Why it matters:** Multi-currency wallets and custodies will not reconcile without this rule.

---

### 4. Cross-project home

**Question:** May an Accounts Manager or partner see a list of all their projects?

**Rule:** No shared company cash pot and no pooled profit across projects. Master data is shared (suppliers, trucks, currencies…). Partners and Accounts Managers see **a list of their projects only**.

**Why it matters:** Keeps projects financially separate while allowing daily work.

---

### 5. Supplier balance

**Question:** Is the supplier balance always per project?

**Rule:** Supplier card is shared. Balance, advances, and statements are always **supplier × project × currency**. Never one global balance.

**Why it matters:** Prevents mixing one project’s dues with another’s.

---

### 6. Editing a bon after payment

**Question:** After a settlement is paid, can a bon be edited?

**Rule:** Direct edit only while the bon is Pending. After it is on a settlement: reversing document only. After payment: reverse the settlement, then create a new bon. Never mutate a paid line.

**Why it matters:** Protects cash, payables, and the paper bon serial.

---

### 7. Standard machine month hours

**Question:** Is a standard month always 208 hours, or based on that machine’s day length?

**Rule:** Standard hours = **26 × that machine’s working hours per day**. Cost = actual hours × hourly rate. Do not hard-code 208 for every machine.

**Why it matters:** A 7-hour machine has a 182-hour standard month, not 208.

---

### 8. Partial settlement payment

**Question:** How is a partial payment allocated across bons?

**Rule:** The user selects which bons to pay. Advances apply oldest-first. Unpaid bons stay In Settlement.

**Why it matters:** Without clear allocation, supplier statements cannot be reviewed.

---

### 9. Mid-project surplus for capital withdrawal

**Question:** What is the surplus formula for mid-project capital withdrawals?

**Rule:** Surplus = collected − cash costs − unpaid payables − uncleared advances − retention reserve − unpaid partner loans − prior withdrawals. Recalculate on every withdrawal; do not exceed this cap.

**Why it matters:** Prevents unlimited draws from the project wallet.

---

### 10. Opening balances and live projects

**Question:** Do live projects get opening balances, or does the system start with an empty new project?

**Rule:** First go-live = **one new project** with optional opening balances (wallets, suppliers, partners). Current Excel projects migrate later.

**Why it matters:** Makes clear that full Excel replacement is not day one.

---

### 11. Partner visibility in the first release

**Question:** Is partner read-only access in the first release?

**Rule:** Yes. The first release includes a partner read-only statement: cost, wallets, their capital, loans, and management percentage. Full profit distribution and closeout come later.

**Why it matters:** Delivers “account review and partner visibility” with the first useful handover.

---

### 12. Tax

**Question:** Are tax journals posted in the first release?

**Rule:** The first release **does not post tax journals**. A project may only be marked taxable yes/no until counsel defines rates and method.

**Why it matters:** Avoids inventing tax rates in the ledger.

---

## Part B — Delivery phases

No fixed calendar dates here. Phases are capability stages; dates are agreed after approval.

| Phase | Content | Note |
|-------|---------|------|
| 0 | Close decisions and prepare technical base | Before build |
| 1 | Users, roles, master data + Arabic RTL shell | Foundation |
| 2 | Bons, tally sheets, report-vs-tally control | |
| 3 | Settlements, advances, full/partial payment | |
| 4 | Multi-currency wallets, custodies + partner read-only | **MVP gate** |
| 5 | Equipment, expenses, subsistence, lump-sum payroll | After MVP |
| 6 | Chart of accounts, reports, cost statement | |
| 7 | Profitability, partner distribution, closeout | |
| 8 | Go-live on one new project + parallel run vs Excel | |

**First release (MVP) = end of Phase 4:** roles, master data, bons and settlements, wallets, and partner read-only view.

---

## Part C — Language and interface

- **Primary UI language:** Arabic, right-to-left (RTL) by default.
- **Secondary language:** English via a language switch (LTR).
- Product copy is authored in Arabic first, with English in parallel.
- Accounting figures use Western digits for clarity (unless later requested otherwise).

---

## Part D — Out of first release

Bill of quantities, estimated budgets, purchase orders and warehouses, depreciation, subcontractor retention, offline mode, tax journal postings, waste module, Technical Office role, transfers between projects, consolidated company P&L, and migration of live Excel projects (later).

---

## Part E — Sign-off

By signing, I approve the twelve decisions and delivery phases above as the basis for build.

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Client / Accounts Manager | | | |
| Managing Partner | | | |
| Build lead | | | |

After sign-off, data-model design opens, then Phase 1.
