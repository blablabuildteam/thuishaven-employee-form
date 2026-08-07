# Digital Employee Form — Project Brief

## Project Overview

| | |
|---|---|
| **Client** | Thuishaven |
| **Project** | Digital Employee Form |
| **Budget** | €850 excl. VAT |
| **Lead Time** | 1 week (5 working days) |
| **Hosting** | Vercel |
| **Database** | Vercel Postgres |

---

## Problem Statement

Thuishaven currently uses paper forms for staff intake. Each new staff member fills out a physical form before their shift. HR then manually retypes this data into XPS (payroll system) and generates IB47 tax forms.

**Pain points**:

1. **Time waste**: HR spends 10–15 minutes per form retyping data
2. **Error prone**: Manual transcription leads to mistakes
3. **No tracking**: Shift counts aren't tracked systematically
4. **Contract risk**: Staff may exceed the 4-shift threshold for casual work without HR awareness, creating compliance issues

---

## Solution

A digital intake system that replaces the paper form entirely.

### For Staff
- Public URL accessible on mobile
- Fill out details once; updates for returning staff
- Clear feedback on submission status
- Digital signature pad for form signing

### For HR
- Automatic PDF generation matching the Thuishaven IB47-formulier layout (branding to be finalised)
- Shift counter per employee
- Alert at 3 shifts (warning: contract may be needed)
- Block at 4 shifts (action required before further work)
- Dashboard with:
  - **Daily overview**: Forms grouped by event date, downloadable as PDF
  - **Per-person view**: Employee detail with full submission history
  - **PDF downloads**: Individual or bulk download of completed forms

---

## User Journeys

### Staff Member (New)

```
1. Receives link from Thuishaven (WhatsApp/email/QR at venue)
2. Opens form on phone
3. Fills in personal details, bank info, shift times
4. System auto-calculates pay based on age and hours
5. Signs with digital signature pad
6. Submits form
7. Sees confirmation: "Thank you, your registration is complete"
```

### Staff Member (Returning)

```
1. Opens form link
2. Enters BSN first
3. System recognises them, pre-fills known data and locks those fields
4. Fills only shift-specific info (date, department, times, break) + signature
5. Signs and submits for new shift
6. (If blocked) Sees message: "Contact HR before your next shift"
```

### HR

```
1. Logs into dashboard (email + password)
2. Views daily overview — sees all forms for today's event date
3. Downloads PDF for any submission
4. Checks per-person view — sees employee with 3-shift warning
5. Reviews employee, downloads IB47 PDF
6. Uploads PDF to XPS
7. Acknowledges alert / decides on contract
```

```
1. Receives urgent email: "Jan Jansen is BLOCKED after 4 shifts"
2. Logs into dashboard
3. Reviews situation
4. Either: unblocks (resets counter) OR initiates contract
```

---

## Scope

### In Scope

| Feature | Description |
|---------|-------------|
| Public intake form | Mobile-optimised, all fields from physical form, validation |
| Shift/pay fields | Start time, end time, break, department, auto-calculated pay |
| Hourly rate tiers | Age-based: 18/19yr = €13.50/hr, ≥20yr = €15.00/hr (auto-calculated from DOB) |
| Digital signature | Draw-on-screen signature pad |
| Employee deduplication | Recognise returning staff by BSN |
| PDF generation | Server-side, matching Thuishaven IB47-formulier layout (branding TBD) |
| Shift counter | Per employee, based on submissions |
| 3-shift alert | Email to HR + dashboard indicator |
| 4-shift block | Form rejects submission until HR unblocks |
| HR dashboard | Daily overview (by event date), per-person view, alerts, PDF downloads |
| HR authentication | Email + password accounts via `.env` (`HR_USERS`) |
| Email notifications | Brevo integration for alerts |

### Out of Scope (Future)

| Feature | Notes |
|---------|-------|
| Direct XPS integration | Research runs in parallel; separate quote if feasible |
| Shift scheduling link | Potential future connection to roster system |
| Multi-language | Dutch only in v1 |
| SMS notifications | Email only in v1 |

---

## Form Fields

Matching the current physical Thuishaven IB47-formulier:

### Personal
- First name
- Last name (Voornaam + achternaam)
- Date of birth (Geboortedatum)
- BSN / Sofinummer

### Address
- Street + house number (Straat + huisnummer)
- Postal code + city (Postcode + woonplaats)

### Contact
- Phone number (Telefoonnummer)
- Email

### Bank
- IBAN (Bankrekeningnummer)

### Event / Shift
- Event date (Datum project)
- Department (Afdeling)
- Start time (Starttijd)
- End time (Eindtijd)
- Break duration (Pauze)

### Pay (auto-calculated)
- Hourly rate (Uurloon) — determined by age from DOB:
  - 18/19 jaar = €13.50 per uur
  - ≥ 20 jaar = €15.00 per uur
- Total hours worked
- Total pay (Totaal)

### Signature
- Digital signature (Handtekening)

### NOT included (differs from written IB47 spec)
- ~~Place of birth~~ — not on physical form
- ~~Nationality~~ — not on physical form
- ~~ID document type/number/expiry~~ — not on physical form
- ~~Loonheffingskorting~~ — not on physical form
- ~~Account holder name~~ — not on physical form (just IBAN)

---

## Technical Summary

| | |
|---|---|
| **Framework** | Next.js 15 (App Router) |
| **Database** | Vercel Postgres |
| **ORM** | Prisma |
| **PDF** | `@react-pdf/renderer` |
| **Auth** | NextAuth.js (credentials provider) |
| **Email** | Brevo |
| **UI** | shadcn/ui + Tailwind |
| **Hosting** | Vercel |

Full technical details in `TECHNICAL_APPROACH.md`.

---

## Security & Compliance

### Data Classification

This system processes **sensitive personal data**:
- BSN (national ID number)
- Bank details (IBAN)

### Measures

| Measure | Implementation |
|---------|----------------|
| Encryption at rest | BSN and IBAN encrypted in database |
| HTTPS | Enforced on all routes |
| Access control | Dashboard requires authentication |
| Rate limiting | Prevents brute force / spam |
| Bot protection | Honeypot + optional CAPTCHA |
| Audit logging | Actions logged (who unblocked, when) |

### GDPR

- **Controller**: Thuishaven
- **Processor**: blablabuild (during development), then Thuishaven
- **Data location**: EU (Vercel EU region)
- **Retention**: Aligned with Thuishaven HR policy
- **Processor agreement**: Signed before go-live

---

## Deliverables

| # | Deliverable | Format |
|---|-------------|--------|
| 1 | Production deployment | Live at form.thuishaven.nl |
| 2 | HR user accounts | Login credentials |
| 3 | Source code | GitHub repository |
| 4 | Documentation | Setup guide + this brief |
| 5 | PDF template | Thuishaven-branded IB47-formulier (branding TBD) |

---

## Timeline

| Day | Milestone |
|-----|-----------|
| 1 | Project setup, database schema, form UI |
| 2 | Form validation, submission logic, deduplication, signature pad |
| 3 | PDF generation, shift counter, pay calculation, alert system |
| 4 | HR dashboard: daily overview, per-person view, alerts |
| 5 | Testing, deployment, documentation, handover |

---

## Acceptance Criteria

### Form Submission
- [ ] All fields validate correctly (BSN 11-proef, IBAN format, etc.)
- [ ] Returning employees are recognised by BSN; known data is pre-filled and locked
- [ ] First-time staff upload passport/ID-card copy; stored on employee profile (private Blob)
- [ ] Form works smoothly on mobile (iOS Safari, Android Chrome)
- [ ] Submission creates database record and generates PDF
- [ ] Digital signature captured and included in PDF
- [ ] Pay auto-calculated based on age and hours worked

### Shift Counter
- [ ] Counter increments correctly per submission
- [ ] Alert created and email sent at 3 shifts
- [ ] Block alert created and urgent email sent at 4 shifts
- [ ] Form rejects 5th submission with clear message

### HR Dashboard
- [ ] Login works with HR accounts from `HR_USERS` in `.env`
- [ ] Daily overview shows forms grouped by event date
- [ ] Per-person view shows employee with all submissions
- [ ] Search and filter function correctly
- [ ] PDF download works for any submission
- [ ] Unblock action resets counter and allows new submission
- [ ] Alerts list shows pending items
- [ ] Acknowledge removes alert from pending list

### PDF
- [ ] Generated PDF matches Thuishaven IB47-formulier layout
- [ ] All submitted data appears correctly including signature
- [ ] PDF is downloadable and uploadable to XPS

---

## Required from Thuishaven

Before kickoff:

| Item | Status |
|------|--------|
| Current paper form (scan or field list) | ✅ Received |
| Sample completed IB47 (template reference) | ✅ Received |
| HR contact (primary user) | ☐ |
| HR email address for alerts | ☐ |
| Branding assets for PDF (logo, fonts, colours) | ☐ TBD |
| Domain: form.thuishaven.nl (or alternative) | ☐ |
| DNS access for domain verification | ☐ |

---

## Decisions Log

| Decision | Chosen Option | Date |
|----------|---------------|------|
| Include shift/pay fields from physical form | Yes, all fields | 2026-08-05 |
| Include IB47 fields NOT on physical form | No, match paper form | 2026-08-05 |
| PDF format | Thuishaven-branded (branding TBD) | 2026-08-05 |
| Digital signature | Yes, signature pad | 2026-08-05 |
| Pay calculation | Auto-calculate from age + hours | 2026-08-05 |
| Dashboard daily grouping | By event date | 2026-08-05 |
| HR authentication | Email + password via `.env` (`HR_USERS`) | 2026-08-05 |
| Hosting & storage | Vercel + Vercel Postgres | 2026-08-05 |
