## 2026-09-14T21:35:13Z
You are Worker M3 for Milestone 3 (R3 Comprehensive Student Profile with Tabs).
Your working directory is: C:\Users\satya\Desktop\New folder\admin-portal\.agents\worker_m3
Project root: C:\Users\satya\Desktop\New folder\admin-portal
Original Request: C:\Users\satya\Desktop\New folder\admin-portal\.agents\ORIGINAL_REQUEST.md
Project Scope: C:\Users\satya\Desktop\New folder\admin-portal\.agents\PROJECT.md

MANDATORY: Read ORIGINAL_REQUEST.md, PROJECT.md, and all 3 Explorer handoff reports before writing code:
- Explorer 1 Report: C:\Users\satya\Desktop\New folder\admin-portal\.agents\explorer_m3_1\handoff.md
- Explorer 2 Report: C:\Users\satya\Desktop\New folder\admin-portal\.agents\explorer_m3_2\handoff.md
- Explorer 3 Report: C:\Users\satya\Desktop\New folder\admin-portal\.agents\explorer_m3_3\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

File Write Ownership (You exclusively own these files):
- `src/types/student.ts`
- `src/data/mockStudents.ts`
- `src/components/ui/tabs.tsx`
- `src/components/profile/FeesTab.tsx`
- `src/components/profile/DocumentsTab.tsx`
- `src/components/profile/PaymentsTab.tsx`
- `src/components/profile/PaymentScreenshotModal.tsx`
- `src/components/profile/DocumentPreviewModal.tsx`
- `src/components/profile/StudentProfileModal.tsx`
- `src/app/admin/dashboard/page.tsx`

Detailed Tasks:
1. Data Models & Mock Data:
   - In `src/types/student.ts`: Expand `DocumentRecord` to include `checklistItems?: string[]; verified?: boolean;`. Ensure `InstallmentStatus` supports 'PAID' | 'PENDING' | 'OVERDUE'.
   - In `src/data/mockStudents.ts`: Enrich mock data per Explorer 2:
     - Add `OVERDUE` installment to Priya Singh (`STU-4M91-XCQ`) to test overdue status styling.
     - Add second payment record to Vikram Malhotra (`STU-1T55-QWE`) to test multi-transaction payment history.
     - Resolve Arpita Patel's (`STU-9M11-GHJ`) paidAmount anomaly (`paidAmount: 0, balanceDue: 160000`).
     - Add `checklistItems` (10th marksheet, 12th marksheet, Aadhaar card, etc.) to student dossiers.

2. UI Primitives:
   - Create `src/components/ui/tabs.tsx` wrapping `@base-ui/react/tabs` or custom accessible tabs with clean Tailwind v4 styling.

3. Profile Tabs & Subcomponents (under `src/components/profile/`):
   - `FeesTab.tsx`:
     - 5-Metric Financial Summary Card: Total Course Fee (slate), Scholarship/Discount (emerald `-₹`), Net Fee (blue), Paid Amount (emerald), Balance Due (warm amber alert styling when >0 with warning icon, emerald when 0).
     - Settlement recovery progress bar (`(paidAmount / netFee) * 100%`).
     - Connected vertical installment timeline schedule with dedicated status nodes (`Check` for PAID, `Clock` for PENDING, `AlertTriangle` for OVERDUE), title, due/paid date, and formatted INR amounts (`₹XX,XXX`).
   - `DocumentsTab.tsx`:
     - Student identity banner with photo and avatar initials fallback.
     - Featured Single PDF Admission Dossier card with metadata badges (file name, file size, upload date) and "Preview Dossier" and "Download PDF" actions.
     - Credentials checklist (10th/12th qualification status, documents verified).
     - Integration with `DocumentPreviewModal.tsx`.
   - `PaymentsTab.tsx`:
     - Detailed itemized transaction cards with amount in bold INR, payment method badge (`UPI QR`, `Bank Transfer`, `Cash`), "Verified" badge (`CheckCircle2`), official bank details, and UTR reference.
     - Interactive 1-click UTR Copy Button that writes to `navigator.clipboard` and switches to a green checkmark with "Copied!" feedback for 2 seconds.
     - "View Payment Screenshot" button that opens `PaymentScreenshotModal.tsx`.
   - `PaymentScreenshotModal.tsx`:
     - Modal / lightbox displaying an authentic digital transaction receipt slip with student name, course, amount, UTR, date, bank account, and official green "PAID & VERIFIED" seal/badge, with image preview if available and fallback receipt card.
   - `DocumentPreviewModal.tsx`:
     - In-portal preview modal for the student's admission dossier replacing any browser `alert()`.
   - `StudentProfileModal.tsx`:
     - Master dialog wrapping `<Dialog>` with responsive sizing (`w-[95vw] max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden`).
     - Hero header showing Student Name, ID, Course, `StatusBadge`, and assigned Worker attribution.
     - Tabbed navigation specifically for `Fees | Documents | Payments` with count pills and touch-friendly mobile layout.
     - Embedding `FeesTab`, `DocumentsTab`, and `PaymentsTab`.

4. Dashboard Integration:
   - In `src/app/admin/dashboard/page.tsx`:
     - Replace the monolithic inline `<Dialog>` (lines 87–338) with `<StudentProfileModal student={selectedStudent} open={Boolean(selectedStudent)} onOpenChange={(open) => { if (!open) setSelectedStudent(null); }} />`.
     - Ensure clean imports and zero regressions.

5. Verification:
   - Run `npx tsc --noEmit` and confirm 0 errors.
   - Run `npm run lint` and confirm 0 errors.
   - Run `npm run build` and confirm production build succeeds with exit code 0.

6. Reporting:
   - Document all modified and created files, exact commands run, and test/build output in `C:\Users\satya\Desktop\New folder\admin-portal\.agents\worker_m3\handoff.md`.
   - Send completion message to parent when finished.
