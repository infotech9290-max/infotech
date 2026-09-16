# Codebase & Architecture Analysis Report

**Date**: 2026-09-14T19:30:00Z  
**Explorer**: Explorer 1 (Codebase & Architecture Explorer)  
**Target Repository**: `C:\Users\satya\Desktop\New folder\admin-portal`  
**Reference Requirement**: `C:\Users\satya\Desktop\New folder\admin-portal\.agents\ORIGINAL_REQUEST.md`

---

## 1. Executive Summary

The project is an **Admission Portal** built with **Next.js 16.3.5 (App Router)** and **React 19.2.8**, utilizing **Tailwind CSS v4** (`@tailwindcss/postcss`) and an experimental shadcn preset based on **`@base-ui/react` (v1.8.0)** ("base-nova" style).

The application currently has working baseline routes for an Admin Portal (`/admin/dashboard`, `/admin/dashboard/workers`, `/admin/dashboard/settings`, `/admin/dashboard/footprints`) and a Worker Portal (`/worker/login`, `/worker/admission`), alongside a public landing page (`/`).

### Gap Analysis Against Target Requirements:
| Requirement | Target Requirement (ORIGINAL_REQUEST.md) | Current Baseline Status | Key Gaps to Implement |
| :--- | :--- | :--- | :--- |
| **R1: Dashboard Metrics & Mobile-First List** | 6-card metrics grid (Total Students, Action Needed, In Process, Enrolled, Rejected, Cancelled) in pastel background colors. Responsive student list (card-based layout on mobile showing Name, Status Badge, ID, Course, Marks; desktop table/card). | 3-card metrics grid (Total Admissions, Active Workers, Today's Revenue) with blue/amber/emerald borders. Desktop-only standard `<table>` in an overflow container. | Replace 3-card grid with 6 pastel cards; add mobile card-based rendering for students with Name, Status Badge, ID, Course, Marks; keep desktop table or hybrid card view. |
| **R2: 3-Step Admission Wizard** | 3-step wizard with top progress bar: 1. Student Details (Personal, Academic, Course, Single PDF Upload); 2. Fee Details; 3. Review & Submit. Inline validation (e.g. red "Name required" alert at top). | 2-step manual form in `src/app/worker/admission/page.tsx` (Step 1: Details, Step 2: Payment, Step 3: Success card). No top progress indicator. Native required alert only. | Implement 3-step wizard with persistent top progress bar; restructure steps to match: Details (with PDF upload) -> Fee Details -> Review & Submit; add top banner/inline error alerts. |
| **R3: Student Profile with Tabs** | Tabbed modal/view with `Fees \| Documents \| Payments`. Fees tab with summary card (Total, Discount, Net, Paid, Balance) & installment timeline. Payments tab with transaction cards, UTR, bank details, "View Screenshot" button, "Verified" badge. Documents tab with file preview. | `Dialog` in `admin/dashboard/page.tsx` shows fixed 2-column layout (Left: Academics & Worker; Right: Payment details & photo placeholder). No tabs. | Introduce `Tabs` UI primitive; split dialog/view into `Fees`, `Documents`, and `Payments` tabs; add fee breakdown card, installment timeline, and detailed payment history card. |

---

## 2. Technology Stack & Dependencies

### Core Framework & Runtime
- **Next.js**: `16.3.5` (App Router enabled, Turbopack default engine).
- **React / React-DOM**: `19.2.8` (React 19 Server & Client Components).
- **TypeScript**: `^5` (Strict mode enabled, target ES2017, moduleResolution `bundler`).

### Styling & Design System
- **Tailwind CSS**: `v4.0` (`tailwindcss: ^4`, `@tailwindcss/postcss: ^4`, `postcss.config.mjs`).
  - Configuration uses modern Tailwind v4 `@theme inline` in `src/app/globals.css` (no separate `tailwind.config.js`).
  - Semantic OKLCH design tokens for backgrounds, cards, popovers, borders, rings, charts, and sidebar.
  - CSS animations powered by `tw-animate-css: ^1.4.0`.
- **Icons**: `lucide-react: ^1.46.0`.
- **Motion**: `framer-motion: ^13.3.0`.
- **Class Utilities**: `clsx: ^2.1.1`, `tailwind-merge: ^3.7.0`, `class-variance-authority: ^0.7.1`, `cn: ^0.3.0`.

### UI Component Primitives
- **shadcn / Base UI**: `components.json` specifies style `"base-nova"` using unstyled primitives from **`@base-ui/react: ^1.8.0`**.
- Primitives currently implemented under `src/components/ui/`:
  - `button.tsx` (Base UI `ButtonPrimitive`, CVA variants: `default`, `outline`, `secondary`, `ghost`, `destructive`, `link`; sizes: `default`, `xs`, `sm`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`).
  - `card.tsx` (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter`).
  - `dialog.tsx` (Base UI `DialogPrimitive` with Overlay, Content, Header, Footer, Title, Description, Close).
  - `input.tsx` (Base UI `InputPrimitive`).
  - `label.tsx` (Styled HTML `<label>`).
  - `select.tsx` (Base UI `SelectPrimitive` with Portal, Positioner, Content, Group, Item, Indicator).
  - `table.tsx` (`Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`).
  - `toast.tsx` (Base UI `ToastPrimitive` with `ToastProvider`, `Toaster`, `ToastViewport`, `createToastManager`).

### Data & Forms
- **Forms & Validation**: `react-hook-form: ^7.88.0`, `@hookform/resolvers: ^5.9.1`, `zod: ^4.6.5`.
- **Database Client**: `@supabase/supabase-js: ^2.116.0` (initialized in `src/utils/supabaseClient.ts`).
- **Client Utilities**: `browser-image-compression: ^2.0.2` (used in `src/utils/compressImage.ts`).

---

## 3. Directory & File Structure

```
admin-portal/
├── .agents/                    # Agent metadata & reports
├── .next/                      # Next.js build cache & compiled artifacts
├── public/                     # Static SVG assets (file, globe, next, vercel, window)
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── dashboard/
│   │   │   │   ├── footprints/
│   │   │   │   │   └── page.tsx        # Security & audit logs page
│   │   │   │   ├── settings/
│   │   │   │   │   └── page.tsx        # Payment UPI & Bank settings page
│   │   │   │   ├── workers/
│   │   │   │   │   └── page.tsx        # Manage workers & invite dialog
│   │   │   │   ├── layout.tsx          # Admin layout (Desktop sidebar + Mobile horizontal nav)
│   │   │   │   └── page.tsx            # Main Admin Overview (Stats & Admissions Tracker)
│   │   │   └── login/
│   │   │       └── page.tsx            # Admin multi-stage login (Email/Pass + OTP)
│   │   ├── worker/
│   │   │   ├── admission/
│   │   │   │   └── page.tsx            # Worker student admission form
│   │   │   └── login/
│   │   │       └── page.tsx            # Worker Supabase login
│   │   ├── favicon.ico
│   │   ├── globals.css                 # Tailwind v4 theme, OKLCH variables, base styles
│   │   ├── layout.tsx                  # Root HTML layout with Geist font
│   │   └── page.tsx                    # Landing page with Framer Motion animations
│   ├── components/
│   │   └── ui/                         # Base UI / shadcn design system components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── select.tsx
│   │       ├── table.tsx
│   │       └── toast.tsx
│   ├── lib/
│   │   └── utils.ts                    # Utility re-export: `export { cn } from "cn"`
│   ├── services/                       # (Empty directory - ready for modular services)
│   ├── types/                          # (Empty directory - ready for shared TypeScript models)
│   ├── utils/
│   │   ├── compressImage.ts            # Client-side image compression via browser-image-compression
│   │   ├── generateID.ts               # Student ID generation format: `STU-<timestamp36>-<rand4>`
│   │   └── supabaseClient.ts           # Supabase JS client factory
│   └── middleware.ts                   # Edge route guard matching `/admin/:path*`
├── components.json                     # Shadcn configuration (base-nova, lucide, @/ aliases)
├── eslint.config.mjs                   # ESLint 9 flat config
├── next.config.ts                      # Next.js configuration
├── package.json                        # NPM package manifest
├── postcss.config.mjs                  # PostCSS plugins (@tailwindcss/postcss)
├── supabase_schema.sql                 # SQL DDL for profiles, workers, settings, admissions, audit_logs
└── tsconfig.json                       # TypeScript compiler options
```

---

## 4. Routing & Page Architecture

The project strictly follows the **Next.js App Router** convention.

### Route Inventory
1. **`/` (`src/app/page.tsx`)**:
   - Client Component (`'use client'`).
   - Dark theme (`bg-slate-950`), Framer Motion floating shapes, Call-to-Action to `/worker/login`.
2. **`/admin/login` (`src/app/admin/login/page.tsx`)**:
   - Two-phase authentication form:
     - Phase 1: `LOGIN` (email & password).
     - Phase 2: `OTP` (6-digit PIN input with letter spacing).
   - Routes to `/admin/dashboard` upon verification.
3. **`/admin/dashboard` (`src/app/admin/dashboard/layout.tsx` + `page.tsx`)**:
   - **Layout (`layout.tsx`)**: Responsive wrapper. On desktop: fixed left sidebar (`w-64`). On mobile: horizontal scrollable pill bar (`hide-scrollbar`). Links to Dashboard, Manage Workers, Settings, Footprints.
   - **Page (`page.tsx`)**: Primary admission metrics and table tracker.
     - Metrics: 3 stat cards (`Total Admissions: 1,248`, `Active Workers: 12`, `Today's Revenue: ₹45,000`).
     - Table: Desktop table of student records with worker attribution and payment method.
     - Profile Dialog: Dialog modal with academic details and payment screenshot placeholder.
4. **`/admin/dashboard/workers` (`src/app/admin/dashboard/workers/page.tsx`)**:
   - List of workers, status badges (`ACTIVE`, `INVITED`), and an invite modal to generate claim PINs.
5. **`/admin/dashboard/settings` (`src/app/admin/dashboard/settings/page.tsx`)**:
   - Configuration for UPI ID (`boss@icici`), merchant QR code upload, and HDFC Bank details.
6. **`/admin/dashboard/footprints` (`src/app/admin/dashboard/footprints/page.tsx`)**:
   - Audit trail showing admin logins, worker unauthorized access blocks, and configuration modifications.
7. **`/worker/login` (`src/app/worker/login/page.tsx`)**:
   - Authenticates against Supabase `signInWithPassword`, redirects to `/worker/admission`.
8. **`/worker/admission` (`src/app/worker/admission/page.tsx`)**:
   - 2-step form:
     - Step 1: Student Name, photo upload with auto-compression, 10th marks & year.
     - Step 2: Payment method (UPI/QR/Bank), dynamic QR preview, UTR number, screenshot upload.
     - Step 3: Success confirmation displaying generated student ID.

### Middleware
- **`src/middleware.ts`**:
  - Configured with `matcher: ['/admin/:path*']`.
  - Currently acts as a passthrough stub (`NextResponse.next()`) with a note that token checking will be added.
  - **Next.js 16 Notice**: Next 16 outputs a deprecation warning: `"The 'middleware' file convention is deprecated. Please use 'proxy' instead."`

---

## 5. Build, Dev, Lint & Test Tooling Assessment

| Command | Status | Details & Observations |
| :--- | :--- | :--- |
| `npm run dev` | Available | Runs `next dev` with Turbopack. |
| `npm run build` | **PASSED** (Exit 0) | Turbopack compilation succeeded in ~23.7s; TypeScript validation completed cleanly in 8.0s; generated 7 static routes. |
| `npm run lint` | **FAILED** (Exit 1) | ESLint 9 flat config found 2 errors and 5 warnings:<br>• **Error 1**: `src/app/admin/dashboard/page.tsx:64:103` — Unescaped apostrophe in `"Today's Revenue"` (`react/no-unescaped-entities`).<br>• **Error 2**: `src/app/worker/admission/page.tsx:113:77` — Unescaped apostrophe in `"Boss's Official QR Code"` (`react/no-unescaped-entities`).<br>• **Warnings**: Unused `Button` in `admin/dashboard/page.tsx:6`, unused `supabase` in `admin/login/page.tsx:8`, unused `photo` in `worker/admission/page.tsx:15`, unused `data` in `worker/login/page.tsx:25`, unused `request` in `middleware.ts:4`. |
| `npm test` | **MISSING** | No test script configured in `package.json`. No test runners (Vitest, Jest, Playwright) installed. |

---

## 6. Design System, Color Scheme & Styling

### Tailwind v4 Setup
- Tailwind 4 does not use `tailwind.config.js`. Instead, theme variables and variant overrides are declared in `src/app/globals.css`:
  - `@import "tailwindcss";`
  - `@import "tw-animate-css";`
  - `@import "shadcn/tailwind.css";`
  - `@custom-variant dark (&:is(.dark *));`
  - `@theme inline { ... }`
- Color tokens are defined in **OKLCH format** under `:root` and `.dark`.

### Color Palette for Pastel Metrics Cards (Requirement R1)
The reference requirement mandates **6 pastel background cards**:
1. **Total Students**: Pastel Blue / Indigo (`bg-blue-50`, `border-blue-200`, `text-blue-900`)
2. **Action Needed**: Pastel Amber / Orange (`bg-amber-50`, `border-amber-200`, `text-amber-900`)
3. **In Process**: Pastel Purple / Violet (`bg-purple-50`, `border-purple-200`, `text-purple-900`)
4. **Enrolled**: Pastel Emerald / Green (`bg-emerald-50`, `border-emerald-200`, `text-emerald-900`)
5. **Rejected**: Pastel Rose / Red (`bg-rose-50`, `border-rose-200`, `text-rose-900`)
6. **Cancelled**: Pastel Slate / Gray (`bg-slate-100`, `border-slate-200`, `text-slate-800`)

---

## 7. Component Library Inventory & Missing Primitives

### Existing Components in `src/components/ui/`
1. `button.tsx`: Full CVA button with Base UI primitive.
2. `card.tsx`: Modular card structure with CSS variables (`--card-spacing`).
3. `dialog.tsx`: Base UI dialog modal with accessible backdrop, portal, and close button.
4. `input.tsx`: Styled text/file/number input with outline focus ring.
5. `label.tsx`: Form label with disabled state handling.
6. `select.tsx`: Base UI select dropdown with scroll buttons and portal.
7. `table.tsx`: Responsive table wrapper and semantic markup.
8. `toast.tsx`: Toast provider and toast manager.

### Required Primitives & Components to Add
1. **`tabs.tsx`**:
   - Currently absent from `src/components/ui/`.
   - `@base-ui/react` contains `Tabs` primitive (`Tabs.Root`, `Tabs.List`, `Tabs.Tab`, `Tabs.Panel`).
   - Essential for **R3 (Student Profile with Fees | Documents | Payments tabs)**.
2. **`badge.tsx`**:
   - Currently absent; status badges are styled ad-hoc with inline Tailwind spans.
   - Essential for **R1 (Status badges on mobile cards: In Process, Enrolled, Rejected, Cancelled, Action Needed)** and **R3 (Verified badge)**.
3. **`progress.tsx`**:
   - `@base-ui/react` contains `Progress` primitive, or a custom step indicator can be used.
   - Essential for **R2 (3-Step top progress bar)**.
4. **Shared Student Card Component (`student-card.tsx`)**:
   - Mobile-first card layout showing Name, Status Badge, ID, Course, and Marks.

---

## 8. Data Architecture & Mock Data Alignment

### Existing Data Models
- **Database Schema (`supabase_schema.sql`)**:
  - `profiles`: `id`, `role ('ADMIN' | 'WORKER')`, `name`, `email`, `created_at`.
  - `workers`: `id`, `user_id`, `added_by`, `status ('INVITED' | 'ACTIVE' | 'INACTIVE')`, `invite_pin`, `created_at`.
  - `settings`: `id`, `upi_id`, `qr_image_url`, `bank_account`, `bank_ifsc`, `bank_name`, `updated_at`.
  - `admissions`: `id`, `unique_id`, `worker_id`, `student_name`, `photo_url`, `tenth_school`, `tenth_marks`, `tenth_year`, `twelfth_details`, `graduation_course`, `graduation_session`, `payment_method`, `payment_utr`, `payment_screenshot_url`, `created_at`.
  - `audit_logs`: `id`, `admin_id`, `action`, `device_info`, `ip_address`, `created_at`.

### Existing In-Memory Mock Data (`src/app/admin/dashboard/page.tsx:9-36`)
```typescript
const ADMISSIONS_DATA = [
  {
    id: 'STU-9X82-KPL',
    name: 'Rahul Sharma',
    workerName: 'Ramesh Kumar',
    workerEmail: 'ramesh@company.com',
    date: '14 Oct 2026, 10:30 AM',
    paymentMethod: 'UPI QR',
    utr: 'UPI-329482930192',
    tenth: '85% (2018)',
    twelfth: '78% (2020)',
    grad: 'BCA (2020-2023)',
    status: 'Verified'
  },
  ...
];
```

### Mock Data Enhancement Plan for R1, R2, R3:
To properly support the 6 status categories and comprehensive financial profile:
1. Extend `status` enum: `'Enrolled' | 'Action Needed' | 'In Process' | 'Rejected' | 'Cancelled'`.
2. Add Course & Marks fields to the top-level student object: `course: 'BCA' | 'B.Tech' | 'MBA' | 'B.Sc'`, `marks: '85%'`.
3. Add Fees & Payments profile structure:
   - Fee Summary: `totalFee: 120000`, `discount: 15000`, `netFee: 105000`, `paid: 45000`, `balanceDue: 60000`.
   - Installment Schedule: Array of installments with `installmentNumber`, `dueDate`, `amount`, `status ('Paid' | 'Upcoming' | 'Overdue')`.
   - Payment History: Array of transactions with `transactionId`, `amount`, `date`, `method`, `utr`, `bankDetails`, `screenshotUrl`, `verified: true`.
   - Documents: Array of documents with `name`, `type ('pdf' | 'image')`, `size`, `uploadDate`, `url`.

---

## 9. Concrete Recommendations for Implementation Team

1. **Fix Existing Linter Errors First**:
   - Replace unescaped apostrophes (`Today&apos;s` and `Boss&apos;s`) so `npm run lint` passes cleanly.
   - Clean up unused variable warnings in affected files.

2. **Add Missing UI Primitives**:
   - Create `src/components/ui/tabs.tsx` using `@base-ui/react/tabs` or headless tabs.
   - Create `src/components/ui/badge.tsx` with CVA variants (`default`, `secondary`, `destructive`, `outline`, `success`, `warning`, `info`, `in-process`).
   - Create a reusable step progress indicator component (`src/components/ui/step-progress.tsx`).

3. **Refactor Dashboard (`src/app/admin/dashboard/page.tsx`)**:
   - Replace the 3-card metrics grid with the 6 pastel category cards: Total Students, Action Needed, In Process, Enrolled, Rejected, Cancelled.
   - Implement responsive student list:
     - On mobile (`block md:hidden`): Card-based layout with Name, Status Badge, ID, Course, and Marks.
     - On desktop (`hidden md:block`): Clean desktop table or enhanced grid.
   - Refactor Student Details modal into a 3-tab layout:
     - **Tab 1: Fees** (Total Fee, Discount, Net Fee, Paid, Balance Due summary card + Installment Timeline schedule).
     - **Tab 2: Documents** (Single PDF / Academic certificates list and preview).
     - **Tab 3: Payments** (Transaction cards with Amount, Date, UTR, Bank details, "Verified" badge, "View Payment Screenshot" modal/preview).

4. **Refactor / Implement 3-Step Admission Wizard**:
   - Build or update the wizard (in `src/app/worker/admission/page.tsx` and/or as an "Add Student" modal/page accessible from dashboard):
     - Step 1: Student Details (Personal, Academic, Course selection, Single PDF document upload).
     - Step 2: Fee Details (Tuition fee, discounts, installment options, payment mode).
     - Step 3: Review & Submit (Summary overview, declaration, submission confirmation).
   - Add persistent top progress bar displaying 3 active/completed steps.
   - Add inline validation banner (e.g., top alert: "Name is required" when submitted with missing fields).
