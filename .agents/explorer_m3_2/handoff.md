# Milestone 3 Explorer 2: Data Models, Mock Data & Calculations Analysis

## 1. Observation

### 1.1 Source Files Examined
- `src/types/student.ts` (lines 1–83): Primary domain model definitions.
- `src/data/mockStudents.ts` (lines 1–842): 12 mock student records.
- `src/app/admin/dashboard/page.tsx` (lines 86–338): Current dialog implementation.
- `src/components/dashboard/StudentList.tsx` (lines 63, 226, 230–325): Table and mobile card callers.
- `src/components/admission/AdmissionWizard.tsx` (lines 253–356): Wizard submission contract generator.
- `package.json` (lines 1–41): Project dependencies.
- `public/`: Directory inspection for image/PDF assets.

---

### 1.2 Type Contracts in `src/types/student.ts`

#### 1. `FeeSummary` (`src/types/student.ts:20-26`)
```typescript
export interface FeeSummary {
  totalFee: number;          // e.g. 120000
  discount: number;          // e.g. 15000
  netFee: number;            // 105000 (totalFee - discount)
  paidAmount: number;        // e.g. 45000
  balanceDue: number;        // 60000 (netFee - paidAmount)
}
```
- **Evaluation**: Contains all 5 metrics required by R3 (`totalFee`, `discount`, `netFee`, `paidAmount`, `balanceDue`).

#### 2. `InstallmentRecord` (`src/types/student.ts:28-35`)
```typescript
export interface InstallmentRecord {
  id: string;
  title: string;             // e.g. "1st Installment (At Admission)"
  dueDate: string;           // e.g. "14 Oct 2026"
  amount: number;            // e.g. 45000
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  paidDate?: string;         // e.g. "14 Oct 2026, 10:30 AM"
}
```
- **Evaluation**: Captures title, due date, amount, status, and paidDate.
- **Status Casing**: Type defines strictly `'PAID' | 'PENDING' | 'OVERDUE'` (uppercase). Note: Dispatch and user prompts frequently write `Paid / Due / Pending`.

#### 3. `PaymentRecord` (`src/types/student.ts:37-46`)
```typescript
export interface PaymentRecord {
  id: string;
  amount: number;            // e.g. 45000
  date: string;              // e.g. "14 Oct 2026, 10:30 AM"
  method: PaymentMethod;     // 'UPI' | 'UPI QR' | 'Bank Transfer' | 'Cash' | 'Card'
  utr: string;               // e.g. "UPI-329482930192"
  bankDetails: string;       // e.g. "HDFC Bank (Boss Official A/C)"
  screenshotUrl?: string;    // e.g. "/receipt-qr.png"
  verified: boolean;         // true -> shows green "Verified" badge
}
```
- **Evaluation**: Matches all required fields: amount, date, method, UTR, bank details, screenshot URL, and verification status (`verified: boolean`).

#### 4. `DocumentRecord` (`src/types/student.ts:48-56`)
```typescript
export interface DocumentRecord {
  id: string;
  title: string;             // e.g. "Consolidated Admission Dossier (PDF)"
  fileName: string;          // e.g. "Rahul_Sharma_Academic_Records.pdf"
  fileSize: string;          // e.g. "2.4 MB"
  uploadDate: string;        // e.g. "14 Oct 2026"
  url: string;
  type: 'PDF' | 'IMAGE';
}
```
- **Evaluation**: Captures dossier title, filename, size, upload date, URL, and file type. Student photograph is stored on `Student.photoUrl?: string`.

---

### 1.3 Mock Data Audit in `src/data/mockStudents.ts`

Audit of all 12 student records:

| Student ID | Name | Status | Fee Breakdown (Total / Net / Paid / Due) | Installments | Payments | Documents | Photo URL |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `STU-9X82-KPL` | Rahul Sharma | Enrolled | ₹1,20,000 / ₹1,05,000 / ₹55,000 / ₹50,000 | 3 inst (1 PAID, 2 PENDING) | 1 pmt (UPI QR, verified: true) | 2 docs (Dossier + Aadhaar) | `/placeholder-student-1.png` |
| `STU-4M91-XCQ` | Priya Singh | Action Needed | ₹1,80,000 / ₹1,60,000 / ₹60,000 / ₹1,00,000 | 3 inst (1 PAID, 2 PENDING) | 1 pmt (Bank Transfer, verified: false) | 1 doc (Dossier) | `/placeholder-student-2.png` |
| `STU-7K14-PQR` | Ananya Roy | Enrolled | ₹1,90,000 / ₹1,65,000 / ₹85,000 / ₹80,000 | 2 inst (1 PAID, 1 PENDING) | 1 pmt (UPI QR, verified: true) | 1 doc (Dossier) | undefined |
| `STU-2B88-WVL` | Amit Kumar | In Process | ₹1,10,000 / ₹1,00,000 / ₹40,000 / ₹60,000 | 2 inst (1 PAID, 1 PENDING) | 1 pmt (UPI, verified: true) | 1 doc (Dossier) | undefined |
| `STU-6D45-LMK` | Rohan Verma | Action Needed | ₹1,30,000 / ₹1,20,000 / ₹30,000 / ₹90,000 | 3 inst (1 PAID, 2 PENDING) | 1 pmt (Bank Transfer, verified: false) | 1 doc (Dossier) | undefined |
| `STU-3N99-ZPT` | Sneha Nair | Enrolled | ₹1,50,000 / ₹1,35,000 / ₹70,000 / ₹65,000 | 2 inst (1 PAID, 1 PENDING) | 1 pmt (UPI QR, verified: true) | 1 doc (Dossier) | undefined |
| `STU-8F32-KLA` | Neha Gupta | In Process | ₹1,00,000 / ₹90,000 / ₹45,000 / ₹45,000 | 2 inst (1 PAID, 1 PENDING) | 1 pmt (UPI, verified: true) | 1 doc (Dossier) | undefined |
| `STU-1T55-QWE` | Vikram Malhotra | Enrolled | ₹2,40,000 / ₹2,10,000 / ₹1,10,000 / ₹1,00,000 | 2 inst (1 PAID, 1 PENDING) | 1 pmt (Bank Transfer, verified: true) | 1 doc (Dossier) | undefined |
| `STU-5X77-RTY` | Deepak Joshi | Rejected | ₹1,60,000 / ₹1,60,000 / ₹0 / ₹1,60,000 | 0 inst | 0 pmt | 1 doc (Dossier) | undefined |
| `STU-8J99-PLM` | Kunal Shah | Rejected | ₹1,20,000 / ₹1,20,000 / ₹0 / ₹1,20,000 | 0 inst | 0 pmt | 1 doc (Dossier) | undefined |
| `STU-2C33-BNM` | Simran Kaur | Cancelled | ₹2,20,000 / ₹2,00,000 / ₹20,000 / ₹1,80,000 | 1 inst (1 PAID) | 1 pmt (UPI, verified: true) | 1 doc (Dossier) | undefined |
| `STU-9M11-GHJ` | Arpita Patel | Cancelled | ₹1,75,000 / ₹1,60,000 / ₹10,000 / ₹1,50,000 | 0 inst | 0 pmt | 1 doc (Dossier) | undefined |

---

### 1.4 Critical Observations on Assets and Existing UI
1. **Missing Image Assets in `public/`**:
   - `public/` contains: `file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`.
   - `/placeholder-receipt.png`, `/receipt-qr.png`, `/placeholder-student-1.png`, and `/placeholder-student-2.png` **do not exist on disk**.
2. **Current Dialog in `src/app/admin/dashboard/page.tsx` (lines 86–338)**:
   - Does not have tabs (single vertical scroll view).
   - Shows Fee Overview but completely ignores `installments` (0 references to `.installments`).
   - "View Dossier" button runs `alert('Opening ${doc.fileName}')`.
   - Payment list has no screenshot preview modal or lightbox.
3. **Compilation & Linting**:
   - `npx tsc --noEmit` exited with code 0 (0 errors).
   - `npm run lint` exited with code 0 (3 warnings in unused variables in login/middleware).

---

## 2. Logic Chain

1. **Fee Calculation Mathematical Integrity**:
   - Observation 1.2 & 1.3: For all students, `netFee = totalFee - discount` and `balanceDue = netFee - paidAmount`.
   - Furthermore, the sum of installments equals `netFee` for all active students (e.g. Rahul Sharma: 55k + 25k + 25k = 105k = netFee).
   - The paid amount matches the sum of paid installments (e.g. Rahul: 55k = 1st installment).
   - This proves the financial arithmetic is sound and will display cleanly on the 5-metric summary card.

2. **Gaps in Installment Status Representation**:
   - Observation 1.3: Every single pending installment in `mockStudents.ts` has `status: 'PENDING'`. There is not a single installment with `status: 'OVERDUE'`.
   - Priya Singh (`STU-4M91-XCQ`) and Rohan Verma (`STU-6D45-LMK`) are tagged with status `'Action Needed'`.
   - In a realistic admission CRM, an "Action Needed" student typically has an overdue installment or unverified payment.
   - Giving Priya or Rohan an overdue installment with a past due date (e.g., `10 Sep 2026`) enables the UI to render the amber/rose overdue state in the installment timeline schedule.

3. **Gaps in Payment History (Multi-Transaction Support)**:
   - Observation 1.3: All students currently have either 0 or 1 payment record.
   - A key feature of Milestone 3 is the "Payment History" transaction list.
   - Adding a second payment to an enrolled student (such as Vikram Malhotra or Ananya Roy) will allow demonstrating multiple itemized transaction cards, payment sorting, and total paid reconciliation.

4. **Missing Static Assets in `public/`**:
   - Observation 1.4: `/placeholder-receipt.png` and student avatars do not exist in `/public/`.
   - If the Payment Screenshot Lightbox relies on `<img>` or `next/image` pointing to `/placeholder-receipt.png`, it will show a broken image icon or 404.
   - Therefore, the Worker must either generate a placeholder receipt SVG in `public/` OR (better) implement an inline SVG/HTML mock receipt renderer with authentic bank branding, UTR stamp, transaction amount, and digital QR seal.

5. **Document Tab & Credentials Checklist**:
   - Observation 1.1 & Feature 11 in `PROJECT.md`: The Documents tab requires a "Single PDF preview/download card, metadata (size, upload date), credentials checklist".
   - `DocumentRecord` has `id, title, fileName, fileSize, uploadDate, url, type`.
   - Enhancing `DocumentRecord` with optional `checklistItems?: string[]` (or having a credentials verification checklist helper in the UI) enables rendering the verified sub-credentials (10th marksheet, 12th marksheet, Aadhaar ID, Migration/Transfer certificate) embedded inside the single consolidated PDF dossier.

6. **Data Anomaly in Student 12 (`Arpita Patel`)**:
   - Observation 1.3: Arpita Patel has `fees.paidAmount: 10000` and `fees.balanceDue: 150000`, but `payments: []` and `installments: []`.
   - For mathematical and UI consistency, Arpita should either have `fees.paidAmount: 0` (with balanceDue 160000) or have a 10,000 token payment record.

---

## 3. Caveats

1. **Read-Only Scope**: In strict compliance with the Explorer archetype, no source files were modified, created, or deleted. All recommendations are packaged for the Worker.
2. **Backend/Database Out of Scope**: The application currently runs in local development mode using client-side mock data; Supabase tables were not inspected or altered.
3. **Mobile Device Emulation**: Viewport behavior was audited based on Tailwind CSS breakpoints (`md:` 768px, `sm:` 640px) used in `StudentMobileCard.tsx` and `StudentList.tsx`.

---

## 4. Conclusion & Actionable Recommendations

### 4.1 Recommended Type Adjustments in `src/types/student.ts`

1. **Expand `InstallmentStatus` union for robustness**:
   ```typescript
   export type InstallmentStatus = 'PAID' | 'PENDING' | 'OVERDUE' | 'Paid' | 'Pending' | 'Due' | 'Overdue';
   ```
   Or provide a normalization helper:
   ```typescript
   export function normalizeInstallmentStatus(status: string): 'PAID' | 'PENDING' | 'OVERDUE' {
     const s = status.toUpperCase();
     if (s === 'DUE') return 'OVERDUE';
     return s as 'PAID' | 'PENDING' | 'OVERDUE';
   }
   ```

2. **Enrich `DocumentRecord` for Credentials Checklist**:
   ```typescript
   export interface DocumentRecord {
     id: string;
     title: string;
     fileName: string;
     fileSize: string;
     uploadDate: string;
     url: string;
     type: 'PDF' | 'IMAGE';
     verified?: boolean;
     checklistItems?: string[]; // e.g. ['10th Marksheet', '12th Marksheet', 'Aadhaar Card', 'Transfer Certificate']
   }
   ```

---

### 4.2 Recommended Mock Data Enhancements in `src/data/mockStudents.ts`

1. **Add `OVERDUE` installment to Priya Singh (`STU-4M91-XCQ`)**:
   ```typescript
   // In Priya Singh's installments:
   {
     id: 'INST-202',
     title: '2nd Installment (Tuition Fee)',
     dueDate: '10 Sep 2026', // Past due date
     amount: 50000,
     status: 'OVERDUE',
   }
   ```

2. **Add second payment to Vikram Malhotra (`STU-1T55-QWE`)**:
   ```typescript
   // In Vikram Malhotra's payments:
   payments: [
     {
       id: 'PAY-9041',
       amount: 70000,
       date: '11 Oct 2026, 11:05 AM',
       method: 'Bank Transfer',
       utr: 'HDFC-RTGS-0091823',
       bankDetails: 'HDFC Bank - Boss Official A/C',
       screenshotUrl: '/placeholder-receipt.png',
       verified: true,
     },
     {
       id: 'PAY-9042',
       amount: 40000,
       date: '14 Oct 2026, 04:30 PM',
       method: 'UPI',
       utr: 'UPI-889102345671',
       bankDetails: 'HDFC Bank - Boss Official A/C',
       screenshotUrl: '/placeholder-receipt.png',
       verified: true,
     },
   ],
   ```

3. **Resolve Arpita Patel's (`STU-9M11-GHJ`) data anomaly**:
   Update `fees.paidAmount: 0` and `fees.balanceDue: 160000` (or add a 10,000 non-refundable seat reservation payment).

4. **Add Checklist Items to Consolidated Dossiers**:
   Add `checklistItems: ['Class 10 Marksheet (CBSE)', 'Class 12 Marksheet (CBSE)', 'Aadhaar Card Copy', 'Transfer Certificate (TC)', 'Character Certificate']` to the primary dossier document across student records.

---

### 4.3 Calculations & Presentation Formulae for Worker

In `FeesTab.tsx` / `StudentProfileModal.tsx`:
- **Paid Ratio**: `const paidPct = Math.min(100, Math.round((fees.paidAmount / (fees.netFee || 1)) * 100));`
- **Balance Ratio**: `const balancePct = 100 - paidPct;`
- **Installments Paid Count**: `const paidCount = installments.filter(i => i.status.toUpperCase() === 'PAID').length;`
- **Next Due Installment**: Earliest pending or overdue installment:
  ```typescript
  const nextDue = installments.find(i => i.status.toUpperCase() === 'PENDING' || i.status.toUpperCase() === 'OVERDUE');
  ```
- **Currency Formatter**:
  ```typescript
  export const formatINR = (amt: number) => `₹${amt.toLocaleString('en-IN')}`;
  ```

---

### 4.4 Fallback Handling for Missing Assets
- **Student Photo**:
  When `student.photoUrl` is missing or fails to load, render a rounded gradient avatar showing 2-letter uppercase initials:
  ```tsx
  const initials = student.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-xl flex items-center justify-center shadow-md">
    {initials}
  </div>
  ```
- **Payment Screenshot Lightbox**:
  The lightbox (`PaymentScreenshotModal.tsx`) should render an authentic visual receipt card (Student Name, Course, Amount, Date, UTR, Bank, QR Code badge, Green "PAID & VERIFIED" stamp) if the image fails or as a rich interactive preview.

---

## 5. Verification Method

### 5.1 Commands to Verify
1. Type check:
   ```powershell
   npx tsc --noEmit
   ```
   Must exit with code 0 without any errors.

2. Lint check:
   ```powershell
   npm run lint
   ```
   Must complete with 0 errors.

3. Build check:
   ```powershell
   npm run build
   ```
   Ensures Next.js App Router static optimization and page compilation succeed.

### 5.2 Files to Inspect
- `src/types/student.ts`: Check `FeeSummary`, `InstallmentRecord`, `PaymentRecord`, `DocumentRecord`.
- `src/data/mockStudents.ts`: Check presence of `OVERDUE` installment, multi-payment record, and Arpita Patel fix.
- `src/components/profile/FeesTab.tsx`: Check 5-metric financial cards and installment timeline.
- `src/components/profile/DocumentsTab.tsx`: Check single PDF dossier card, metadata, and checklist.
- `src/components/profile/PaymentsTab.tsx`: Check transaction cards, UTR copy button, verification badge, and screenshot modal.

### 5.3 Invalidation Conditions
- Any student record where `totalFee - discount !== netFee` or `netFee - paidAmount !== balanceDue`.
- Missing empty states for `Rejected` students with 0 installments or 0 payments.
- Broken image icon when clicking "View Payment Screenshot".
