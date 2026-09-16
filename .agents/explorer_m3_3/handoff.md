# Handoff Report: UI/UX, Styling, Responsiveness & Interaction Design for Milestone 3 (R3 Comprehensive Student Profile with Tabs)

**Explorer Agent**: Explorer 3 (`explorer_m3_3`)  
**Mission**: Investigate UI/UX, styling tokens, component hierarchy, responsive layouts, and interaction flows for the Comprehensive Tabbed Student Profile (`Fees | Documents | Payments`).  
**Working Directory**: `C:\Users\satya\Desktop\New folder\admin-portal\.agents\explorer_m3_3`  
**Date**: 2026-09-15  

---

## 1. Observation

### 1.1 Existing Student Profile Implementation in Codebase
- **File**: `src/app/admin/dashboard/page.tsx` (Lines 86–338)
  - The student profile is currently implemented as an inline monolithic `<Dialog>` component triggered when a student is clicked in the list:
    ```tsx
    // Lines 36, 82, 87-92 in src/app/admin/dashboard/page.tsx:
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    ...
    onSelectStudent={(student) => setSelectedStudent(student)}
    ...
    <Dialog open={Boolean(selectedStudent)} onOpenChange={(open) => { if (!open) setSelectedStudent(null); }}>
      {selectedStudent && (
        <DialogContent className="max-w-2xl sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
    ```
  - **Deficiencies of Current Inline Modal**:
    - Flat, unsegmented structure: stacks contact banner, qualifications, fee summary, payments list, and documents dossier vertically in one single scrolling container.
    - **No tabbed interface**: Does not implement the required `Fees | Documents | Payments` navigation.
    - **No installment schedule**: Installments (`selectedStudent.installments`) are not rendered at all in `page.tsx`.
    - **No UTR copy button**: Transaction UTR (`pmt.utr`) is plain text with no copy interaction or clipboard feedback.
    - **No screenshot lightbox**: The document action simply fires an alert: `onClick={() => alert('Opening ${doc.fileName}')}` (Line 315).
    - Hardcoded maximum width of `max-w-2xl` makes financial tables and multi-column document metadata cramped.

### 1.2 Design System & Styling Environment
- **Framework & CSS**:
  - `package.json`: Next.js 16.3.5, React 19.2.8, Tailwind CSS v4 (`@tailwindcss/postcss: ^4`), `lucide-react: ^1.46.0`, `framer-motion: ^13.3.0`, `@base-ui/react: ^1.8.0`, `class-variance-authority: ^0.7.1`, `clsx: ^2.1.1`, `tailwind-merge: ^3.7.0`.
  - `components.json`: Style `base-nova`, `iconLibrary: "lucide"`, `baseColor: "neutral"`, `cssVariables: true`.
  - `src/app/globals.css`:
    - Tailwind v4 theme inline definitions:
      ```css
      --background: oklch(1 0 0);
      --foreground: oklch(0.145 0 0);
      --card: oklch(1 0 0);
      --card-foreground: oklch(0.145 0 0);
      --primary: oklch(0.205 0 0);
      --primary-foreground: oklch(0.985 0 0);
      --secondary: oklch(0.97 0 0);
      --muted: oklch(0.97 0 0);
      --muted-foreground: oklch(0.556 0 0);
      --destructive: oklch(0.577 0.245 27.325);
      --border: oklch(0.922 0 0);
      --radius: 0.625rem; /* 10px */
      ```
    - Computed border radiuses: `--radius-sm` (6px), `--radius-md` (8px), `--radius-lg` (10px), `--radius-xl` (14px), `--radius-2xl` (18px), `--radius-3xl` (22px).

### 1.3 Established CRM Color & Visual Language in M1 & M2
- In `src/components/dashboard/MetricsGrid.tsx` and `StatusBadge.tsx`:
  - **Blue** (Total / Identity / Primary): `bg-blue-50/80`, `border-blue-200/80`, `text-blue-950`, `text-blue-700`, `text-blue-600`
  - **Emerald** (Enrolled / Paid / Success / Verified): `bg-emerald-50/80`, `border-emerald-200/80`, `text-emerald-950`, `text-emerald-700`, `text-emerald-600`
  - **Amber** (Action Needed / Pending / Balance Due): `bg-amber-50/80`, `border-amber-200/80`, `text-amber-950`, `text-amber-800`, `text-amber-600`
  - **Rose** (Rejected / Overdue / Warning): `bg-rose-50/80`, `border-rose-200/80`, `text-rose-950`, `text-rose-700`, `text-rose-600`
  - **Purple** (In Process / Documents): `bg-purple-50/80`, `border-purple-200/80`, `text-purple-950`, `text-purple-700`
  - **Slate / Neutral** (Structure & Base): `bg-slate-50`, `border-slate-200`, `border-slate-100`, `text-slate-900`, `text-slate-700`, `text-slate-500`

### 1.4 Data Models Available in `src/types/student.ts`
- `Student`: `id`, `name`, `email`, `phone`, `course`, `status`, `date`, `workerName`, `workerEmail`, `academic`, `fees`, `installments`, `payments`, `documents`, `photoUrl`.
- `FeeSummary`: `totalFee: number`, `discount: number`, `netFee: number`, `paidAmount: number`, `balanceDue: number`.
- `InstallmentRecord`: `id: string`, `title: string`, `dueDate: string`, `amount: number`, `status: 'PAID' | 'PENDING' | 'OVERDUE'`, `paidDate?: string`.
- `PaymentRecord`: `id: string`, `amount: number`, `date: string`, `method: PaymentMethod`, `utr: string`, `bankDetails: string`, `screenshotUrl?: string`, `verified: boolean`.
- `DocumentRecord`: `id: string`, `title: string`, `fileName: string`, `fileSize: string`, `uploadDate: string`, `url: string`, `type: 'PDF' | 'IMAGE'`.

---

## 2. Logic Chain

1. **Extraction of Inline Profile Dialog**:
   - Because `page.tsx` lines 86–338 hold an unmaintainable inline modal with no tab support, we must encapsulate the student profile into `src/components/profile/StudentProfileModal.tsx`.
   - The modal should accept `{ student: Student | null; open: boolean; onOpenChange: (open: boolean) => void }`.
   - In `page.tsx`, replacing the inline JSX with `<StudentProfileModal student={selectedStudent} open={Boolean(selectedStudent)} onOpenChange={(open) => { if (!open) setSelectedStudent(null); }} />` maintains clean separation of concerns and fulfills `PROJECT.md` #9.

2. **Tabbed Architecture Selection (`Fees | Documents | Payments`)**:
   - A modern CRM profile modal requires immediate visual categorization.
   - Using controlled state `const [activeTab, setActiveTab] = useState<'fees' | 'documents' | 'payments'>('fees')` enables instant tab switching, keyboard navigation, and deep-linking between tabs (e.g. clicking "View 1 Transaction" from the Fees tab automatically switches to the Payments tab).
   - On desktop, a segmented control pill container (`bg-slate-100/90 p-1.5 rounded-xl flex gap-1.5`) provides tactile clarity.
   - On mobile (<768px), the tabs must span 100% width (`grid grid-cols-3 gap-1`) with min 44px touch targets to prevent accidental taps.

3. **Fees Tab & Installment Timeline Architecture**:
   - **5-Metric Card**:
     - The five key metrics (Total Fee, Discount, Net Fee, Paid, Balance Due) require distinct visual hierarchy.
     - Total Fee (Gross) is neutral slate.
     - Discount is soft emerald (`text-emerald-700 font-bold`).
     - Net Fee (Payable) is highlighted in brand blue (`bg-blue-50/70 border-blue-200 text-blue-950`).
     - Paid Amount is solid emerald (`bg-emerald-50/80 border-emerald-200 text-emerald-700`).
     - Balance Due is the primary call-to-action metric: when `balanceDue > 0`, it uses warm amber alert styling (`bg-amber-50 border-amber-300 text-amber-950`); when `balanceDue === 0`, it shifts to emerald with "Fully Settled" badge.
     - A dual-tone visual progress bar (`(paid / net) * 100%`) under the cards provides instant visual comprehension.
   - **Visual Installment Timeline Schedule**:
     - Connects chronological payment milestones using a vertical timeline with connecting tracks (`w-0.5 bg-slate-200`).
     - Milestone nodes display dedicated state icons:
       - `PAID`: `bg-emerald-500 text-white ring-4 ring-emerald-100` with `Check` icon.
       - `PENDING`: `bg-white border-2 border-amber-500 text-amber-600 ring-4 ring-amber-50` with `Clock` icon.
       - `OVERDUE`: `bg-rose-500 text-white ring-4 ring-rose-100` with `AlertTriangle` icon.
     - Cards show installment title, formatted amount (`₹XX,XXX`), due/paid date, and status badge.

4. **Documents Tab Architecture (Consolidated Single PDF Dossier)**:
   - In modern admissions (and per `ORIGINAL_REQUEST.md` R2 & `PROJECT.md` #11), the single consolidated PDF dossier is the centerpiece of the student's legal academic record.
   - The Documents Tab must feature:
     - Student Identity & Photo card (with avatar initials fallback in case of missing asset).
     - Featured Dossier Banner: A large highlighted card (`bg-gradient-to-r from-blue-50/80 to-slate-50 border-blue-200`) showing PDF icon, file name, file size (`3.4 MB`), upload date, and dual action buttons: "Preview Dossier" (`Eye`) and "Download PDF" (`Download`).
     - Secondary credentials checklist: 10th marksheet, 12th marksheet, Aadhaar ID verification status.
     - In-portal Document Preview Modal: Renders an in-app viewer instead of the current disruptive browser `alert()`.

5. **Payments Tab & Screenshot Lightbox Architecture**:
   - Transaction cards require clear financial accounting data:
     - Amount in bold typography (`text-xl font-extrabold text-slate-900`).
     - Payment Method pill (`UPI QR`, `Bank Transfer`, `Cash`) with corresponding Lucide icons (`QrCode`, `Building2`, `Banknote`).
     - Verified status badge: `bg-emerald-50 text-emerald-700 border-emerald-200` with `CheckCircle2` icon.
     - UTR Reference with 1-click Copy Button: Calls `navigator.clipboard.writeText(utr)` and transitions icon from `Copy` to `Check` in green with a 2-second timeout feedback.
     - Official Receiving Bank Details (e.g. "HDFC Bank (Boss Official A/C)").
     - "View Payment Screenshot" button: Launches `PaymentScreenshotModal` lightbox.
   - Lightbox Modal:
     - Translucent backdrop overlay (`bg-slate-900/70 backdrop-blur-sm`).
     - Renders a clean digital transaction receipt slip with merchant name, amount, UTR, date, bank account, and an official green "VERIFIED & RECONCILED" seal. If a screenshot image exists, it displays the image with zoom/download controls.

---

## 3. UI/UX Design Specifications

### 3.1 Component Hierarchy for `src/components/profile/`
```
src/components/profile/
├── StudentProfileModal.tsx      // Main controlled dialog with Hero Header & Tab Navigation
├── FeesTab.tsx                  // 5-Metric summary card + Progress bar + Installment timeline
├── DocumentsTab.tsx             // Identity banner + Featured Single PDF card + Document archive + Preview modal
├── PaymentsTab.tsx              // Detailed transaction cards + UTR copy + Lightbox trigger
├── PaymentScreenshotModal.tsx   // High-res receipt lightbox / modal with zoom & verification stamp
└── DocumentPreviewModal.tsx     // In-app document previewer (replaces alert('Opening...'))
```

---

### 3.2 Tabbed Navigation Specifications

#### Layout & Styling
- Container:
  ```tsx
  <div className="w-full bg-slate-100/90 p-1.5 rounded-xl border border-slate-200/80 grid grid-cols-3 gap-1 sm:flex sm:items-center sm:gap-2">
  ```
- Individual Tab Button:
  - **Active State**:
    ```tsx
    className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-white text-slate-900 font-bold text-xs sm:text-sm shadow-xs border border-slate-200/50 transition-all cursor-pointer"
    ```
  - **Inactive State**:
    ```tsx
    className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white/50 font-semibold text-xs sm:text-sm transition-all cursor-pointer"
    ```
- Tab Items:
  1. **Fees**: Icon `CreditCard` (`w-4 h-4 text-emerald-600`). Badge: `₹{fees.balanceDue > 0 ? fees.balanceDue.toLocaleString('en-IN') + ' Due' : 'Paid'}` (`hidden sm:inline text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold`).
  2. **Documents**: Icon `FileText` (`w-4 h-4 text-blue-600`). Badge: `{documents.length} Files` (`hidden sm:inline text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold`).
  3. **Payments**: Icon `Receipt` (`w-4 h-4 text-purple-600`). Badge: `{payments.length} Txn` (`hidden sm:inline text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold`).

#### Motion & Switching
- With `framer-motion`: Wrap tab panels in `<AnimatePresence mode="wait">` with `<motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>`.

---

### 3.3 Fees Tab Specifications

#### Part 1: 5-Metric Financial Summary Card
- **Layout**:
  - Desktop: `grid grid-cols-5 gap-3`
  - Mobile (<768px): `grid grid-cols-2 gap-2.5` with Balance Due taking `col-span-2`
- **Cards Detail**:
  1. **Total Fee (Gross)**:
     - Classes: `p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-center flex flex-col justify-between`
     - Icon: `Coins className="w-4 h-4 text-slate-500 mx-auto mb-1"`
     - Label: `text-[11px] font-semibold text-slate-500 uppercase tracking-wider` ("Total Course Fee")
     - Value: `text-lg sm:text-xl font-extrabold text-slate-900 mt-1` (`₹1,20,000`)
     - Subtitle: `text-[10px] text-slate-400 mt-0.5` ("Gross Tuition")
  2. **Scholarship / Discount**:
     - Classes: `p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100 text-center flex flex-col justify-between`
     - Icon: `TrendingDown className="w-4 h-4 text-emerald-600 mx-auto mb-1"`
     - Label: `text-[11px] font-semibold text-emerald-700 uppercase tracking-wider` ("Scholarship")
     - Value: `text-lg sm:text-xl font-extrabold text-emerald-700 mt-1` (`-₹15,000`)
     - Subtitle: `text-[10px] text-emerald-600/80 mt-0.5` ("Concession applied")
  3. **Net Fee (Payable)**:
     - Classes: `p-3.5 bg-blue-50/70 rounded-xl border border-blue-200/80 text-center flex flex-col justify-between`
     - Icon: `Calculator className="w-4 h-4 text-blue-600 mx-auto mb-1"`
     - Label: `text-[11px] font-semibold text-blue-700 uppercase tracking-wider` ("Net Fee")
     - Value: `text-lg sm:text-xl font-extrabold text-blue-950 mt-1` (`₹1,05,000`)
     - Subtitle: `text-[10px] text-blue-600 mt-0.5` ("(Total − Concession)")
  4. **Paid Amount**:
     - Classes: `p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-200 text-center flex flex-col justify-between`
     - Icon: `CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto mb-1"`
     - Label: `text-[11px] font-semibold text-emerald-800 uppercase tracking-wider` ("Paid Amount")
     - Value: `text-lg sm:text-xl font-extrabold text-emerald-700 mt-1` (`₹55,000`)
     - Subtitle: `text-[10px] text-emerald-700 mt-0.5 font-medium` (`{Math.round((paid / net) * 100)}% Collected`)
  5. **Balance Due**:
     - Classes (if `balanceDue > 0`): `p-3.5 bg-amber-50/90 rounded-xl border-2 border-amber-300 text-center flex flex-col justify-between col-span-2 sm:col-span-1 shadow-2xs`
     - Classes (if `balanceDue === 0`): `p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-center flex flex-col justify-between col-span-2 sm:col-span-1`
     - Icon: `AlertCircle className="w-4 h-4 text-amber-600 mx-auto mb-1"`
     - Label: `text-[11px] font-bold text-amber-800 uppercase tracking-wider` ("Balance Due")
     - Value: `text-xl sm:text-2xl font-black text-amber-900 mt-1` (`₹50,000`)
     - Subtitle: `text-[10px] text-amber-700 mt-0.5 font-semibold` ("Scheduled across installments")

#### Part 2: Visual Fee Progress Bar
- Container: `p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2`
- Bar:
  ```tsx
  <div className="flex items-center justify-between text-xs">
    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
      <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Payment Recovery Progress
    </span>
    <span className="font-bold text-slate-900">{percentage}% Settled</span>
  </div>
  <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex shadow-inner">
    <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${percentage}%` }} />
    <div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${100 - percentage}%` }} />
  </div>
  <div className="flex items-center justify-between text-[11px] text-slate-500">
    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Paid: ₹{paid.toLocaleString('en-IN')}</span>
    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Remaining: ₹{due.toLocaleString('en-IN')}</span>
  </div>
  ```

#### Part 3: Visual Installment Timeline Schedule
- Vertical connected list with step markers:
  - Header: Title `Installment Schedule & Due Dates` with badge `{installments.length} Stages`.
  - Timeline Node & Connecting Line:
    - Node container: `relative pl-8 sm:pl-10 pb-6 last:pb-0`
    - Vertical track: `<div className="absolute left-3.5 sm:left-4.5 top-5 bottom-0 w-0.5 bg-slate-200 last:hidden" />`
    - Node Icon:
      - When `PAID`: `absolute left-1 sm:left-2 top-1.5 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-4 ring-emerald-100 shadow-xs` with `<Check className="w-3.5 h-3.5 stroke-[3]" />`
      - When `PENDING`: `absolute left-1 sm:left-2 top-1.5 w-6 h-6 rounded-full bg-white border-2 border-amber-500 text-amber-600 flex items-center justify-center ring-4 ring-amber-50 shadow-xs` with `<Clock className="w-3 h-3 stroke-[2.5]" />`
      - When `OVERDUE`: `absolute left-1 sm:left-2 top-1.5 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center ring-4 ring-rose-100 shadow-xs` with `<AlertTriangle className="w-3 h-3" />`
    - Milestone Content Card:
      ```tsx
      <div className={cn(
        "p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs",
        inst.status === 'PAID' && "bg-white border-slate-200/90",
        inst.status === 'PENDING' && "bg-amber-50/40 border-amber-200",
        inst.status === 'OVERDUE' && "bg-rose-50/50 border-rose-200"
      )}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-slate-900 text-sm">{inst.title}</h4>
            {inst.status === 'PAID' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                <Check className="w-3 h-3" /> Paid
              </span>
            )}
            {inst.status === 'PENDING' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                <Clock className="w-3 h-3" /> Pending
              </span>
            )}
            {inst.status === 'OVERDUE' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold">
                <AlertTriangle className="w-3 h-3" /> Overdue
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{inst.status === 'PAID' ? `Settled on ${inst.paidDate || inst.dueDate}` : `Due by ${inst.dueDate}`}</span>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <div className="font-extrabold text-base sm:text-lg text-slate-900">₹{inst.amount.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-slate-500">{inst.status === 'PAID' ? 'Verified Settlement' : 'Upcoming Stage'}</div>
        </div>
      </div>
      ```

---

### 3.4 Documents Tab Specifications

#### Part 1: Student Identity & Credentials Summary
- Top Banner:
  - Left: Student Photo or Fallback Avatar:
    - `<div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-xl sm:text-2xl flex items-center justify-center border-2 border-white shadow-md shrink-0">`
    - If `photoUrl` is valid, render `<img src={photoUrl} className="w-full h-full object-cover rounded-2xl" onError={...fallback} />`.
  - Right: Quick Credentials Check:
    - Verified Qualification Pills:
      - `10th Standard: {tenthMarks} ({tenthYear})` (`CheckCircle2 className="w-3.5 h-3.5 text-emerald-600"`)
      - `12th Standard: {twelfthMarks} ({twelfthYear})` (`CheckCircle2 className="w-3.5 h-3.5 text-emerald-600"`)
      - `Course: {course}` (`GraduationCap className="w-3.5 h-3.5 text-blue-600"`)

#### Part 2: Featured Single PDF Admission Dossier Card
- Banner Container:
  `bg-gradient-to-r from-blue-50/90 via-indigo-50/40 to-slate-50 border border-blue-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4`
- Left section:
  - PDF Icon: `w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 shadow-2xs` with `<FileText className="w-6 h-6 stroke-[2.2]" />`
  - Text:
    - Title: `Consolidated Admission Dossier (Single PDF)`
    - File Name: `font-mono text-xs font-semibold text-slate-800 truncate max-w-xs sm:max-w-md`
    - Metadata Badges:
      - Size Badge: `bg-slate-200/80 text-slate-700 text-[11px] px-2 py-0.5 rounded font-medium` (`3.4 MB`)
      - Date Badge: `text-[11px] text-slate-500` (`Uploaded on 14 Oct 2026`)
      - Verified Tag: `bg-emerald-100 text-emerald-800 text-[11px] px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1` (`<ShieldCheck className="w-3 h-3" /> Academic Verified`)
- Right action buttons:
  - Preview Button: `Button variant="outline" className="h-9 px-3.5 text-xs font-semibold gap-1.5 border-slate-300 bg-white hover:bg-slate-50 text-slate-800 shadow-2xs cursor-pointer"`
  - Download Button: `Button className="h-9 px-3.5 text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer"`

#### Part 3: Secondary Documents List
- Grid: `grid grid-cols-1 sm:grid-cols-2 gap-3`
- Renders additional documents (Aadhaar Card, Transfer Certificate, 10th/12th mark sheets) with file size, upload date, and Preview / Download buttons.

#### Part 4: Document Preview Lightbox Modal (`DocumentPreviewModal`)
- Modal Dialog: `max-w-2xl w-full p-0 overflow-hidden rounded-2xl`
- Mock Document Canvas showing:
  - Official institution header ("APEX UNIVERSITY - ADMISSION DOSSIER")
  - Student photo, ID, Name, Date
  - Verified watermark seal stamp
  - "Page 1 of 3 (Official Archival Copy)"
  - Download & Close buttons

---

### 3.5 Payments Tab Specifications

#### Part 1: Itemized Transaction Cards
- Card Container:
  `p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all space-y-4`
- **Card Top Row**:
  - Left:
    - Amount: `text-xl sm:text-2xl font-black text-slate-900` (`₹55,000`)
    - Method Badge:
      `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold`
      (e.g. `<QrCode className="w-3.5 h-3.5 text-blue-600" /> UPI QR`)
  - Right:
    - Verification Badge:
      - If `verified === true`:
        `inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs`
        (`<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified Settlement`)
      - If `verified === false`:
        `inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold`
        (`<Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Accounts Audit`)

- **Card Middle Row (Key-Value Grid)**:
  - 2-Column Responsive Grid: `grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs`
  - **UTR Reference with Copy Button**:
    ```tsx
    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2">
      <div className="min-w-0">
        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">UTR / Transaction Ref</span>
        <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 truncate block">{pmt.utr}</span>
      </div>
      <button
        type="button"
        onClick={() => copyUtr(pmt.utr)}
        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all shrink-0 cursor-pointer"
        title="Copy UTR Reference"
      >
        {copiedUtr === pmt.utr ? (
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 px-1">
            <Check className="w-3.5 h-3.5" /> Copied!
          </span>
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
    ```
  - **Receiving Bank Details**:
    ```tsx
    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5">
      <div className="p-2 rounded-lg bg-blue-100/80 text-blue-700 shrink-0">
        <Building2 className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Receiving Bank Account</span>
        <span className="font-semibold text-slate-800 text-xs truncate block">{pmt.bankDetails}</span>
      </div>
    </div>
    ```
  - **Timestamp & Voucher ID**:
    - `flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100`
    - Date: `<span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {pmt.date}</span>`
    - Voucher: `<span className="font-mono text-[11px]">Voucher #{pmt.id}</span>`

- **Card Bottom Row (Action Bar)**:
  - "View Payment Screenshot" button:
    ```tsx
    <Button
      variant="outline"
      size="sm"
      className="w-full sm:w-auto h-9 px-4 text-xs font-semibold gap-2 border-blue-200 bg-blue-50/50 hover:bg-blue-100/70 text-blue-900 rounded-xl cursor-pointer"
      onClick={() => setSelectedPaymentForScreenshot(pmt)}
    >
      <Image className="w-3.5 h-3.5 text-blue-600" />
      View Payment Screenshot
      <ExternalLink className="w-3 h-3 text-blue-400 ml-1" />
    </Button>
    ```

#### Part 2: Payment Screenshot Lightbox Modal (`PaymentScreenshotModal`)
- Dialog Container: `max-w-md sm:max-w-lg w-full p-0 overflow-hidden rounded-2xl bg-white shadow-2xl`
- Header:
  - Title: "Payment Receipt Verification"
  - Subtitle: `UTR: {payment.utr} • {payment.date}`
  - Close button: `X` icon
- Body:
  - High-res simulated / real receipt slip:
    - Receipt Card: `bg-slate-900 text-white p-5 rounded-2xl m-4 space-y-4 relative overflow-hidden shadow-xl`
    - Subtle gradient & background pattern: `bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950`
    - Header: Apex Institute Official Logo + "Payment Confirmation Voucher"
    - Amount Banner:
      - `text-3xl font-black text-emerald-400 tracking-tight` (`₹55,000.00`)
      - "Success • Instant Settlement"
    - Verification Stamp:
      - A tilted circular stamp: `border-2 border-emerald-400 text-emerald-400 font-mono text-[10px] uppercase font-black px-2.5 py-1 rounded rotate-[-8deg] tracking-widest` ("VERIFIED & RECONCILED")
    - Key Metadata:
      - Payer / Student Name: `{student.name}`
      - Payer Student ID: `#{student.id}`
      - Transaction Mode: `{payment.method}`
      - UTR Number: `{payment.utr}`
      - Beneficiary Account: `{payment.bankDetails}`
      - Payment Timestamp: `{payment.date}`
- Footer:
  - "Copy UTR Reference" (`Button variant="outline"`)
  - "Download Receipt Slip" (`Button bg-blue-600`)
  - "Close" (`Button variant="ghost"`)

---

## 4. Responsive Breakpoint Specification

| Element | Mobile View (`<768px`) | Desktop View (`>=768px`) |
| :--- | :--- | :--- |
| **Modal Container** | `w-[calc(100%-1rem)] max-h-[92vh] p-3.5` | `max-w-3xl sm:max-w-4xl max-h-[90vh] p-6` |
| **Hero Header** | Stacked items; avatar 48x48px; wrap contact chips | Horizontal flex; avatar 56x56px; inline contact pills |
| **Tab Navigation Bar** | Equal 3-column grid `grid-cols-3`; compact labels; icons centered | Horizontal flex with gap-2; full labels + badge counters |
| **Fees 5-Metric Card** | 2-column grid; Balance Due spans `col-span-2` | 5-column single row `grid-cols-5` |
| **Installment Timeline** | Stacked card (status + date top, amount bottom); 24px marker | Horizontal flex card (title + date left, amount right); 28px marker |
| **Featured PDF Card** | Stacked (PDF icon top, buttons full width bottom) | Horizontal row (PDF icon left, actions right) |
| **Documents Grid** | 1 column `grid-cols-1` | 2 columns `grid-cols-2` |
| **Payment Cards** | Stacked rows; UTR copy full width; View Screenshot full width | Clean key-value grid; inline UTR copy; compact action button |
| **Screenshot Lightbox** | Centered sheet `w-[calc(100%-1.5rem)]`; scrollable receipt | Centered dialog `max-w-lg`; full receipt visual canvas |

---

## 5. Exact Icon Usage & Token Class Reference

### 5.1 Lucide Icons Reference
| Feature Area | Icon Name | Import | Classes |
| :--- | :--- | :--- | :--- |
| **Tabs: Fees** | `CreditCard` | `lucide-react` | `w-4 h-4 text-emerald-600` |
| **Tabs: Documents** | `FileText` | `lucide-react` | `w-4 h-4 text-blue-600` |
| **Tabs: Payments** | `Receipt` | `lucide-react` | `w-4 h-4 text-purple-600` |
| **Total Gross Fee** | `Coins` | `lucide-react` | `w-4 h-4 text-slate-500` |
| **Scholarship Discount** | `TrendingDown` | `lucide-react` | `w-4 h-4 text-emerald-600` |
| **Net Fee** | `Calculator` | `lucide-react` | `w-4 h-4 text-blue-600` |
| **Paid Amount** | `CheckCircle2` | `lucide-react` | `w-4 h-4 text-emerald-600` |
| **Balance Due** | `AlertCircle` | `lucide-react` | `w-4 h-4 text-amber-600` |
| **Timeline Paid Node** | `Check` | `lucide-react` | `w-3.5 h-3.5 stroke-[3]` |
| **Timeline Pending Node**| `Clock` | `lucide-react` | `w-3 h-3 stroke-[2.5]` |
| **Timeline Overdue Node**| `AlertTriangle`| `lucide-react` | `w-3 h-3 text-white` |
| **Dossier PDF Icon** | `FileText` | `lucide-react` | `w-6 h-6 stroke-[2.2] text-red-600` |
| **Preview Action** | `Eye` | `lucide-react` | `w-3.5 h-3.5` |
| **Download Action** | `Download` | `lucide-react` | `w-3.5 h-3.5` |
| **Copy UTR Action** | `Copy` / `Check` | `lucide-react` | `w-3.5 h-3.5` |
| **Bank Account** | `Building2` | `lucide-react` | `w-4 h-4 text-blue-700` |
| **UPI QR Method** | `QrCode` | `lucide-react` | `w-3.5 h-3.5 text-blue-600` |
| **Cash Method** | `Banknote` | `lucide-react` | `w-3.5 h-3.5 text-emerald-600` |
| **View Screenshot** | `Image` | `lucide-react` | `w-3.5 h-3.5 text-blue-600` |

---

## 6. Caveats

1. **No Backend Attachment Storage**:
   - `DocumentRecord.url` in `mockStudents.ts` is currently `'#'`, and `photoUrl` is a relative placeholder path.
   - The UI MUST implement high-fidelity simulated/canvas previews and fallback image handlers (`onError`) so that clicking "Preview Dossier" or "View Payment Screenshot" displays a rich, fully populated digital document rather than a broken image or blank window.
2. **Read-Only Scope**:
   - As an explorer agent, no source code files in `src/` have been created or altered.
   - All proposed components and classes are structured for direct drop-in implementation by the Worker agent.
3. **No Overdue Installments in Default Mock Data**:
   - `src/data/mockStudents.ts` currently contains only `PAID` and `PENDING` installment records. The styling specifications explicitly support `OVERDUE` (with rose styling and `AlertTriangle` icon) to ensure complete visual coverage.

---

## 7. Conclusion

Milestone 3 requires upgrading the Student Profile from a flat, monolithic inline dialog into a modular, tabbed modal with three dedicated tabs:
1. **`StudentProfileModal.tsx`**: Houses the student hero header (name, ID, status badge, course, worker attribution chips) and the responsive 3-tab navigation bar.
2. **`FeesTab.tsx`**: Features the 5-metric financial summary card (Total Fee, Discount, Net Fee, Paid Amount, Balance Due) with a dual-color settlement progress bar, accompanied by a connected vertical installment timeline schedule (`PAID`, `PENDING`, `OVERDUE`).
3. **`DocumentsTab.tsx`**: Features the single consolidated PDF admission dossier card with file size and upload date metadata, verified qualification credentials checklist, and an in-portal document preview modal.
4. **`PaymentsTab.tsx`**: Displays itemized payment transaction cards with bold INR amounts, payment channel icons, interactive UTR copy button with visual feedback, bank details, and an official "Verified Settlement" badge.
5. **`PaymentScreenshotModal.tsx`**: Provides a lightbox receipt modal with digital watermark verification and voucher details.

This design strictly respects the Tailwind v4 tokens, OKLCH palette, Lucide icons, and mobile-first responsive guidelines of the project.

---

## 8. Verification Method

To independently verify the styling and responsive design after implementation:
1. **Build & Lint Verification**:
   ```powershell
   npm run lint
   npm run build
   ```
   Ensures zero TypeScript, Tailwind v4, or ESLint errors.
2. **Visual & Interactive Verification Checklist**:
   - Open student profile modal by clicking any student row or mobile card.
   - Verify modal opens smoothly with hero header and 3 tabs: `Fees`, `Documents`, `Payments`.
   - Click each tab: ensure instant switching and correct panel activation.
   - In **Fees Tab**: Verify 5 metrics (Total Fee, Discount, Net Fee, Paid, Balance Due) render correct INR formatting (`₹`). Verify vertical installment timeline connects milestones with matching status badges (`PAID` in green, `PENDING` in amber).
   - In **Documents Tab**: Verify single PDF dossier card displays file name, file size (`3.4 MB`), upload date, and "Preview Dossier" opens the preview modal.
   - In **Payments Tab**: Verify transaction amount, payment method badge, and "Verified" status. Click the UTR copy button and verify icon changes to `Check` with "Copied!" feedback. Click "View Payment Screenshot" and verify lightbox modal displays the digital receipt voucher with verification seal.
   - In **Mobile View (<768px)**: Resize viewport to 375px; verify 3 tabs take equal width, 5-metric card flows into 2 columns with Balance Due spanning full width, and transaction cards stack cleanly without horizontal overflow.
