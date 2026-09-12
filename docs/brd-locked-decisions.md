# BRD locked decisions (agent reference)

Source: [brd-decision-pack.md](brd-decision-pack.md) — **Closed**. Client briefs: [client-delivery-brief.ar.md](client-delivery-brief.ar.md), [client-delivery-brief.en.md](client-delivery-brief.en.md).

Do not invent accounting policy. Follow these one-liners.

## UI language

- `defaultLocale = ar`
- Default `dir = rtl`
- English is secondary via language switch (`en`, LTR)
- Tailgrids + `design.md` only; no second UI kit
- Product copy authored in Arabic first

## Money and domain rules

1. Project has `contract_value`. Retention and aging use it. Collections stay cash-in (4100).
2. Management profit = collected − cash cost (exclude owned charge-out). 4900 is books-only.
3. Functional currency = LYD. Lines store native + rate + LYD. FX: 5900 = LYD(out) − LYD(in).
4. No company treasury / pooled P&L. Shared master data. AM + partner home = their projects only.
5. Supplier balances always `(supplier × project × currency)`.
6. Pending: edit in place. In settlement: reverse only. Paid: reverse settlement, then new bon.
7. Standard hours = `26 × machine hours-per-day`. Cost = actual × hourly. No hard-coded 208.
8. Partial pay: user picks bons; advances oldest-first; unpaid stay In Settlement.
9. Surplus = collected − cash costs − unpaid payables − uncleared advances − retention reserve − unpaid loans − prior withdrawals.
10. v1 = one new project + optional opening balances. Live Excel jobs migrate later.
11. MVP includes partner read-only (cost, wallets, capital/loans/management %). Distribution later.
12. v1: no tax journals (no 2400). `taxable` label only.
