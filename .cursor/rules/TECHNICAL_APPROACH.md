# Digital Employee Form — Technical Approach

## Overview

A digital intake form replacing the current paper-based staff registration process. Staff enter their own details via a public URL; the system generates a Thuishaven-branded IB47-formulier PDF for HR to upload to XPS. Includes shift tracking with time/pay calculation, alerts and blocks, plus an HR dashboard with daily overview and per-person views.

**Budget**: €850 excl. VAT  
**Lead time**: 1 week  
**Hosting**: Vercel  
**Database**: Vercel Postgres

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Vercel                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │ Public Form  │    │  HR Dashboard │    │   API Routes     │  │
│  │   /form      │    │   /dashboard  │    │   /api/*         │  │
│  │  (no auth)   │    │   (protected) │    │                  │  │
│  └──────┬───────┘    └──────┬───────┘    └────────┬─────────┘  │
│         │                   │                      │            │
│         └───────────────────┼──────────────────────┘            │
│                             │                                   │
│                    ┌────────▼────────┐                          │
│                    │   PostgreSQL    │                          │
│                    │ (Vercel Postgres)│                          │
│                    └─────────────────┘                          │
│                                                                 │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │  PDF Generation  │    │   Brevo (email)  │                   │
│  │  (server-side)   │    │   notifications  │                   │
│  └──────────────────┘    └──────────────────┘                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Framework | Next.js 15 (App Router) | Server Components + Server Actions |
| Database | Vercel Postgres | Managed PostgreSQL |
| ORM | Prisma | Type-safe queries, migrations |
| Auth | NextAuth.js | Credentials from `HR_USERS` in `.env.local` |
| UI | shadcn/ui + Tailwind | Mobile-first form |
| PDF | `@react-pdf/renderer` | Server-side PDF generation |
| Email | Brevo (Sendinblue) | Alert notifications |
| Validation | Zod | Schema validation |
| Signature | `react-signature-canvas` | Digital signature capture |
| Hosting | Vercel | Serverless functions |

---

## Database Schema

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DATABASE_URL_UNPOOLED")
}

model Employee {
  id              String       @id @default(cuid())

  // Identity (matching physical form)
  firstName       String
  lastName        String
  dateOfBirth     DateTime
  bsn             String       @unique // Encrypted at rest

  // Address
  street          String
  houseNumber     String
  postalCode      String
  city            String

  // Contact
  email           String
  phone           String

  // Bank
  iban            String       // Encrypted at rest

  // Metadata
  isBlocked       Boolean      @default(false)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  // Relations
  submissions     Submission[]
  alerts          Alert[]

  @@index([lastName, dateOfBirth])
}

model Submission {
  id              String       @id @default(cuid())
  employeeId      String
  employee        Employee     @relation(fields: [employeeId], references: [id])

  // Event / shift info
  eventDate       DateTime
  department      String?      // Afdeling

  // Time tracking
  startTime       String       // HH:mm format
  endTime         String       // HH:mm format
  breakMinutes    Int          @default(0)

  // Pay calculation
  hourlyRate      Decimal      @db.Decimal(10, 2)
  totalHours      Decimal      @db.Decimal(10, 2)
  totalPay        Decimal      @db.Decimal(10, 2)

  // Signature
  signatureData   String?      @db.Text // Base64 PNG

  // PDF
  pdfUrl          String?
  pdfGeneratedAt  DateTime?

  // Status
  status          SubmissionStatus @default(PENDING)
  reviewedAt      DateTime?
  reviewedBy      String?

  // Metadata
  createdAt       DateTime     @default(now())
  ipAddress       String?
  userAgent       String?

  @@index([employeeId])
  @@index([eventDate])
  @@index([createdAt])
}

model Alert {
  id              String       @id @default(cuid())
  employeeId      String
  employee        Employee     @relation(fields: [employeeId], references: [id])
  type            AlertType
  message         String

  // Status
  acknowledged    Boolean      @default(false)
  acknowledgedAt  DateTime?
  acknowledgedBy  String?

  // Metadata
  createdAt       DateTime     @default(now())

  @@index([employeeId])
  @@index([acknowledged, createdAt])
}

model HRUser {
  id              String       @id @default(cuid())
  email           String       @unique
  name            String
  passwordHash    String
  role            Role         @default(HR)

  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
}

enum SubmissionStatus {
  PENDING
  REVIEWED
  BLOCKED
}

enum AlertType {
  THREE_SHIFTS
  FOUR_SHIFTS
  CONTRACT_NEEDED
}

enum Role {
  HR
  ADMIN
}
```

---

## Form Fields

Matching the physical Thuishaven IB47-formulier exactly:

### Personal Information
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| First name | text | min 1 char | ✓ |
| Last name | text | min 1 char | ✓ |
| Date of birth | date | valid date, age ≥ 16 | ✓ |
| BSN | text | 9 digits, 11-proef valid | ✓ |

### Address
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| Street + house number | text | min 1 char | ✓ |
| Postal code | text | Dutch format (1234 AB) | ✓ |
| City | text | min 1 char | ✓ |

### Contact
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| Phone | tel | Dutch mobile/landline | ✓ |
| Email | email | valid email | ✓ |

### Bank
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| IBAN | text | valid IBAN (NL preferred) | ✓ |

### Event / Shift
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| Event date | date | valid date | ✓ |
| Department | text | optional | ✗ |
| Start time | time | HH:mm | ✓ |
| End time | time | HH:mm, must be after start (or next day) | ✓ |
| Break | number | minutes (0+) | ✓ |

### Pay (auto-calculated, read-only)
| Field | Type | Calculation | Display |
|-------|------|-------------|---------|
| Hourly rate | currency | 18/19yr → €13.25, ≥20yr → €14.75 (from DOB) | ✓ |
| Total hours | decimal | (end - start - break) in hours | ✓ |
| Total pay | currency | hourly rate × total hours | ✓ |

### Signature
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| Signature | canvas | non-empty drawing | ✓ |

---

## Pay Calculation Logic

```typescript
function calculateHourlyRate(dateOfBirth: Date, eventDate: Date): number {
  const age = differenceInYears(eventDate, dateOfBirth);

  if (age >= 20) return 14.75;
  if (age >= 18) return 13.25;

  throw new Error('Employee must be at least 18 years old');
}

function calculateTotalHours(
  startTime: string,  // "HH:mm"
  endTime: string,    // "HH:mm"
  breakMinutes: number
): number {
  let start = parse(startTime, 'HH:mm');
  let end = parse(endTime, 'HH:mm');

  // Handle overnight shifts (e.g. 22:00 - 06:00)
  if (end <= start) {
    end = addDays(end, 1);
  }

  const totalMinutes = differenceInMinutes(end, start) - breakMinutes;
  return Math.max(0, totalMinutes / 60);
}

function calculateTotalPay(hourlyRate: number, totalHours: number): number {
  return Math.round(hourlyRate * totalHours * 100) / 100;
}
```

---

## API Routes

### Public (No Auth)

```
POST /api/form/submit
  - Validates form data
  - Creates/updates Employee record
  - Creates Submission record with pay calculation
  - Stores signature data
  - Triggers PDF generation
  - Checks shift count → creates Alert if needed
  - Returns: { success: true, submissionId: string }

GET /api/form/check-status
  - Query: ?bsn=123456789 (or hash)
  - Returns: { blocked: boolean, shiftCount: number }
  - Used to show warning before submission

GET /api/form/lookup
  - Query: ?bsn=123456789
  - Returns: prefilled employee data (if exists)
  - Used for returning employee recognition
```

### Protected (HR Auth)

```
GET /api/dashboard/employees
  - List all employees with shift counts
  - Query: ?search=&status=&sort=

GET /api/dashboard/employees/[id]
  - Single employee with all submissions

GET /api/dashboard/submissions
  - All submissions, filterable by event date
  - Query: ?date=&from=&to=&status=

GET /api/dashboard/submissions/[id]/pdf
  - Download generated PDF

POST /api/dashboard/employees/[id]/unblock
  - Reset shift counter / lift block
  - Creates audit log entry

GET /api/dashboard/alerts
  - List all unacknowledged alerts

POST /api/dashboard/alerts/[id]/acknowledge
  - Mark alert as handled
```

---

## HR Dashboard

### Pages

```
/login                        → Email + password login
/dashboard                    → Overview: alerts, recent submissions, stats
/dashboard/daily              → Daily overview: forms grouped by event date
/dashboard/employees          → Employee list with search/filter (per-person view)
/dashboard/employees/[id]     → Employee detail with all submissions
/dashboard/alerts             → Pending alerts requiring action
```

### Daily Overview (Primary View)

- Calendar/date picker to select event date
- List of all forms submitted for that date
- Columns: Employee name, department, start/end time, total hours, total pay, PDF download
- Bulk PDF download for entire day
- Summary row: total employees, total hours, total pay for the day

### Per-Person View

| Column | Sortable | Filterable |
|--------|----------|------------|
| Name | ✓ | search |
| Shift count | ✓ | range |
| Last submission | ✓ | date range |
| Status | ✓ | dropdown (active/blocked) |
| Actions | - | - |

### Actions per Employee

- View details + full submission history
- Download latest PDF
- Reset shift counter (with confirmation + audit log)
- View all submissions with individual PDF downloads

---

## Security

### Data Protection

```typescript
// Encryption for sensitive fields (BSN, IBAN)
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // 32 bytes
const ALGORITHM = 'aes-256-gcm';

export function encrypt(text: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encrypted: string): string {
  const [ivHex, authTagHex, encryptedText] = encrypted.split(':');
  const decipher = createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(ivHex, 'hex')
  );
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

### Bot Protection

- Honeypot field in form (hidden, triggers rejection if filled)
- Minimum form completion time check (< 5 seconds = likely bot)

### Access Control

HR accounts are stored in `.env.local` (not the database):

```bash
# Format: email:password:name:role (comma-separated)
HR_USERS="hr@thuishaven.nl:changeme:HR Thuishaven:ADMIN,finance@thuishaven.nl:changeme:Finance:HR"
```

```typescript
// NextAuth.js with env-based credentials
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { findHRUser } from './hr-users';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        const user = findHRUser(credentials.email, credentials.password);
        if (!user) return null;
        return { id: user.email, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
});
```

---

## Email Notifications

Using Brevo for transactional emails:

```typescript
// lib/email/send-alert.ts
import * as brevo from '@getbrevo/brevo';

interface AlertEmailData {
  type: 'warning' | 'urgent';
  employee: { firstName: string; lastName: string };
  shiftCount: number;
}

export async function sendAlertEmail(data: AlertEmailData) {
  // Brevo transactional email
  // Warning at 3 shifts, urgent block at 4 shifts
}
```

---

## Environment Variables

```bash
# .env.local

# Database (Vercel Postgres)
DATABASE_URL="postgres://..."
DATABASE_URL_UNPOOLED="postgres://..."

# Auth
AUTH_SECRET="..."
AUTH_URL="https://form.thuishaven.nl"
HR_USERS="hr@thuishaven.nl:changeme:HR Thuishaven:ADMIN"

# Encryption
ENCRYPTION_KEY="..." # 64 hex chars (32 bytes)

# Brevo
BREVO_API_KEY="..."
HR_ALERT_EMAIL="hr@thuishaven.nl"

# App
NEXT_PUBLIC_URL="https://form.thuishaven.nl"
```

---

## Deployment

### Vercel Project Setup

```bash
pnpm add -g vercel@latest
vercel link
vercel deploy --prod
```

### Domain Configuration

| Environment | Domain |
|-------------|--------|
| Production | form.thuishaven.nl |
| Preview | form-*.vercel.app |

### Database Migrations

```bash
pnpm prisma migrate dev --name init
pnpm prisma migrate deploy
```

---

## Delivery Timeline

| Day | Deliverable |
|-----|-------------|
| 1 | Project setup, database schema, form UI with signature pad |
| 2 | Form validation, submission logic, employee deduplication, pay calc |
| 3 | PDF generation, shift counter, alerts |
| 4 | HR dashboard: daily overview, per-person view, alerts |
| 5 | Testing, documentation, deployment, handover |
