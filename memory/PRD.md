# 10Rs Baithulmal — PRD

## Problem
Build a community welfare fund management app ("10 Rupee Baithulmal") to manage donors, beneficiaries, loans (Kadan / Vattiyilla Kadan), Sadakah, monthly payments, expenses (worker salaries + maintenance), accounts (approval + outstanding by collector), reports (PDF + WhatsApp), and admin user management.

## Users
- Admin — full access (approvals, deletions, user mgmt).
- Collector — collects donor payments (pending until admin approves).

## Core Requirements
- CRUD Donors / Beneficiaries / Workers with contact-number lookup.
- Kadan / Vattiyilla Kadan with security details, repayment tracking, TIME LIMIT EXCEED, Admin extend / block / unblock.
- Sadakah (charity given).
- Payment collection (month from-to, ₹ per month, generates receipt).
- Expenses (salary per worker per month, maintenance).
- Accounts: main balance, approvals, outstanding by collector.
- Reports: daily / monthly / yearly / custom / individual · PDF & WhatsApp share.
- Admin: user CRUD, roles, permissions.

## Implemented (Feb 2026 — v1)
- JWT auth (Bearer, localStorage), admin seed.
- Full backend REST API (`/api/*`), MongoDB persistence.
- React 19 frontend, Cormorant Garamond + Outfit, moss/copper palette per design_guidelines.json.
- All modules functional end-to-end.
- PDF (jsPDF+autotable) + WhatsApp share via wa.me link.

## Backlog / Nice-to-have
- P1: Bulk payment collection (multi-donor at once).
- P1: SMS / WhatsApp reminder to donors who missed a month.
- P2: Beneficiary photo upload.
- P2: Zakat calculator.
- P2: Multi-language (Tamil/Malayalam labels).

## Next Actions
- Run testing subagent, address any critical issues.
