# Dispatch: Worker Milestone 1 (Foundation & R1 Dashboard)

## Identity
- Role: Implementation Worker (Milestone 1)
- Type: teamwork_preview_worker
- Working Directory: C:\Users\satya\Desktop\New folder\admin-portal\.agents\worker_m1

## Mandatory Documents
- Read Original Request at: `C:\Users\satya\Desktop\New folder\admin-portal\.agents\ORIGINAL_REQUEST.md`
- Read Project Scope at: `C:\Users\satya\Desktop\New folder\admin-portal\.agents\PROJECT.md`
- Read Architectural Blueprint at: `C:\Users\satya\Desktop\New folder\admin-portal\.agents\explorer_survey_2\analysis.md`

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Write Ownership
You have exclusive write ownership of the following files:
- `src/types/student.ts`
- `src/data/mockStudents.ts`
- `src/components/ui/badge.tsx`
- `src/components/dashboard/StatusBadge.tsx`
- `src/components/dashboard/StudentMobileCard.tsx`
- `src/components/dashboard/MetricsGrid.tsx`
- `src/components/dashboard/StudentList.tsx`
- `src/app/admin/dashboard/page.tsx`

## Scope of Work (Milestone 1: R1 Dashboard Metrics & Mobile-First List)
1. **Core Data Models (`src/types/student.ts`)**:
   - Create unified TypeScript interfaces: `StudentStatus` (`'Action Needed' | 'In Process' | 'Enrolled' | 'Rejected' | 'Cancelled'`), `Student`, `FeeSummary`, `InstallmentRecord`, `PaymentRecord`, `DocumentRecord`.
2. **Mock Data Engine (`src/data/mockStudents.ts`)**:
   - Create 10–12 realistic student records covering all 6 statuses, complete with fees, installments, payments, and document records.
3. **UI Badge (`src/components/ui/badge.tsx`)**:
   - Create accessible badge primitive supporting variants: `default`, `secondary`, `outline`, `destructive`.
4. **Status Badge (`src/components/dashboard/StatusBadge.tsx`)**:
   - Create pastel pill badges for each of the 6 statuses:
     - Enrolled: emerald pastel (`bg-emerald-50 text-emerald-700 border-emerald-200`)
     - Action Needed: amber pastel (`bg-amber-50 text-amber-700 border-amber-200`)
     - In Process: purple pastel (`bg-purple-50 text-purple-700 border-purple-200`)
     - Rejected: rose pastel (`bg-rose-50 text-rose-700 border-rose-200`)
     - Cancelled: slate pastel (`bg-slate-100 text-slate-700 border-slate-200`)
5. **6-Card Pastel Metrics Grid (`src/components/dashboard/MetricsGrid.tsx`)**:
   - 6 cards: Total Students, Action Needed, In Process, Enrolled, Rejected, Cancelled.
   - Distinct pastel backgrounds: `bg-blue-50`, `bg-amber-50`, `bg-purple-50`, `bg-emerald-50`, `bg-rose-50`, `bg-slate-100`.
   - Dynamic counts computed from students array.
   - Interactive click-to-filter behavior (clicking a metric card filters the student list).
   - Responsive grid: 2 cols on mobile, 3 cols on tablet, 6 cols on desktop (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-6`).
6. **Mobile Card Layout (`src/components/dashboard/StudentMobileCard.tsx`)**:
   - Mobile card view (<768px, `block md:hidden`).
   - Must prominently show: Name, Status Badge, ID (`#STU-...`), Course, and Marks.
   - Includes "View Profile" button to trigger student details.
7. **Student List Container (`src/components/dashboard/StudentList.tsx`)**:
   - Integrates search query and status filter tabs/pills.
   - Renders `StudentMobileCard` list on mobile (`block md:hidden`).
   - Renders enhanced responsive table on desktop (`hidden md:block`).
8. **Dashboard Page Integration (`src/app/admin/dashboard/page.tsx`)**:
   - Integrate `MetricsGrid` and `StudentList`.
   - Fix unescaped entity (`Today's` -> `&apos;` or use new title).
   - Retain or wire `setSelectedStudent` for student details.

## Verification Requirements
- Execute `npm run build` and ensure exit code 0 with clean Turbopack compilation.
- Execute `npm run lint` and ensure no errors in modified files.
- Document all executed commands, build logs, and verification results in `C:\Users\satya\Desktop\New folder\admin-portal\.agents\worker_m1\handoff.md`.
- Send completion message to orchestrator.
