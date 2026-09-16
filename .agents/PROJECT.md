# Project: Admission Portal UI Refactoring (Mobile-First Premium CRM)

## Architecture
- **Framework**: Next.js 16.3.5 (App Router, Turbopack) + React 19.2.8 + TypeScript 5
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`) + OKLCH design tokens + Lucide icons
- **State & Data**: Client-side reactive state with shared TypeScript models and rich mock dataset
- **Component Architecture**:
  - `src/types/student.ts`: Unified interfaces (`Student`, `StudentStatus`, `FeeSummary`, `InstallmentRecord`, `PaymentRecord`, `DocumentRecord`)
  - `src/data/mockStudents.ts`: 12 realistic student records covering all 6 statuses (`Action Needed`, `In Process`, `Enrolled`, `Rejected`, `Cancelled`)
  - `src/components/dashboard/`: `MetricsGrid`, `StatusBadge`, `StudentMobileCard`, `StudentList`
  - `src/components/admission/`: `TopProgressBar`, `FormErrorAlert`, `StepStudentDetails`, `StepFeeDetails`, `StepReviewSubmit`, `AdmissionWizard`
  - `src/components/profile/`: `FeesTab`, `DocumentsTab`, `PaymentsTab`, `PaymentScreenshotModal`, `StudentProfileModal`

## Code Layout
- **Types**: `src/types/student.ts`
- **Data**: `src/data/mockStudents.ts`
- **UI Primitives**: `src/components/ui/` (`badge.tsx`, `progress.tsx`, `tabs.tsx`)
- **Dashboard Components**: `src/components/dashboard/`
- **Admission Wizard Components**: `src/components/admission/`
- **Student Profile Components**: `src/components/profile/`
- **App Routes**:
  - `src/app/admin/dashboard/page.tsx` (Dashboard Overview)
  - `src/app/worker/admission/page.tsx` (Worker Admission Wizard)

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Core Types & Mock Data Engine | Shared TypeScript contracts (`Student`, `FeeSummary`, etc.) and 12-student dataset across all 6 statuses | M1 | Survey |
| 2 | 6-Card Pastel Metrics Grid | Total Students, Action Needed, In Process, Enrolled, Rejected, Cancelled with dynamic counts and pastel backgrounds | M1 | R1 |
| 3 | Mobile-First Student List | Responsive cards on mobile (<768px) showing Name, Status Badge, ID, Course, Marks; desktop table | M1 | R1 |
| 4 | Top 3-Step Progress Indicator | Visual step indicator with active/completed states and progress connectors | M2 | R2 |
| 5 | Inline Validation & Alerts | Red "Name required" alert banner at top + field border highlights | M2 | R2 |
| 6 | Step 1: Student Details & PDF | Personal, Academic (10th/12th), Course dropdown, Single PDF Upload, Photo compression | M2 | R2 |
| 7 | Step 2: Fee Details & Calculations | Total Fee, Discount, Net Fee auto-calc, Down Payment, Balance Due auto-calc, Payment Method & Screenshot | M2 | R2 |
| 8 | Step 3: Review & Submit | Pre-submission review cards, declaration check, submission loader, Unique ID generator | M2 | R2 |
| 9 | Student Profile Tabbed Dialog | Single controlled dialog with hero header and `Fees \| Documents \| Payments` tabs | M3 | R3 |
| 10 | Fees Tab & Installment Timeline | 5-metric financial summary card (Total, Discount, Net, Paid, Due) + installment timeline | M3 | R3 |
| 11 | Documents Tab (Single PDF Dossier) | Single PDF preview/download card, metadata (size, upload date), credentials checklist | M3 | R3 |
| 12 | Payments Tab & Screenshot Lightbox | Itemized transaction cards with Amount, Date, UTR copy, Bank Details, "Verified" badge, Screenshot lightbox | M3 | R3 |
| 13 | ESLint Cleanliness & Build Stability | Clean linting, unused variables removed, zero lint/build errors | M4 | Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: Foundation & Dashboard (R1) | Types, Mock Data, 6-Card Pastel Metrics Grid, Mobile-First Student List | none | DONE |
| 2 | M2: 3-Step Admission Wizard (R2) | Progress Bar, Inline Validation, Step 1 (Personal/Academic/Course/PDF), Step 2 (Fees), Step 3 (Review) | M1 | DONE |
| 3 | M3: Tabbed Student Profile (R3) | Tabbed Profile (`Fees \| Documents \| Payments`), 5-Metric Fee Card, Timeline, Verified Payment Cards | M1 | DONE |
| 4 | M4: Quality Hardening & E2E Validation | ESLint fixes, end-to-end integration, production build verification | M1, M2, M3 | DONE |

## Interface Contracts
### Types ↔ Components
- `Student`: `id: string`, `name: string`, `email: string`, `phone: string`, `course: string`, `status: StudentStatus`, `marks: { tenth: string, twelfth: string }`, `worker: { name: string, email: string }`, `fees: FeeSummary`, `installments: InstallmentRecord[]`, `payments: PaymentRecord[]`, `documents: DocumentRecord[]`
- `StudentStatus`: `'Action Needed' | 'In Process' | 'Enrolled' | 'Rejected' | 'Cancelled'`
- `FeeSummary`: `totalFee: number`, `discount: number`, `netFee: number`, `paidAmount: number`, `balanceDue: number`
