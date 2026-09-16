# Milestone 3 Exploration & Architecture Handoff Report

## Executive Summary
This report delivers the comprehensive architectural analysis and implementation specification for **Milestone 3 (R3: Comprehensive Student Profile with Tabs)** in the Next.js Admission Portal.

---

## 1. Observation

### 1.1 Trigger Architecture & State Flow
We inspected the existing codebase to map where student profiles are currently opened or triggered:

1. **Root State Owner (`src/app/admin/dashboard/page.tsx`)**:
   - Line 36: `const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);`
   - Line 82: `StudentList` is invoked with `onSelectStudent={(student) => setSelectedStudent(student)}`.
   - Lines 87–338: A monolithic `<Dialog open={Boolean(selectedStudent)} onOpenChange={(open) => { if (!open) setSelectedStudent(null); }}>` is rendered directly inside `AdminOverview`.

2. **Trigger in Desktop View (`src/components/dashboard/StudentList.tsx`)**:
   - Line 28: Interface `StudentListProps` declares `onSelectStudent: (student: Student) => void;`.
   - Line 232: Table row click: `<TableRow ... onClick={() => onSelectStudent(student)}>`.
   - Lines 310–313: Table action column button: `<Button variant="ghost" onClick={(e) => { e.stopPropagation(); onSelectStudent(student); }}>View Profile <ChevronRight /></Button>`.

3. **Trigger in Mobile View (`src/components/dashboard/StudentMobileCard.tsx`)**:
   - Line 11: Interface `StudentMobileCardProps` declares `onSelect: (student: Student) => void;`.
   - Line 25: Card container click: `<div ... onClick={() => onSelect(student)}>`.
   - Lines 69–72: Card action button: `<Button variant="ghost" onClick={(e) => { e.stopPropagation(); onSelect(student); }}>View Profile <ChevronRight /></Button>`.

### 1.2 Current State of `src/components/profile/`
- The directory `src/components/profile/` **does not exist yet**.
- Currently, student details are rendered via a 250-line inline JSX dialog in `src/app/admin/dashboard/page.tsx` (lines 87–338).
- Current inline dialog limitations:
  - **No tabbed interface**: All sections (Academic, Worker Attribution, Fee Breakdown, Payment Transactions, Documents Dossier) are dumped vertically in a single scrollable container.
  - **Missing Installment Timeline**: `selectedStudent.installments` is completely ignored and not displayed anywhere.
  - **Missing Payment Screenshot Lightbox**: Payment cards have no screenshot viewer modal (only a static text display).
  - **Missing UTR One-Click Copy**: UTR string is static text with no copy-to-clipboard action.
  - **Dossier actions are dummy alerts**: Clicking "View Dossier" triggers `alert('Opening ...')`.

### 1.3 UI Primitives Inspection (`src/components/ui/`)
- **Existing Primitives**:
  - `src/components/ui/dialog.tsx`: Built on `@base-ui/react/dialog`. Supports `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose`.
  - `src/components/ui/badge.tsx`: Built with `cva` supporting `default`, `secondary`, `destructive`, `outline`.
  - `src/components/dashboard/StatusBadge.tsx`: Specialized badge supporting all 5 statuses (`Enrolled`, `Action Needed`, `In Process`, `Rejected`, `Cancelled`) with distinct pastel colors and Lucide icons.
  - `src/components/ui/card.tsx`, `button.tsx`, `input.tsx`, `label.tsx`, `select.tsx`, `table.tsx`, `toast.tsx`: All present and functional.
- **Missing Primitives**:
  - `src/components/ui/tabs.tsx`: Not yet created.
  - **Discovery**: `@base-ui/react` (version `^1.8.0`) is installed in `package.json` and its `./tabs` export is available in `node_modules/@base-ui/react/tabs` (`Tabs.Root`, `Tabs.List`, `Tabs.Tab`, `Tabs.Panel`, `Tabs.Indicator`). A clean wrapper `src/components/ui/tabs.tsx` can be created directly using `@base-ui/react/tabs`.

### 1.4 Data Models & Mock Data (`src/types/student.ts` & `src/data/mockStudents.ts`)
- The data contract is fully typed and ready:
  - `Student`: `id`, `name`, `email`, `phone`, `course`, `status`, `date`, `workerName`, `workerEmail`, `marks`, `academic`, `fees`, `installments`, `payments`, `documents`, `photoUrl`.
  - `FeeSummary`: `totalFee: number`, `discount: number`, `netFee: number`, `paidAmount: number`, `balanceDue: number`.
  - `InstallmentRecord`: `id: string`, `title: string`, `dueDate: string`, `amount: number`, `status: 'PAID' | 'PENDING' | 'OVERDUE'`, `paidDate?: string`.
  - `PaymentRecord`: `id: string`, `amount: number`, `date: string`, `method: PaymentMethod`, `utr: string`, `bankDetails: string`, `screenshotUrl?: string`, `verified: boolean`.
  - `DocumentRecord`: `id: string`, `title: string`, `fileName: string`, `fileSize: string`, `uploadDate: string`, `url: string`, `type: 'PDF' | 'IMAGE'`.
- `MOCK_STUDENTS` contains 12 rich records covering all these fields.

---

## 2. Logic Chain

1. **State Preservation**: The root state selectedStudent: Student | null in src/app/admin/dashboard/page.tsx and the trigger callbacks onSelectStudent in StudentList and StudentMobileCard work correctly and should be preserved without breaking changes.
2. **Decomposition of Inline Dialog**: Replacing lines 87–338 of src/app/admin/dashboard/page.tsx with <StudentProfileModal student={selectedStudent} open={Boolean(selectedStudent)} onOpenChange={(open) => { if (!open) setSelectedStudent(null); }} /> will immediately clean up the page, eliminate 250+ lines of duplicate markup, and encapsulate all profile logic.
3. **Tabbed Architecture (Fees | Documents | Payments)**:
   - The user requirement (R3) specifically demands a tabbed interface for:
     1. **Fees**: Summary card with 5 metrics (Total Fee, Discount, Net Fee, Paid, Balance Due) + Installment Timeline schedule.
     2. **Documents**: Consolidated PDF admission dossier preview/download + file metadata + credentials checklist.
     3. **Payments**: Detailed transaction cards (Amount, Date, UTR with copy button, Bank Details, Verified badge) + View Payment Screenshot button triggering a Screenshot Lightbox modal.
4. **UI Primitive Addition**: Adding src/components/ui/tabs.tsx using @base-ui/react/tabs aligns with PROJECT.md line 17 and provides a reusable, accessible tab component.

---

## 3. Caveats & Edge Cases

1. **Screenshot Image URLs**:
   In mockStudents.ts, screenshotUrl is set to '/placeholder-receipt.png', which is not a physical file in public/. PaymentScreenshotModal must implement an elegant visual fallback (e.g., a styled SVG / simulated digital payment voucher) when the image fails to load or is a placeholder, ensuring a flawless visual experience.
2. **Dialog Size & Mobile Viewport**:
   The existing DialogContent in src/components/ui/dialog.tsx has sm:max-w-sm by default. For the comprehensive student profile modal, the wrapper must pass responsive sizing classes:
   className=w-[95vw] max-w-3xl sm:max-w-3xl md:max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden
   to prevent horizontal clipping and enable vertical scrolling inside tab panels.
3. **Number Formatting in INR**:
   All currency values should use 	oLocaleString('en-IN') with the Rupee symbol (₹) for uniform representation (e.g. ₹1,20,000).
4. **Read-Only Explorer Constraint**:
   Explorer 1 has not modified or created any application code files. Only metadata and progress reports were written to .agents/explorer_m3_1/.

---

## 4. Conclusion & Recommended Architecture

### 4.1 Component Tree & File Map
Create the following files under `src/`:

```
src/
├── components/
│   ├── ui/
│   │   └── tabs.tsx                        # UI primitive wrapping @base-ui/react/tabs
│   └── profile/
│       ├── StudentProfileModal.tsx         # Main controlled dialog with Hero Header & Tabs
│       ├── FeesTab.tsx                     # 5-Metric Fee Card & Installment Timeline Schedule
│       ├── DocumentsTab.tsx                # Single PDF Dossier Card & Credentials Checklist
│       ├── PaymentsTab.tsx                 # Transaction Cards, UTR Copy & Lightbox Trigger
│       └── PaymentScreenshotModal.tsx      # High-res Receipt Lightbox with Fallback & Details
```

### 4.2 Component Specifications & Contracts

#### 1. src/components/ui/tabs.tsx
```tsx
'use client';
import * as React from 'react';
import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';
import { cn } from '@/lib/utils';

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List
      className={cn(
        'inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1 text-slate-600',
        className
      )}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      className={cn(
        'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 text-slate-600 hover:text-slate-900 data-active:bg-white data-active:text-slate-900 data-active:shadow-xs data-active:font-semibold',
        className
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      className={cn(
        'mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        className
      )}
      {...props}
    />
  );
}
```

#### 2. src/components/profile/StudentProfileModal.tsx
- **Props**:
  ```ts
  interface StudentProfileModalProps {
    student: Student | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }
  ```
- **Structure**:
  - Controlled `<Dialog open={open} onOpenChange={onOpenChange}>`.
  - **Hero Header**:
    - Student avatar with initials / photo, Student Name, StatusBadge, Student ID copy chip, Registration Date.
    - Contact Banner: Course with GraduationCap icon, Email, Phone, Admitted By (Worker Name & Email badge).
    - Academic qualifications preview pill (10th & 12th marks).
  - **Tabs Navigation**:
    - Tabs: `fees` (Fees & Timeline), `documents` (Documents Dossier), `payments` (Payment History).
    - Tab triggers include counter badges and Lucide icons (`CreditCard`, `FileText`, `CheckCircle2`).
  - **Tab Content Panels**:
    - `<FeesTab student={student} />`
    - `<DocumentsTab student={student} />`
    - `<PaymentsTab student={student} onOpenScreenshot={(payment) => setActiveScreenshot(payment)} />`
  - Integrated `<PaymentScreenshotModal>` controlled by local `activeScreenshot: PaymentRecord | null` state.
  - Dialog footer with "Close Profile" button and optional "Export Dossier / Print" utility.

#### 3. src/components/profile/FeesTab.tsx
- **Props**:
  ```ts
  interface FeesTabProps {
    student: Student;
  }
  ```
- **Structure**:
  - **5-Metric Financial Summary Grid**:
    - Total Fee (`₹student.fees.totalFee.toLocaleString('en-IN')`, slate pastel background)
    - Discount (`-₹student.fees.discount.toLocaleString('en-IN')`, emerald pastel background)
    - Net Fee (`₹student.fees.netFee.toLocaleString('en-IN')`, blue pastel background)
    - Paid Amount (`₹student.fees.paidAmount.toLocaleString('en-IN')`, emerald pastel background)
    - Balance Due (`₹student.fees.balanceDue.toLocaleString('en-IN')`, amber/rose pastel background)
  - **Payment Progress Bar**:
    - Percentage paid calculation: `Math.round((student.fees.paidAmount / student.fees.netFee) * 100)%`.
    - Progress bar visually displaying paid vs balance due proportion.
  - **Installment Timeline Section**:
    - Header: Installment Schedule & Milestones.
    - Vertical timeline with connected step nodes for each item in `student.installments`.
    - Node icon/indicator:
      - `PAID`: Emerald circle with `Check` icon.
      - `PENDING`: Blue/Slate circle with `Clock` icon.
      - `OVERDUE`: Rose circle with `AlertTriangle` icon.
    - Each installment card shows:
      - Installment Title (e.g. `1st Installment (Admission Token)`).
      - Due Date and Paid Date (if paid).
      - Amount formatted in INR.
      - Status pill (`PAID`, `PENDING`, `OVERDUE`).

#### 4. src/components/profile/DocumentsTab.tsx
- **Props**:
  ```ts
  interface DocumentsTabProps {
    student: Student;
  }
  ```
- **Structure**:
  - **Consolidated Admission Dossier (Single PDF)**:
    - Primary highlight card for the consolidated PDF dossier (`student.documents[0]`).
    - File icon (red PDF badge), title, file name, file size, upload timestamp.
    - Action buttons: "Download Dossier" and "Preview Document".
  - **Credentials Verification Checklist**:
    - 10th Class Marksheet & Passing Certificate (Verified).
    - 12th Class Marksheet & Passing Certificate (Verified).
    - Government ID Proof (Aadhaar / Passport) (Verified).
    - Transfer Certificate / Migration Certificate (Verified).
    - Passport Size Photographs (Verified).
  - **Additional Files List**:
    - Cards for each additional document in `student.documents`.

#### 5. src/components/profile/PaymentsTab.tsx
- **Props**:
  ```ts
  interface PaymentsTabProps {
    student: Student;
    onOpenScreenshot: (payment: PaymentRecord) => void;
  }
  ```
- **Structure**:
  - Transaction count badge and total paid summary.
  - List of itemized payment cards for `student.payments`:
    - Amount formatted prominently (`₹student.payments[i].amount.toLocaleString('en-IN')`).
    - Payment Method badge (`UPI`, `UPI QR`, `Bank Transfer`, `Cash`).
    - Date & Time stamp.
    - UTR Reference with an interactive "Copy UTR" button (with copied toast/state).
    - Bank Account Details (`HDFC Bank - Boss Official A/C`).
    - Verification Status Badge:
      - `verified === true`: Emerald badge with `CheckCircle2` ("Verified").
      - `verified === false`: Amber badge with `Clock` ("Pending Verification").
    - **"View Payment Screenshot"** button with `Eye` / `ImageIcon` triggering `onOpenScreenshot(payment)`.

#### 6. src/components/profile/PaymentScreenshotModal.tsx
- **Props**:
  ```ts
  interface PaymentScreenshotModalProps {
    payment: PaymentRecord | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }
  ```
- **Structure**:
  - Dialog with lightbox styling:
    - Dialog Header with payment ID, UTR, and Verified badge.
    - Receipt Image Preview:
      - Attempts to load `payment.screenshotUrl`.
      - Includes robust fallback illustration / digital voucher card showing:
        - Merchant: Boss Official Admissions A/C
        - Amount: `₹payment.amount.toLocaleString('en-IN')`
        - Method: `payment.method`
        - UTR: `payment.utr`
        - Status: `Payment Verified`
    - Action buttons: "Download Receipt", "Close Lightbox".

### 4.3 Integration in src/app/admin/dashboard/page.tsx
Replace lines 87–338 with:
```tsx
{/* Student Profile Quick View Dialog */}
<StudentProfileModal
  student={selectedStudent}
  open={Boolean(selectedStudent)}
  onOpenChange={(open) => {
    if (!open) setSelectedStudent(null);
  }}
/>
```

---

## 5. Verification Method

To independently verify the implementation once built:

1. **TypeScript Typecheck**:
   ```powershell
   npx tsc --noEmit
   ```
   *Expected outcome*: 0 errors.

2. **ESLint Validation**:
   ```powershell
   npm run lint
   ```
   *Expected outcome*: 0 errors.

3. **Production Build**:
   ```powershell
   npm run build
   ```
   *Expected outcome*: Compiles all routes (`/admin/dashboard`, `/worker/admission`, etc.) successfully without hydration or runtime mismatch.

4. **Functional & UI Inspection Checkpoints**:
   - Open /admin/dashboard.
   - Click on any student card in mobile view or table row / View Profile button in desktop view.
   - Verify modal opens with hero header displaying student info, status badge, and course.
   - Click Fees tab: verify 5-metric financial overview (Total, Discount, Net, Paid, Balance Due) and vertical installment timeline with Paid/Pending markers.
   - Click Documents tab: verify single PDF dossier card, file size/date metadata, and credentials checklist.
   - Click Payments tab: verify transaction cards with UTR, bank details, verified badge, and Copy UTR button.
   - Click View Payment Screenshot: verify receipt lightbox opens displaying voucher details and closes cleanly.
   - Close modal: verify selectedStudent resets to null and dashboard remains fully interactive.
