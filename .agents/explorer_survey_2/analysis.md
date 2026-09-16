# Technical Investigation Report: Dashboard Metrics & Student List (R1)

**Role**: Explorer 2 (Dashboard & Student List Explorer)  
**Date**: 2026-09-14T19:22:00Z  
**Project**: Next.js Admission Portal Refactor  
**Integrity Mode**: development  
**Scope**: Dashboard Overview, 6-Card Metrics Grid, Student List (Mobile Cards & Desktop Table), Student Data Model & State Management  

---

## 1. Executive Summary

The current Next.js Admission Portal features a preliminary administrative dashboard at `src/app/admin/dashboard/page.tsx` that relies on hardcoded data, displays only 3 administrative metrics (Total Admissions, Active Workers, Today's Revenue), and renders a desktop-only HTML table with `min-w-[600px]` requiring clumsy horizontal scrolling on mobile viewports.

To fulfill **Requirement R1** and achieve a premium mobile-first CRM experience matching the reference design:
1. **6-Card Pastel Metrics Grid**: Replace the 3 hardcoded operational cards with a 6-card metrics grid representing the core student lifecycle stages: **Total Students**, **Action Needed**, **In Process**, **Enrolled**, **Rejected**, and **Cancelled**. Each card will use distinct pastel background colors, soft matching borders, dedicated Lucide icons, and interactive click-to-filter capability.
2. **Mobile Card-Based Student List**: Implement a dual-layout responsive list. On mobile devices (`< 768px`), students will be rendered as clean, touch-friendly cards displaying **Name**, **Status Badge**, **ID**, **Course**, and **Marks**, completely eliminating horizontal overflow. On desktop screens (`>= 768px`), an enhanced high-density table will present all key student details with clear status badges and quick profile triggers.
3. **Structured Data Model & Realistic Mock State**: Expand the data model from a 2-record dummy array to a robust TypeScript `Student` interface that supports all 6 statuses, academic history, course selections, fee summaries, installments, and payment transactions (coordinating seamlessly with R2 and R3).

---

## 2. Existing Codebase Analysis

### 2.1 File Location & Structure
- **Dashboard Page**: `src/app/admin/dashboard/page.tsx` (184 lines)
- **Dashboard Layout**: `src/app/admin/dashboard/layout.tsx` (34 lines)
- **UI Components Available**: `src/components/ui/{button, card, dialog, input, label, select, table, toast}.tsx`
- **Global Styles & Theme**: `src/app/globals.css` (Tailwind v4 with `@theme inline` and OKLCH color system)
- **Database Schema**: `supabase_schema.sql` (defines `admissions` table, but lacks status tracking and fee breakdown)

### 2.2 Existing Dashboard Metrics Implementation
At lines 45–70 of `src/app/admin/dashboard/page.tsx`:
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <Card className="border-l-4 border-l-blue-500 shadow-sm">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Admissions</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-4xl font-bold text-slate-800">1,248</div>
    </CardContent>
  </Card>
  <Card className="border-l-4 border-l-amber-500 shadow-sm">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Active Workers</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-4xl font-bold text-slate-800">12</div>
    </CardContent>
  </Card>
  <Card className="border-l-4 border-l-emerald-500 shadow-sm">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Today's Revenue</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-4xl font-bold text-emerald-600">₹45,000</div>
    </CardContent>
  </Card>
</div>
```

#### Deficiencies in Existing Metrics:
| Aspect | Existing Implementation | Requirement R1 Gap |
|---|---|---|
| **Card Count** | 3 cards | Requires exactly 6 cards |
| **Categories** | Total Admissions, Active Workers, Today's Revenue | Must be: Total Students, Action Needed, In Process, Enrolled, Rejected, Cancelled |
| **Data Binding** | Hardcoded strings (`1,248`, `12`, `₹45,000`) | Must dynamically compute from student dataset |
| **Visual Design** | Plain white card with left border stripe (`border-l-4`) | Must use soft pastel backgrounds with tinted borders and icon containers |
| **Interactivity** | Completely static (clicking does nothing) | Clicking should filter the student list by status |
| **Responsive Grid** | `grid-cols-1 md:grid-cols-3` (takes 3 full vertical blocks on mobile) | Responsive 2-column mobile layout (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-6`) |

---

### 2.3 Existing Student List Implementation
At lines 72–180 of `src/app/admin/dashboard/page.tsx`:
```tsx
<Card className="shadow-md border-slate-200">
  <CardHeader className="bg-slate-50 border-b">
    <CardTitle className="text-xl">Student Admissions Tracker</CardTitle>
    <CardDescription>Track every student and the exact worker who brought them.</CardDescription>
  </CardHeader>
  <CardContent className="p-0">
    <div className="overflow-x-auto w-full">
      <Table className="min-w-[600px]">
        <TableHeader className="bg-slate-100">
          <TableRow>
            <TableHead className="font-semibold text-slate-700">Student ID & Name</TableHead>
            <TableHead className="font-semibold text-slate-700">Admitted By (Worker)</TableHead>
            <TableHead className="font-semibold text-slate-700">Payment Type</TableHead>
            <TableHead className="font-semibold text-slate-700">Date</TableHead>
            <TableHead className="font-semibold text-right text-slate-700">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ADMISSIONS_DATA.map((student) => ( ... ))}
        </TableBody>
      </Table>
    </div>
  </CardContent>
</Card>
```

#### Deficiencies in Existing Student List:
1. **No Mobile Layout**: Only a standard table inside `overflow-x-auto min-w-[600px]`. On mobile viewports (320px–480px), users are forced to horizontally pan back and forth. Critical actions ("View Details") are buried off-screen.
2. **Missing Essential Fields**:
   - **Status Badge**: Despite `status: 'Verified'` and `status: 'Pending'` existing in the mock object, neither is rendered in any table column!
   - **Course**: Not displayed as an independent column (only implicitly buried in `grad: 'BCA (2020-2023)'`).
   - **Marks**: Neither 10th nor 12th marks are displayed in the list view; users must open the modal to see grades.
3. **No Filtering or Search Controls**: No search bar, no status dropdown, no date filter, and no pagination or item counter.
4. **Embedded Dialog Anti-Pattern**: The Dialog and DialogTrigger are duplicated inside every single table row (`TableCell`), instantiating N modal trees rather than a single controlled dialog.

---

### 2.4 Existing Mock Data & State Management
Currently, lines 9–36 of `src/app/admin/dashboard/page.tsx` define a static local array:
```ts
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
  {
    id: 'STU-4M91-XCQ',
    name: 'Priya Singh',
    workerName: 'Suresh Singh',
    workerEmail: 'suresh@company.com',
    date: '14 Oct 2026, 09:15 AM',
    paymentMethod: 'Bank Transfer',
    utr: 'HDFC-NEFT-8930219',
    tenth: '92% (2019)',
    twelfth: '88% (2021)',
    grad: 'B.Tech (2021-2025)',
    status: 'Pending'
  }
];
```

#### Deficiencies in Mock Data:
- Only 2 records.
- Statuses are `'Verified'` and `'Pending'`, which do not match the 6 lifecycle states required by R1 (`Action Needed`, `In Process`, `Enrolled`, `Rejected`, `Cancelled`).
- No support for fee structures, discounts, installments, or document records needed by R2 and R3.
- No central state or service: the array is locked inside a single component file.

---

## 3. Requirement R1: Redesign Specifications

### 3.1 The 6-Card Metrics Grid

#### Category & Pastel Color Scheme:
To achieve the premium CRM look seen in modern mobile applications, each of the 6 cards should have a dedicated pastel hue, coordinating border, tinted icon container, and crisp dark text:

| # | Metric Category | Pastel Background | Border Color | Icon Container | Lucide Icon | Text Color | CRM Purpose |
|---|---|---|---|---|---|---|---|
| 1 | **Total Students** | `bg-blue-50/70` | `border-blue-200/70` | `bg-blue-100 text-blue-700` | `Users` | `text-blue-950` | Total admission records across all statuses |
| 2 | **Action Needed** | `bg-amber-50/80` | `border-amber-200/80` | `bg-amber-100 text-amber-700` | `AlertCircle` | `text-amber-950` | Requires administrative intervention (unverified UTR, missing document) |
| 3 | **In Process** | `bg-purple-50/70` | `border-purple-200/70` | `bg-purple-100 text-purple-700` | `RefreshCw` | `text-purple-950` | Undergoing verification or incomplete submission |
| 4 | **Enrolled** | `bg-emerald-50/70` | `border-emerald-200/70` | `bg-emerald-100 text-emerald-700` | `CheckCircle2` | `text-emerald-950` | Formally enrolled and verified |
| 5 | **Rejected** | `bg-rose-50/70` | `border-rose-200/70` | `bg-rose-100 text-rose-700` | `XCircle` | `text-rose-950` | Ineligible or rejected submissions |
| 6 | **Cancelled** | `bg-slate-100/70` | `border-slate-200` | `bg-slate-200 text-slate-700` | `Ban` | `text-slate-900` | Withdrawn or cancelled applications |

#### Responsive Grid Layout:
- **Mobile (`< 640px`)**: `grid-cols-2 gap-2.5`
  - Cards arrange into 3 compact rows of 2 cards each.
  - Card padding `p-3` with compact typography (`text-2xl font-bold` count, `text-xs font-semibold` label).
  - Maximizes screen efficiency and prevents excessive vertical scrolling.
- **Tablet (`640px – 1024px`)**: `grid-cols-3 gap-3.5` (2 rows of 3 cards).
- **Desktop (`>= 1024px`)**: `grid-cols-6 gap-4` (a single horizontal row of 6 pastel metric cards).
- **Tailwind Grid Class**: `grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 lg:gap-4`

#### Interactive Filtering:
- Clicking any card filters the student list below to only show students with that status.
- Clicking **Total Students** (or re-clicking an active card) resets the filter to show all students.
- Active card styling: `ring-2 ring-blue-600 ring-offset-2 shadow-sm scale-[1.02]`.

---

### 3.2 Mobile-First Card-Based Student List

#### Responsive Switching Strategy:
```tsx
{/* Mobile View: Card-Based Layout (< 768px) */}
<div className="block md:hidden space-y-3 p-3">
  {filteredStudents.map((student) => (
    <StudentMobileCard key={student.id} student={student} onSelect={() => setSelectedStudent(student)} />
  ))}
</div>

{/* Desktop View: Full Data Table (>= 768px) */}
<div className="hidden md:block overflow-x-auto w-full">
  <Table>
    ...
  </Table>
</div>
```

#### Mobile Student Card Specifications:
The mobile card MUST display the 5 required fields prominently:
1. **Name**: `font-bold text-slate-900 text-base` (with an avatar badge showing the student's initials, e.g., "RS").
2. **Status Badge**: Pill badge with pastel background and icon dot matching the status:
   - `Enrolled`: `bg-emerald-50 text-emerald-700 border border-emerald-200`
   - `Action Needed`: `bg-amber-50 text-amber-700 border border-amber-200`
   - `In Process`: `bg-purple-50 text-purple-700 border border-purple-200`
   - `Rejected`: `bg-rose-50 text-rose-700 border border-rose-200`
   - `Cancelled`: `bg-slate-100 text-slate-700 border border-slate-200`
3. **ID**: Formatted monospace badge, e.g., `#STU-9X82-KPL` (`font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded`).
4. **Course**: Clearly highlighted course tag with a book/cap icon (e.g., `GraduationCap className="w-3.5 h-3.5 text-blue-600"` + `BCA` or `B.Tech CSE`).
5. **Marks**: Visible academic performance metrics (e.g., `10th: 85% • 12th: 78%` or `85% (10th)`).

#### Additional Mobile Card Enhancements:
- **Worker Attribution**: Subtle row showing who enrolled the student (e.g., `Worker: Ramesh Kumar`).
- **Date & Fee Summary**: Submission timestamp and fee balance indication.
- **Touch-Optimized Action Button**: A full-width or tap-target button "View Full Profile" with chevron icon opening the R3 dialog.

#### Desktop Table Specifications:
Columns on `>= 768px`:
1. `Student` (Avatar, Name, and Student ID)
2. `Status` (Pastel StatusBadge)
3. `Course` (Course name & session)
4. `Marks` (10th & 12th percentages)
5. `Admitted By` (Worker pill)
6. `Payment Method / UTR` (e.g., UPI QR • UTR)
7. `Date` (e.g., 14 Oct 2026)
8. `Action` ("View Profile" Button)

---

## 4. Proposed Data Model & State Architecture

### 4.1 TypeScript Interfaces (`src/types/student.ts`)
```ts
export type StudentStatus = 
  | 'Action Needed'
  | 'In Process'
  | 'Enrolled'
  | 'Rejected'
  | 'Cancelled';

export type PaymentMethod = 'UPI' | 'UPI QR' | 'Bank Transfer' | 'Cash' | 'Card';

export interface AcademicRecord {
  tenthMarks: string;        // e.g. "85%"
  tenthYear: string;         // e.g. "2018"
  tenthSchool?: string;      // e.g. "St. Xavier's High School"
  twelfthMarks: string;      // e.g. "78%"
  twelfthYear: string;       // e.g. "2020"
  twelfthStream?: string;    // e.g. "Science (PCM)"
  graduationCourse?: string; // e.g. "BCA (2020-2023)"
}

export interface FeeSummary {
  totalFee: number;          // e.g. 120000
  discount: number;          // e.g. 15000
  netFee: number;            // 105000 (totalFee - discount)
  paidAmount: number;        // e.g. 45000
  balanceDue: number;        // 60000 (netFee - paidAmount)
}

export interface InstallmentRecord {
  id: string;
  title: string;             // e.g. "1st Installment (At Admission)"
  dueDate: string;           // e.g. "14 Oct 2026"
  amount: number;            // e.g. 45000
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  paidDate?: string;         // e.g. "14 Oct 2026, 10:30 AM"
}

export interface PaymentRecord {
  id: string;
  amount: number;            // e.g. 45000
  date: string;              // e.g. "14 Oct 2026, 10:30 AM"
  method: PaymentMethod;     // e.g. "UPI QR"
  utr: string;               // e.g. "UPI-329482930192"
  bankDetails: string;       // e.g. "HDFC Bank (Boss Official A/C)"
  screenshotUrl?: string;    // e.g. "/receipt-qr.png"
  verified: boolean;         // true -> shows green "Verified" badge
}

export interface DocumentRecord {
  id: string;
  title: string;             // e.g. "Consolidated Admission Dossier (PDF)"
  fileName: string;          // e.g. "Rahul_Sharma_Academic_Records.pdf"
  fileSize: string;          // e.g. "2.4 MB"
  uploadDate: string;        // e.g. "14 Oct 2026"
  url: string;
  type: 'PDF' | 'IMAGE';
}

export interface Student {
  id: string;                // e.g. "STU-9X82-KPL"
  name: string;              // e.g. "Rahul Sharma"
  email: string;             // e.g. "rahul.sharma@example.com"
  phone: string;             // e.g. "+91 98765 43210"
  course: string;            // e.g. "BCA"
  status: StudentStatus;     // 'Action Needed' | 'In Process' | 'Enrolled' | 'Rejected' | 'Cancelled'
  date: string;              // e.g. "14 Oct 2026, 10:30 AM"
  workerName: string;        // e.g. "Ramesh Kumar"
  workerEmail: string;       // e.g. "ramesh@company.com"
  academic: AcademicRecord;
  fees: FeeSummary;
  installments: InstallmentRecord[];
  payments: PaymentRecord[];
  documents: DocumentRecord[];
  photoUrl?: string;
}
```

### 4.2 Mock Dataset (`src/data/mockStudents.ts`)
A dedicated dataset containing 10–12 diverse student records providing representative coverage across all 6 statuses:
- **Enrolled (4 students)**: e.g. Rahul Sharma (BCA), Ananya Roy (B.Tech CSE), Sneha Nair (MCA), Vikram Malhotra (MBA)
- **Action Needed (2 students)**: e.g. Priya Singh (B.Tech, unverified bank UTR), Rohan Verma (BBA, missing fee receipt)
- **In Process (2 students)**: e.g. Amit Kumar (BCA, documents under review), Neha Gupta (B.Com, eligibility verification)
- **Rejected (1 student)**: e.g. Deepak Joshi (B.Tech, 12th marks below cutoff criteria)
- **Cancelled (1 student)**: e.g. Simran Kaur (MBA, admission withdrawn)

This ensures the metrics counts directly reflect:
- Total Students: 10
- Action Needed: 2
- In Process: 2
- Enrolled: 4
- Rejected: 1
- Cancelled: 1

### 4.3 State Management & Filtering Logic
In `src/app/admin/dashboard/page.tsx`:
```tsx
const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
const [activeStatusFilter, setActiveStatusFilter] = useState<StudentStatus | 'ALL'>('ALL');
const [searchQuery, setSearchQuery] = useState('');
const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

// Dynamic Metrics Calculation
const metrics = useMemo(() => ({
  total: students.length,
  actionNeeded: students.filter(s => s.status === 'Action Needed').length,
  inProcess: students.filter(s => s.status === 'In Process').length,
  enrolled: students.filter(s => s.status === 'Enrolled').length,
  rejected: students.filter(s => s.status === 'Rejected').length,
  cancelled: students.filter(s => s.status === 'Cancelled').length,
}), [students]);

// Filtered List
const filteredStudents = useMemo(() => {
  return students.filter(student => {
    const matchesStatus = activeStatusFilter === 'ALL' || student.status === activeStatusFilter;
    const matchesSearch = searchQuery === '' || 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.workerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });
}, [students, activeStatusFilter, searchQuery]);
```

---

## 5. Component Architecture & File Plan

To keep the codebase maintainable, modular, and cleanly decoupled:

```
src/
├── types/
│   └── student.ts                     # Type definitions for Student, Status, Fees, Payments
├── data/
│   └── mockStudents.ts                # Rich mock dataset with 10+ students across all 6 statuses
├── components/
│   ├── dashboard/
│   │   ├── MetricsGrid.tsx            # 6-card responsive pastel metrics grid with counts & click filter
│   │   ├── MetricCard.tsx             # Individual pastel metric card with icon, count, and active ring
│   │   ├── StatusBadge.tsx            # Standardized pastel pill badge for student status
│   │   ├── StudentList.tsx            # Container with search bar, count badge, and responsive switcher
│   │   ├── StudentMobileCard.tsx      # Mobile card view (< 768px) showing Name, Status, ID, Course, Marks
│   │   └── StudentDesktopTable.tsx    # Desktop table view (>= 768px) with full data density
│   └── student-profile/
│       └── StudentProfileDialog.tsx   # Detailed Profile Dialog with Fees/Docs/Payments tabs (R3)
└── app/
    └── admin/
        └── dashboard/
            └── page.tsx               # Streamlined dashboard page composing MetricsGrid + StudentList
```

---

## 6. Implementation Guidance & Code Snippets

### 6.1 `StatusBadge.tsx` Implementation
```tsx
import { cn } from '@/lib/utils';
import { StudentStatus } from '@/types/student';
import { AlertCircle, CheckCircle2, RefreshCw, XCircle, Ban } from 'lucide-react';

const STATUS_CONFIG: Record<StudentStatus, {
  label: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
  Icon: React.ComponentType<{ className?: string }>;
}> = {
  'Enrolled': {
    label: 'Enrolled',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    Icon: CheckCircle2,
  },
  'Action Needed': {
    label: 'Action Needed',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    Icon: AlertCircle,
  },
  'In Process': {
    label: 'In Process',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
    Icon: RefreshCw,
  },
  'Rejected': {
    label: 'Rejected',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
    Icon: XCircle,
  },
  'Cancelled': {
    label: 'Cancelled',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
    Icon: Ban,
  },
};

export function StatusBadge({ status, className }: { status: StudentStatus; className?: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG['In Process'];
  const { Icon } = config;

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
      config.bg, config.text, config.border, className
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  );
}
```

### 6.2 `MetricsGrid.tsx` Implementation
```tsx
import { useMemo } from 'react';
import { Student, StudentStatus } from '@/types/student';
import { Users, AlertCircle, RefreshCw, CheckCircle2, XCircle, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricsGridProps {
  students: Student[];
  activeFilter: StudentStatus | 'ALL';
  onFilterChange: (status: StudentStatus | 'ALL') => void;
}

export function MetricsGrid({ students, activeFilter, onFilterChange }: MetricsGridProps) {
  const counts = useMemo(() => ({
    total: students.length,
    actionNeeded: students.filter(s => s.status === 'Action Needed').length,
    inProcess: students.filter(s => s.status === 'In Process').length,
    enrolled: students.filter(s => s.status === 'Enrolled').length,
    rejected: students.filter(s => s.status === 'Rejected').length,
    cancelled: students.filter(s => s.status === 'Cancelled').length,
  }), [students]);

  const cards = [
    {
      id: 'ALL' as const,
      label: 'Total Students',
      count: counts.total,
      icon: Users,
      bg: 'bg-blue-50/70 hover:bg-blue-50',
      border: 'border-blue-200/80',
      text: 'text-blue-950',
      iconBox: 'bg-blue-100 text-blue-700',
      ringColor: 'ring-blue-500',
    },
    {
      id: 'Action Needed' as const,
      label: 'Action Needed',
      count: counts.actionNeeded,
      icon: AlertCircle,
      bg: 'bg-amber-50/80 hover:bg-amber-50',
      border: 'border-amber-200/80',
      text: 'text-amber-950',
      iconBox: 'bg-amber-100 text-amber-700',
      ringColor: 'ring-amber-500',
    },
    {
      id: 'In Process' as const,
      label: 'In Process',
      count: counts.inProcess,
      icon: RefreshCw,
      bg: 'bg-purple-50/70 hover:bg-purple-50',
      border: 'border-purple-200/80',
      text: 'text-purple-950',
      iconBox: 'bg-purple-100 text-purple-700',
      ringColor: 'ring-purple-500',
    },
    {
      id: 'Enrolled' as const,
      label: 'Enrolled',
      count: counts.enrolled,
      icon: CheckCircle2,
      bg: 'bg-emerald-50/70 hover:bg-emerald-50',
      border: 'border-emerald-200/80',
      text: 'text-emerald-950',
      iconBox: 'bg-emerald-100 text-emerald-700',
      ringColor: 'ring-emerald-500',
    },
    {
      id: 'Rejected' as const,
      label: 'Rejected',
      count: counts.rejected,
      icon: XCircle,
      bg: 'bg-rose-50/70 hover:bg-rose-50',
      border: 'border-rose-200/80',
      text: 'text-rose-950',
      iconBox: 'bg-rose-100 text-rose-700',
      ringColor: 'ring-rose-500',
    },
    {
      id: 'Cancelled' as const,
      label: 'Cancelled',
      count: counts.cancelled,
      icon: Ban,
      bg: 'bg-slate-100/80 hover:bg-slate-100',
      border: 'border-slate-200',
      text: 'text-slate-900',
      iconBox: 'bg-slate-200 text-slate-700',
      ringColor: 'ring-slate-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 lg:gap-4">
      {cards.map((card) => {
        const isActive = activeFilter === card.id;
        const IconComponent = card.icon;

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onFilterChange(isActive && card.id !== 'ALL' ? 'ALL' : card.id)}
            className={cn(
              'flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl border text-left transition-all duration-200',
              card.bg,
              card.border,
              isActive ? cn('ring-2 ring-offset-1 shadow-sm scale-[1.02]', card.ringColor) : 'hover:shadow-xs'
            )}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider truncate">
                {card.label}
              </span>
              <div className={cn('p-1.5 rounded-lg shrink-0', card.iconBox)}>
                <IconComponent className="w-4 h-4" />
              </div>
            </div>
            <div className={cn('text-2xl sm:text-3xl font-bold tracking-tight', card.text)}>
              {card.count}
            </div>
          </button>
        );
      })}
    </div>
  );
}
```

### 6.3 `StudentMobileCard.tsx` Implementation
```tsx
import { Student } from '@/types/student';
import { StatusBadge } from './StatusBadge';
import { GraduationCap, Award, ChevronRight, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StudentMobileCardProps {
  student: Student;
  onSelect: () => void;
}

export function StudentMobileCard({ student, onSelect }: StudentMobileCardProps) {
  return (
    <div 
      className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all space-y-3"
      onClick={onSelect}
    >
      {/* Top Header: Avatar + Name + Status Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-sm shrink-0">
            {student.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-slate-900 text-base leading-tight truncate">
              {student.name}
            </h4>
            <span className="font-mono text-xs text-slate-500">
              #{student.id}
            </span>
          </div>
        </div>
        <StatusBadge status={student.status} className="shrink-0" />
      </div>

      {/* Middle Row: Course & Marks */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-1.5 text-slate-700">
          <GraduationCap className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="truncate font-medium">{student.course}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-700 justify-end">
          <Award className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">10th: {student.academic.tenthMarks} | 12th: {student.academic.twelfthMarks}</span>
        </div>
      </div>

      {/* Bottom Row: Worker Attribution & View Details Action */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <User className="w-3.5 h-3.5 text-slate-400" />
          <span className="truncate">By: {student.workerName}</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 px-2 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1 -mr-1"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          View Profile
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
```

---

## 7. Dependencies & Cross-Explorer Coordination

1. **Relation to Explorer 1 (Architecture & Layout)**:
   - Explorer 1 addresses the overall layout, theme, navigation, and sidebar/topbar.
   - The metrics grid and student list sit cleanly inside the layout's `<main>` container at `/admin/dashboard`.
2. **Relation to Explorer 3 (Admission Wizard & Student Profile Dialog)**:
   - Explorer 3 is designing the 3-step wizard (R2) and the tabbed profile modal (`Fees | Documents | Payments`, R3).
   - Our `Student` interface and `mockStudents.ts` provide the exact data fields (`fees: FeeSummary`, `installments: InstallmentRecord[]`, `payments: PaymentRecord[]`, `documents: DocumentRecord[]`) that Explorer 3's tabs consume.
   - When a user clicks a student card or table row in our student list, it will pass `selectedStudent` to Explorer 3's `StudentProfileDialog`.
3. **No Breaking External APIs**:
   - Everything runs in React 19 client components with pure CSS Tailwind v4 and Base UI primitives, requiring no additional npm dependencies.

---

## 8. Verification Strategy

1. **Layout & Visual Verification**:
   - Run Next.js dev server (`npm run dev`) and navigate to `http://localhost:3000/admin/dashboard`.
   - Verify 6 metric cards appear in a row on desktop (`>= 1024px`), 2 rows of 3 on tablet (`640px-1024px`), and 3 rows of 2 on mobile viewport (`< 640px`).
   - Check pastel backgrounds: Blue (Total), Amber (Action Needed), Purple (In Process), Emerald (Enrolled), Rose (Rejected), Slate (Cancelled).
2. **Interactive Filtering Verification**:
   - Click "Action Needed": list displays only students needing action.
   - Click "Enrolled": list displays only enrolled students.
   - Click "Total Students": list resets to all students.
3. **Responsive Mobile Viewport Verification**:
   - Resize browser to mobile width (< 768px, e.g. 375px iPhone size).
   - Verify standard table is hidden.
   - Verify card list appears displaying Name, Status Badge, ID, Course, and Marks.
   - Verify no horizontal scrollbar or element overflow occurs.
4. **Lint & Build Verification**:
   - Run `npm run lint` and `npm run build` to guarantee 0 TypeScript or styling compilation errors.
