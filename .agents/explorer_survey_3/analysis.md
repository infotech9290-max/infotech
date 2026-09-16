# Technical Investigation & Architecture Report: Admission Form & Student Profile

**Agent**: Explorer 3 (Admission Form & Student Profile Explorer)  
**Role**: teamwork_preview_explorer  
**Working Directory**: `C:\Users\satya\Desktop\New folder\admin-portal\.agents\explorer_survey_3`  
**Date**: 2026-09-14T19:35:00Z  
**Target Requirements**: 
- **R2**: 3-Step Admission Wizard with Top Progress Indicator & Inline Validation  
- **R3**: Comprehensive Student Profile with Tabs (`Fees | Documents | Payments`)

---

## 1. Executive Summary

This investigation analyzed the existing implementation of the **Add Student flow** and **Student Profile / Details view** within `C:\Users\satya\Desktop\New folder\admin-portal`.

### Key Findings:
1. **Existing Add Student Flow (`src/app/worker/admission/page.tsx`)**:
   - Currently implemented as an incomplete 2-step form (`Step 1: Student Details`, `Step 2: Payment Verification`, followed by a static success card at `step === 3`).
   - **No top progress indicator** exists; only static `<CardTitle>` text is displayed.
   - **Missing vital fields in Step 1**: Lacks complete personal details (email, phone, guardian, address), 12th standard details (stream, school), course selection dropdowns (course, session, batch), and **critically lacks a single PDF document upload**. Currently it only accepts an image photo.
   - **Step 2 lacks fee management**: Only asks for payment method, UTR, and payment screenshot; does not record or compute course fees, discounts, net fees, down payment, or installment schedules.
   - **Step 3 is not a review step**: It renders a hardcoded success screen rather than a pre-submission review and verification screen.
   - **No inline error alerts**: Relies solely on native browser HTML5 `required` tooltips instead of a prominent top red alert banner and highlighted fields.

2. **Existing Student Profile / Details View (`src/app/admin/dashboard/page.tsx`)**:
   - Embedded directly inside each row of the student table (lines 109–173) via an anti-pattern: duplicate `<Dialog>` and `<DialogTrigger>` tags inside every row.
   - Completely lacks tabbed navigation.
   - Renders a static two-column card layout (Left: 10th/12th/Graduation text + Worker Attribution; Right: Payment method/UTR + static placeholder boxes).
   - Completely lacks:
     - **Fees Tab**: No 5-metric financial summary card (Total Fee, Discount, Net Fee, Paid, Balance Due) and no Installment Timeline schedule.
     - **Documents Tab**: No single PDF dossier display, preview, or download.
     - **Payments Tab**: No dedicated transaction cards displaying Amount, Date, UTR, Bank Details, "Verified" badge, or "View Payment Screenshot" modal.

3. **Readiness & Integration**:
   - The project uses Next.js 16.3.5 App Router, React 19.2.8, Tailwind CSS v4, Lucide React icons, and `@base-ui/react` primitives.
   - Cleanly modularizing the codebase by adding `src/types/student.ts`, `src/data/mockStudents.ts`, `src/components/admission/AdmissionWizard.tsx`, and `src/components/profile/StudentProfileModal.tsx` will satisfy R2 and R3 100% without breaking existing routes or requiring new external libraries.

---

## 2. Codebase Baseline Investigation

### 2.1 Existing "Add Student" Form (`src/app/worker/admission/page.tsx`)

#### Observation:
The file contains 161 lines of React client code:
```tsx
// Lines 9-11
export default function AdmissionForm() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State (Lines 14-16)
  const [studentName, setStudentName] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('');
```

#### Step 1: Student Details (Lines 52–86):
- Form title: `<CardTitle>Step 1: Student Details</CardTitle>`
- Inputs:
  1. `studentName` (Full Name) - `<Input value={studentName} onChange={...} required />`
  2. `photo` - `<Input type="file" accept="image/*" onChange={handlePhotoUpload} required />`
  3. `10th Marks (%)` - `<Input type="number" required />` (uncontrolled)
  4. `10th Passing Year` - `<Input type="text" required />` (uncontrolled)
- Button: `<Button type="submit" className="w-full">Next: Payment Details</Button>`

#### Step 2: Payment Verification (Lines 88–140):
- Form title: `<CardTitle>Step 2: Payment Verification</CardTitle>`
- Inputs:
  1. `paymentMethod` - HTML `<select>` (Options: `UPI`, `QR`, `BANK`)
  2. Conditional QR code container when `paymentMethod === 'QR'`
  3. `payment_utr` - `<Input type="text" required placeholder="e.g. 312345678901" />` (uncontrolled)
  4. `payment_screenshot` - `<Input type="file" accept="image/*" required />` (uncontrolled)
- Buttons:
  - `<Button variant="outline" type="button" onClick={() => setStep(1)}>Back</Button>`
  - `<Button type="submit" disabled={loading}>Submit Admission</Button>`

#### Step 3: Success Screen (Lines 142–156):
- Form title: `<CardTitle className="text-emerald-700 text-2xl">Admission Successful!</CardTitle>`
- Static Unique ID: `<p className="text-3xl font-mono font-bold text-emerald-600">STU-10293-AX</p>`
- Button: `<Button onClick={() => setStep(1)}>Submit Another Admission</Button>`

#### Baseline Deficiencies in Admission Form:
| Requirement Aspect | Current Code | Target Requirement (R2) |
|---|---|---|
| **Top Progress Indicator** | None. Only plain text `<CardTitle>` | 3 visible steps with icons, numbers, labels, active highlights, and connector bars |
| **Step 1: Personal Details** | Only Full Name | Full Name, Email, Phone/WhatsApp, DOB/Gender, Guardian Name, Address |
| **Step 1: Academic Details** | Only 10th Marks & Year (uncontrolled) | 10th (School, Year, %), 12th (School, Stream, Year, %), Graduation (if PG) |
| **Step 1: Course Details** | Completely missing | Course dropdown (BCA, B.Tech, etc.), Session (2026–2029), Batch/Shift |
| **Step 1: Document Upload** | Photo only (`accept="image/*"`) | **Single PDF upload** for academic dossier + student photo with compression |
| **Step 2: Fee Details** | Only Payment Method, UTR, Screenshot | Total Fee, Discount, Net Fee calculation, Payment Plan (Full/Installment), Down Payment, Balance Due |
| **Step 3: Review & Submit** | Static success card (skips review) | Full pre-submission review card of all sections, verification confirmation, and final submission trigger |
| **Inline Validation** | Browser HTML5 `required` tooltip | Prominent red top alert banner (e.g., "Student Name is required"), field border highlights, auto-scroll |

---

### 2.2 Existing Student Details / Profile Dialog (`src/app/admin/dashboard/page.tsx`)

#### Observation:
In `src/app/admin/dashboard/page.tsx`, lines 109–173:
```tsx
<TableCell className="text-right">
  <Dialog>
    <DialogTrigger className="px-3 py-1 border border-slate-200 hover:bg-slate-100 text-slate-700 text-sm font-medium rounded-md transition-colors" onClick={() => setSelectedStudent(student)}>
      View Details
    </DialogTrigger>
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle className="text-2xl">Student Profile: {selectedStudent?.name}</DialogTitle>
      </DialogHeader>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {/* Left Column: Academics */}
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-lg border">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Academic Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b pb-1">
                <span className="text-slate-500">10th Class:</span>
                <span className="font-medium">{selectedStudent?.tenth}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-slate-500">12th Class:</span>
                <span className="font-medium">{selectedStudent?.twelfth}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Graduation:</span>
                <span className="font-medium">{selectedStudent?.grad}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">Worker Attribution</h3>
            <p className="text-sm text-blue-800">This student was admitted by <strong>{selectedStudent?.workerName}</strong> ({selectedStudent?.workerEmail}).</p>
          </div>
        </div>

        {/* Right Column: Payment & Media */}
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
            <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-3">Payment Verification</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-emerald-700">Method:</span>
                <span className="font-bold text-emerald-800">{selectedStudent?.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-700">UTR No:</span>
                <span className="font-mono text-emerald-800">{selectedStudent?.utr}</span>
              </div>
            </div>
            <div className="mt-3 w-full h-24 bg-white border border-emerald-200 flex items-center justify-center text-xs text-emerald-400 rounded">
              [Screenshot Image Placeholder]
            </div>
          </div>
          
          <div className="w-full h-32 bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-xs text-slate-400 rounded-lg">
            <span className="text-2xl mb-1">📸</span>
            [Student Photo Compressed]
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</TableCell>
```

#### Baseline Deficiencies in Student Profile:
| Requirement Aspect | Current Code | Target Requirement (R3) |
|---|---|---|
| **Modal Architecture** | Duplicated `<Dialog>` inside every table row | Single controlled `<StudentProfileModal>` mounted at root |
| **Tabbed Interface** | None. Single static 2-column view | 3 working tabs: `Fees \| Documents \| Payments` |
| **Header / Hero Section** | Simple string title: `Student Profile: Rahul` | Hero card with avatar, name, ID chip, status badge, course, worker info |
| **Fees Tab: Summary Card** | Completely missing | 5-card financial metric grid: Total Fee, Discount, Net Fee, Paid, Balance Due |
| **Fees Tab: Timeline** | Completely missing | Installment schedule timeline with node states (Paid, Pending, Overdue, Upcoming) |
| **Documents Tab** | Only photo placeholder in right column | Single PDF dossier card (Name, size, download, preview) + academic credentials |
| **Payments Tab** | Method & UTR text with placeholder | Detailed transaction cards (Amount, Date, UTR, Bank details, "Verified" badge, "View Screenshot" button) |
| **Payment Screenshot Modal** | Non-functional text placeholder `[Screenshot Image]` | Dedicated Lightbox modal displaying the receipt image with zoom and dismiss |

---

## 3. Requirement R2: 3-Step Admission Wizard Architecture

### 3.1 Wizard Flow & Step Decomposition

The Admission Wizard will guide the worker/admin through exactly three clear steps:

```
[ Step 1: Student Details ]  ───►  [ Step 2: Fee Details ]  ───►  [ Step 3: Review & Submit ]  ───►  [ Success Screen ]
 - Personal Details                 - Total Course Fee               - Comprehensive Review Card           - Student ID STU-XXXX
 - Academic Records                 - Discount / Scholarship         - Document Verification               - Print / Copy ID
 - Course & Batch Selection         - Net Fee Auto-Calculation       - Fee & Payment Summary               - View Profile Link
 - Single PDF Dossier Upload        - Down Payment & Balance Due     - Verification Checkbox
 - Student Photo Upload             - Method, UTR, Screenshot
```

### 3.2 Top Progress Indicator Specification
The progress indicator will be positioned at the top of the wizard card:
- **Responsive Layout**:
  - Horizontal stepped bar with connector lines.
  - Step items contain:
    - Step circle: Step number (`1`, `2`, `3`) or a checkmark (`Check` icon from `lucide-react`) when completed.
    - Step label: "Student Details", "Fee Details", "Review & Submit".
    - Step subtitle on larger screens: "Personal & Academic", "Payment & Plans", "Verify & Finalize".
- **Visual States**:
  - `active`: Emerald/Indigo background with white text, glowing ring (`ring-2 ring-primary/20`), bold label.
  - `completed`: Emerald background (`bg-emerald-600 text-white`), checkmark icon, colored connector line (`bg-emerald-500`).
  - `upcoming`: Slate background (`bg-slate-100 text-slate-400 border border-slate-300`), muted label.

### 3.3 Inline Validation Engine
To fulfill the requirement for inline validation:
1. **Top Error Alert Banner (`FormErrorAlert`)**:
   - If user attempts to click "Next" or "Submit" while required fields are missing:
     - Form displays an alert banner at the top of the card:
       ```tsx
       <div className="p-3 mb-6 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
         <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
         <div>
           <p className="font-semibold">Please resolve the following errors:</p>
           <ul className="list-disc list-inside mt-1 space-y-0.5 text-xs">
             {errors.map((err, i) => (
               <li key={i}>{err}</li>
             ))}
           </ul>
         </div>
       </div>
       ```
     - Auto-scrolls the container to the top so the user immediately sees what went wrong.
2. **Field-Level Visual Cues**:
   - Inputs with errors get highlighted with `border-destructive ring-1 ring-destructive/30 bg-destructive/5`.
   - Clear helper text in red appears below the affected field (e.g., `<p className="text-xs text-destructive mt-1">Student name is required</p>`).

### 3.4 Step-by-Step Fields Specification

#### Step 1: Student Details
1. **Personal Information**:
   - `name`: Full Name (*Required*)
   - `email`: Student Email (*Required*, email format validation)
   - `phone`: Mobile / WhatsApp Number (*Required*, 10-digit validation)
   - `guardianName`: Father's / Mother's / Guardian's Name (*Required*)
   - `dob`: Date of Birth (*Required*)
   - `gender`: Gender selection (`Male`, `Female`, `Other`)
   - `address`: Full Postal Address
2. **Academic Records**:
   - **10th Standard**: School Name, Board (CBSE/ICSE/State), Passing Year, Percentage / CGPA (*Required*)
   - **12th Standard**: College/School Name, Board, Stream (`Science (PCM/PCB)`, `Commerce`, `Arts`), Passing Year, Percentage (*Required*)
   - **Graduation (Optional)**: Degree (BCA, B.Sc, B.Com), College, University, Passing Year, Percentage
3. **Course & Admission Selection**:
   - `course`: Selected Course (*Required*, e.g., `BCA (Bachelor of Computer Applications)`, `B.Tech (Computer Science & Engg)`, `B.Tech (AI & Data Science)`, `BBA (Bachelor of Business Admin)`, `MCA`, `MBA`)
   - `session`: Academic Session (*Required*, e.g., `2026–2029`, `2026–2030`)
   - `batch`: Shift / Batch (`Regular Morning`, `Regular Afternoon`)
4. **Document Uploads**:
   - **Single PDF Dossier Upload** (*Required*):
     - Drag-and-drop zone accepting `.pdf` up to 15 MB.
     - Displays file name, size, PDF icon, remove button, and preview link.
   - **Student Passport Photo** (*Required*):
     - Image input (`accept="image/*"`).
     - Auto-compressed using `compressImage()`.
     - Displays thumbnail preview with compressed size badge.

#### Step 2: Fee Details
1. **Fee Calculation & Discount**:
   - `totalFee`: Total Course Fee (default auto-populated based on selected Course, e.g., `₹1,20,000`, editable)
   - `discount`: Scholarship / Merit Discount (e.g., `₹20,000`, optional)
   - `netFee`: **Auto-Calculated** (`totalFee - discount`, e.g., `₹1,00,000`)
2. **Payment Plan**:
   - `paymentPlan`: `Full Payment` or `Installments (2 Steps)` or `Installments (3 Steps)` or `Installments (4 Steps)`
   - Installment Breakdown Preview:
     - Automatically generates scheduled dates and amounts (e.g., Inst 1: ₹40,000 at admission, Inst 2: ₹30,000 in 60 days, Inst 3: ₹30,000 in 120 days)
3. **Initial Payment Collection**:
   - `downPayment`: Amount Paid Now (*Required*, e.g., `₹40,000`)
   - `balanceDue`: **Auto-Calculated** (`netFee - downPayment`, e.g., `₹60,000`)
   - `paymentMethod`: Payment Method (*Required*, `UPI QR`, `Bank Transfer`, `Cash`)
   - **Dynamic Merchant Payment Details**:
     - When `UPI QR` selected: Shows official UPI ID (`boss@icici`) and QR Code image placeholder.
     - When `Bank Transfer` selected: Shows Bank Name (`HDFC Bank`), Account No (`50100293049182`), IFSC (`HDFC0001234`).
   - `utr`: Transaction Reference / UTR Number (*Required for digital payment*)
   - `screenshot`: Payment Receipt Screenshot Upload (*Required for digital payment*, with preview thumbnail).

#### Step 3: Review & Submit
1. **Summary Review Sections**:
   - **Student Profile Summary**: Photo thumbnail, Full Name, Email, Phone, Guardian, Address.
   - **Academic Summary**: 10th (School, Year, %), 12th (School, Stream, Year, %), Course & Session.
   - **Document Summary**: Single PDF Dossier Name, Size, Status ("Ready for Upload").
   - **Financial Summary**: Total Fee, Discount, Net Fee, Down Payment, Remaining Balance Due, Payment Method, UTR Number, Receipt thumbnail.
2. **Verification Declaration**:
   - Checkbox: *"I hereby verify that all student academic credentials and payment UTR records have been physically and digitally verified."*
3. **Actions**:
   - "Back to Edit Fees" (returns to Step 2)
   - "Back to Edit Details" (returns to Step 1)
   - "Confirm & Complete Admission" (Primary submit button with loading spinner)
4. **Post-Submission Success View**:
   - Green themed success banner
   - Auto-generated Student ID: `generateUniqueID('STU')` (e.g., `STU-K92X-841M`)
   - Direct action buttons:
     - "View Student Profile" (opens the R3 profile dialog for this student)
     - "Submit Another Admission" (resets form to step 1)

---

## 4. Requirement R3: Comprehensive Student Profile Architecture

### 4.1 Dialog Architecture & Decoupling

Rather than nesting `<Dialog>` inside each table row, `StudentProfileModal` is decoupled into a dedicated component:
```tsx
// Placed in src/components/profile/StudentProfileModal.tsx
interface StudentProfileModalProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```
Mounted once in `src/app/admin/dashboard/page.tsx`:
```tsx
<StudentProfileModal 
  student={selectedStudent} 
  open={!!selectedStudent} 
  onOpenChange={(open) => !open && setSelectedStudent(null)} 
/>
```

### 4.2 Modal Header & Hero Section
Located at the top of the dialog, giving instant situational context:
- **Left**: Large rounded student avatar / photo.
- **Center**:
  - Student Name (e.g. "Rahul Sharma")
  - Student Unique ID Chip with copy button: `#STU-9X82-KPL`
  - Course Chip: `BCA • 2026-2029 Batch`
  - Admitted By Worker Chip: `Admitted by Ramesh Kumar (ramesh@company.com)`
- **Right**:
  - Status Badge with pastel background (`Enrolled`, `Action Needed`, `In Process`, `Rejected`, `Cancelled`)
  - Admission Date: `14 Oct 2026`

### 4.3 Tab Navigation
Three distinct, accessible tabs:
1. **`Fees`** (Icon: `ReceiptText` from `lucide-react`)
2. **`Documents`** (Icon: `FileText` from `lucide-react`)
3. **`Payments`** (Icon: `CreditCard` from `lucide-react`)

---

### 4.4 Tab 1: Fees Tab Specification

The Fees Tab provides a clear financial overview and installment schedule.

#### 1. 5-Metric Financial Summary Card
Displayed at the top of the Fees tab in a high-contrast pastel grid:
| Metric | Example Value | Visual Token & Meaning |
|---|---|---|
| **Total Fee** | `₹1,20,000` | Slate neutral (`bg-slate-50 border-slate-200`) — Gross tuition fee |
| **Discount** | `₹20,000` | Emerald pastel (`bg-emerald-50 text-emerald-700`) — Scholarship / concession |
| **Net Fee** | `₹1,00,000` | Blue pastel (`bg-blue-50 text-blue-700`) — Payable tuition amount |
| **Paid** | `₹60,000` | Purple pastel (`bg-purple-50 text-purple-700`) — Total amount collected to date |
| **Balance Due** | `₹40,000` | Amber / Rose pastel (`bg-amber-50 text-amber-800 font-bold`) — Remaining due |

- Includes a **visual payment progress bar**:
  - `60% Paid (₹60,000 of ₹1,00,000)` with a smooth gradient fill (`from-blue-500 to-emerald-500`).

#### 2. Installment Timeline Schedule
A vertical timeline tracing all scheduled installments:
- **Nodes**:
  - `PAID`: Solid emerald circle with checkmark icon (`Check`).
  - `PENDING`: Solid amber circle with clock icon (`Clock`).
  - `OVERDUE`: Solid red circle with alert icon (`AlertCircle`).
  - `UPCOMING`: Slate outlined circle.
- **Node Content**:
  - Installment Title (e.g., "1st Installment (At Admission)")
  - Amount: `₹30,000`
  - Due Date: `14 Oct 2026`
  - Status Badge: `PAID` (green) / `PENDING` (amber) / `UPCOMING` (slate)
  - Payment Details (when paid): `Paid on 14 Oct 2026 via UPI QR (UTR: UPI-329482930192)`

---

### 4.5 Tab 2: Documents Tab Specification

The Documents Tab displays the student's academic and identity verification dossier.

#### 1. Single Consolidated PDF Dossier Card
Prominent hero card for the primary unified PDF upload:
- Icon: Large red/slate `FileText` PDF icon.
- File Name: `Rahul_Sharma_Admission_Dossier.pdf`
- File Size: `2.4 MB`
- Uploaded Date: `14 Oct 2026, 10:30 AM`
- Verification Status: `Verified` (green badge)
- Actions:
  - **"Preview PDF" Button**: Opens in-browser viewer / iframe modal.
  - **"Download PDF" Button**: Triggers direct file download.

#### 2. Academic Credentials & Verification Checklist
Itemized list of required documents:
1. **10th Marksheet & Passing Certificate** — `Verified` — CBSE 2018 (85%)
2. **12th Marksheet & Passing Certificate** — `Verified` — CBSE 2020 (78%)
3. **Graduation Degree / Marksheet** — `Verified` — BCA 2020-2023
4. **Identity Proof (Aadhaar Card / Passport)** — `Verified`
5. **Student Passport Photo** — `Verified` — With thumbnail preview

---

### 4.6 Tab 3: Payments Tab Specification

The Payments Tab provides an itemized audit ledger of every transaction made for this student.

#### 1. Detailed Transaction Cards
Each transaction card features:
- **Card Header**:
  - Transaction Amount: `₹30,000` (Bold, prominent)
  - "Verified" Badge: Emerald pill with checkmark (`CheckCircle2` icon)
  - Date & Timestamp: `14 Oct 2026, 10:30 AM`
- **Transaction Details Grid**:
  - **Payment Method**: `UPI QR` / `Bank Transfer (NEFT/RTGS)`
  - **UTR / Reference ID**: `UPI-329482930192` with an interactive "Copy" button (`Copy` icon)
  - **Bank Details**: `HDFC Bank - Boss Official Account (Acc #...49182)`
  - **Attribution**: Admitted and recorded by `Ramesh Kumar`
- **Card Action**:
  - **"View Payment Screenshot" Button**: Secondary outline button with eye icon (`Eye`). Clicking it opens the Screenshot Lightbox.

#### 2. Payment Screenshot Lightbox Modal (`PaymentScreenshotModal`)
- Displays the verified screenshot of the payment receipt.
- Features:
  - High-resolution receipt image preview.
  - Receipt details overlay: UTR number, Date, Amount.
  - Zoom-in / Zoom-out controls.
  - "Download Receipt" and "Close" buttons.

---

## 5. Comprehensive Data Contracts & TypeScript Schemas

All types will be consolidated in `src/types/student.ts` for unified use across Dashboard (R1), Wizard (R2), and Profile (R3):

```ts
export type StudentStatus = 
  | 'Total Students'
  | 'Action Needed' 
  | 'In Process' 
  | 'Enrolled' 
  | 'Rejected' 
  | 'Cancelled';

export type PaymentMethodType = 'UPI' | 'UPI QR' | 'Bank Transfer' | 'Cash' | 'Card';

export type InstallmentStatus = 'PAID' | 'PENDING' | 'OVERDUE' | 'UPCOMING';

export interface AcademicRecord {
  tenthSchool: string;
  tenthBoard?: string;
  tenthMarks: string;
  tenthYear: string;
  twelfthSchool: string;
  twelfthBoard?: string;
  twelfthStream?: string;
  twelfthMarks: string;
  twelfthYear: string;
  graduationCollege?: string;
  graduationCourse?: string;
  graduationMarks?: string;
  graduationYear?: string;
}

export interface FeeSummary {
  totalFee: number;      // e.g. 120000
  discount: number;      // e.g. 20000
  netFee: number;        // e.g. 100000 (totalFee - discount)
  paidAmount: number;    // e.g. 60000
  balanceDue: number;    // e.g. 40000 (netFee - paidAmount)
}

export interface InstallmentRecord {
  id: string;
  title: string;         // e.g. "1st Installment (At Admission)"
  dueDate: string;       // e.g. "14 Oct 2026"
  amount: number;        // e.g. 30000
  status: InstallmentStatus;
  paidDate?: string;     // e.g. "14 Oct 2026, 10:30 AM"
  paymentMethod?: PaymentMethodType;
  utr?: string;
}

export interface PaymentRecord {
  id: string;
  amount: number;        // e.g. 30000
  date: string;          // e.g. "14 Oct 2026, 10:30 AM"
  method: PaymentMethodType;
  utr: string;           // e.g. "UPI-329482930192"
  bankDetails: string;   // e.g. "HDFC Bank (Boss Official A/C)"
  screenshotUrl?: string;
  verified: boolean;     // true -> shows green "Verified" badge
  collectedBy?: string;  // e.g. "Ramesh Kumar"
}

export interface DocumentRecord {
  id: string;
  title: string;         // e.g. "Consolidated Admission Dossier (PDF)"
  fileName: string;      // e.g. "Rahul_Sharma_Academic_Records.pdf"
  fileSize: string;      // e.g. "2.4 MB"
  uploadDate: string;    // e.g. "14 Oct 2026"
  url: string;
  type: 'PDF' | 'IMAGE';
  verified: boolean;
}

export interface Student {
  id: string;            // e.g. "STU-9X82-KPL"
  name: string;          // e.g. "Rahul Sharma"
  email: string;         // e.g. "rahul.sharma@example.com"
  phone: string;         // e.g. "+91 98765 43210"
  guardianName?: string;
  dob?: string;
  gender?: string;
  address?: string;
  course: string;        // e.g. "BCA"
  session: string;       // e.g. "2026–2029"
  batch?: string;        // e.g. "Morning Shift"
  status: Exclude<StudentStatus, 'Total Students'>;
  date: string;          // e.g. "14 Oct 2026, 10:30 AM"
  workerName: string;    // e.g. "Ramesh Kumar"
  workerEmail: string;   // e.g. "ramesh@company.com"
  academic: AcademicRecord;
  fees: FeeSummary;
  installments: InstallmentRecord[];
  payments: PaymentRecord[];
  documents: DocumentRecord[];
  photoUrl?: string;
}
```

---

## 6. Proposed Code Changes & File Map

### 6.1 Component Hierarchy

```
src/
├── types/
│   └── student.ts                        [NEW: Shared TypeScript interfaces]
├── data/
│   └── mockStudents.ts                   [NEW: 10-12 rich student records with full fees & payments]
├── components/
│   ├── admission/
│   │   ├── AdmissionWizard.tsx           [NEW: 3-step admission form component]
│   │   ├── TopProgressBar.tsx            [NEW: Stepper indicator with numbers & icons]
│   │   ├── FormErrorAlert.tsx            [NEW: Red top alert banner for inline validation]
│   │   ├── StepStudentDetails.tsx        [NEW: Step 1 fields + single PDF upload]
│   │   ├── StepFeeDetails.tsx            [NEW: Step 2 fee calculations & payments]
│   │   └── StepReviewSubmit.tsx          [NEW: Step 3 comprehensive verification]
│   └── profile/
│       ├── StudentProfileModal.tsx       [NEW: Controlled dialog with hero header & tab navigation]
│       ├── FeesTab.tsx                   [NEW: 5-metric summary card + installment timeline]
│       ├── DocumentsTab.tsx              [NEW: Single PDF dossier card + credentials]
│       ├── PaymentsTab.tsx               [NEW: Transaction cards + UTR + verified badge]
│       └── PaymentScreenshotModal.tsx    [NEW: Lightbox for payment receipt screenshots]
└── app/
    ├── worker/
    │   └── admission/
    │       └── page.tsx                  [EDIT: Embed AdmissionWizard]
    └── admin/
        └── dashboard/
            └── page.tsx                  [EDIT: Integrate StudentProfileModal & + Add Student trigger]
```

---

## 7. Comparative Code Snippets (Before vs Proposed)

### 7.1 Add Student Step 1: Single PDF Upload & Personal Fields

#### BEFORE (`src/app/worker/admission/page.tsx:59-83`):
```tsx
<form onSubmit={handleNext} className="space-y-6">
  <div className="space-y-2">
    <Label>Full Name</Label>
    <Input value={studentName} onChange={(e) => setStudentName(e.target.value)} required />
  </div>
  
  <div className="space-y-2">
    <Label>Student Photo (Will be auto-compressed)</Label>
    <Input type="file" accept="image/*" onChange={handlePhotoUpload} required />
  </div>

  <div className="grid grid-cols-2 gap-4">
    <div className="space-y-2">
      <Label>10th Marks (%)</Label>
      <Input type="number" required />
    </div>
    <div className="space-y-2">
      <Label>10th Passing Year</Label>
      <Input type="text" required />
    </div>
  </div>
  
  <Button type="submit" className="w-full">Next: Payment Details</Button>
</form>
```

#### PROPOSED (`src/components/admission/StepStudentDetails.tsx`):
```tsx
<div className="space-y-6">
  {/* Top Inline Validation Alert */}
  {errors.length > 0 && <FormErrorAlert errors={errors} />}

  {/* Personal Details Section */}
  <div className="space-y-4">
    <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
      <User className="w-4 h-4 text-primary" /> Personal Information
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label>Full Name <span className="text-destructive">*</span></Label>
        <Input 
          value={form.name} 
          onChange={(e) => updateForm({ name: e.target.value })} 
          placeholder="e.g. Rahul Sharma"
          className={hasError('name') ? 'border-destructive' : ''}
        />
      </div>
      <div>
        <Label>Mobile / WhatsApp Number <span className="text-destructive">*</span></Label>
        <Input 
          value={form.phone} 
          onChange={(e) => updateForm({ phone: e.target.value })} 
          placeholder="e.g. +91 98765 43210"
          className={hasError('phone') ? 'border-destructive' : ''}
        />
      </div>
      <div>
        <Label>Email Address <span className="text-destructive">*</span></Label>
        <Input 
          type="email" 
          value={form.email} 
          onChange={(e) => updateForm({ email: e.target.value })} 
          placeholder="rahul@example.com"
          className={hasError('email') ? 'border-destructive' : ''}
        />
      </div>
      <div>
        <Label>Guardian / Father's Name <span className="text-destructive">*</span></Label>
        <Input 
          value={form.guardianName} 
          onChange={(e) => updateForm({ guardianName: e.target.value })} 
          placeholder="e.g. Rameshwar Sharma"
        />
      </div>
    </div>
  </div>

  {/* Course Selection */}
  <div className="space-y-4">
    <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
      <GraduationCap className="w-4 h-4 text-primary" /> Course & Academic Session
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label>Target Course <span className="text-destructive">*</span></Label>
        <select 
          className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
          value={form.course}
          onChange={(e) => updateForm({ course: e.target.value })}
        >
          <option value="">Select Course</option>
          <option value="BCA">BCA (Bachelor of Computer Applications)</option>
          <option value="B.Tech CSE">B.Tech (Computer Science & Engg)</option>
          <option value="B.Tech AI">B.Tech (AI & Data Science)</option>
          <option value="BBA">BBA (Business Administration)</option>
          <option value="MCA">MCA (Master of Computer Applications)</option>
          <option value="MBA">MBA (Master of Business Admin)</option>
        </select>
      </div>
      <div>
        <Label>Academic Session</Label>
        <Input value={form.session} onChange={(e) => updateForm({ session: e.target.value })} />
      </div>
    </div>
  </div>

  {/* Single PDF Upload Section */}
  <div className="space-y-4">
    <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
      <FileUp className="w-4 h-4 text-primary" /> Consolidated Student PDF Dossier
    </h3>
    <div className="border-2 border-dashed rounded-xl p-6 text-center hover:bg-slate-50 transition-colors">
      <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-2" />
      <p className="text-sm font-medium text-slate-700">Upload Single PDF containing 10th, 12th & ID Proofs</p>
      <p className="text-xs text-slate-400 mt-1">Accepts .PDF format up to 15MB</p>
      <Input 
        type="file" 
        accept="application/pdf" 
        onChange={handlePdfUpload} 
        className="mt-3 max-w-xs mx-auto" 
      />
      {pdfFile && (
        <div className="mt-3 p-2 bg-emerald-50 text-emerald-700 text-xs rounded-lg inline-flex items-center gap-2">
          <FileText className="w-4 h-4" />
          <span>{pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)</span>
        </div>
      )}
    </div>
  </div>
</div>
```

---

### 7.2 Student Profile Dialog: Tabs Interface

#### BEFORE (`src/app/admin/dashboard/page.tsx:114-169`):
```tsx
<DialogContent className="max-w-2xl">
  <DialogHeader>
    <DialogTitle className="text-2xl">Student Profile: {selectedStudent?.name}</DialogTitle>
  </DialogHeader>
  
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
    {/* Left Column: Academics */}
    <div className="space-y-4"> ... </div>
    {/* Right Column: Payment & Media */}
    <div className="space-y-4"> ... </div>
  </div>
</DialogContent>
```

#### PROPOSED (`src/components/profile/StudentProfileModal.tsx`):
```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto p-6">
    {/* Hero Header */}
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-primary/10 text-primary font-bold text-xl flex items-center justify-center">
          {student.name.charAt(0)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-800">{student.name}</h2>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
              #{student.id}
            </span>
          </div>
          <p className="text-sm text-slate-500">{student.course} • Admitted by {student.workerName}</p>
        </div>
      </div>
      <StatusBadge status={student.status} />
    </div>

    {/* Tab Navigation */}
    <div className="flex border-b border-slate-200 gap-2 mt-4">
      <button 
        onClick={() => setActiveTab('fees')}
        className={cn(
          "px-4 py-2 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors",
          activeTab === 'fees' ? "border-primary text-primary font-semibold" : "border-transparent text-slate-500 hover:text-slate-700"
        )}
      >
        <ReceiptText className="w-4 h-4" /> Fees
      </button>
      <button 
        onClick={() => setActiveTab('documents')}
        className={cn(
          "px-4 py-2 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors",
          activeTab === 'documents' ? "border-primary text-primary font-semibold" : "border-transparent text-slate-500 hover:text-slate-700"
        )}
      >
        <FileText className="w-4 h-4" /> Documents
      </button>
      <button 
        onClick={() => setActiveTab('payments')}
        className={cn(
          "px-4 py-2 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors",
          activeTab === 'payments' ? "border-primary text-primary font-semibold" : "border-transparent text-slate-500 hover:text-slate-700"
        )}
      >
        <CreditCard className="w-4 h-4" /> Payments
      </button>
    </div>

    {/* Tab Content Panels */}
    <div className="pt-4">
      {activeTab === 'fees' && <FeesTab student={student} />}
      {activeTab === 'documents' && <DocumentsTab student={student} />}
      {activeTab === 'payments' && <PaymentsTab student={student} onOpenScreenshot={...} />}
    </div>
  </DialogContent>
</Dialog>
```

---

## 8. Verification Strategy & Acceptance Matrix

| Acceptance Criterion | Verification Method | Expected Outcome |
|---|---|---|
| **Add Student 3-Step Wizard** | Navigate to `/worker/admission` | Header displays exactly 3 steps: 1. Student Details, 2. Fee Details, 3. Review & Submit |
| **Top Progress Indicator** | Advance between steps 1, 2, 3 | Active step highlights in primary color; previous steps show checkmarks and filled lines |
| **Inline Validation Alert** | Submit Step 1 with empty Name | Prominent red alert banner appears at the top ("Please resolve errors: Student Name is required") |
| **Single PDF Upload** | Select a `.pdf` file in Step 1 | File name and size displayed with PDF icon; non-PDF rejected |
| **Fee Calculations** | Enter Total Fee & Discount | Net Fee and Balance Due auto-calculated accurately |
| **Review & Submit Screen** | Proceed to Step 3 | Comprehensive card displays all personal, academic, fee, and document details with confirmation |
| **Student Profile Tabs** | Click "View Details" on dashboard student | Modal opens with 3 working tabs: `Fees \| Documents \| Payments` |
| **Fees Summary Card** | Click "Fees" tab | 5 distinct metrics displayed: Total Fee, Discount, Net Fee, Paid, Balance Due |
| **Installment Timeline** | Inspect lower section of Fees tab | Vertical timeline displays all scheduled installments with status badges |
| **Payment History Cards** | Click "Payments" tab | Cards show Amount, Date, UTR, Bank Details, and green "Verified" badge |
| **Payment Screenshot Button** | Click "View Payment Screenshot" | Lightbox sub-modal opens showing payment receipt image |
| **Build & Lint Verification** | Run `npm run lint` & `npm run build` | Code compiles cleanly with zero errors |
