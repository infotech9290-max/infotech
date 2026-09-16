# Dispatch: Worker Milestone 2 (3-Step Admission Wizard)

## Identity
- Role: Implementation Worker (Milestone 2)
- Type: teamwork_preview_worker
- Working Directory: C:\Users\satya\Desktop\New folder\admin-portal\.agents\worker_m2

## Mandatory Documents
- Read Original Request at: `C:\Users\satya\Desktop\New folder\admin-portal\.agents\ORIGINAL_REQUEST.md`
- Read Project Scope at: `C:\Users\satya\Desktop\New folder\admin-portal\.agents\PROJECT.md`
- Read Architectural Blueprint at: `C:\Users\satya\Desktop\New folder\admin-portal\.agents\explorer_survey_3\analysis.md`

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Write Ownership
You have exclusive write ownership of the following files:
- `src/components/admission/TopProgressBar.tsx`
- `src/components/admission/FormErrorAlert.tsx`
- `src/components/admission/StepStudentDetails.tsx`
- `src/components/admission/StepFeeDetails.tsx`
- `src/components/admission/StepReviewSubmit.tsx`
- `src/components/admission/AdmissionWizard.tsx`
- `src/app/worker/admission/page.tsx`
- `src/app/admin/dashboard/page.tsx` (for "+ Add Student" wizard trigger modal)

## Scope of Work (Milestone 2: R2 3-Step Admission Wizard)
1. **Top Progress Bar (`src/components/admission/TopProgressBar.tsx`)**:
   - Visual progress indicator displaying exactly 3 steps:
     1. Student Details
     2. Fee Details
     3. Review & Submit
   - Highlights the active step, marks completed steps with checkmarks, responsive connector lines.
2. **Inline Validation Banner (`src/components/admission/FormErrorAlert.tsx`)**:
   - Prominent red alert banner at the top of the form when validation fails (e.g. red "Name required", "PDF upload required").
   - Highlights invalid inputs with red borders.
3. **Step 1: Student Details (`src/components/admission/StepStudentDetails.tsx`)**:
   - Personal Details: Full Name (required), Email, Phone, Guardian Name.
   - Academic Details: 10th School, 10th Marks/Percentage (required), 10th Year, 12th School, 12th Stream, 12th Marks.
   - Course Selection: Course dropdown (BCA, B.Tech CSE, MCA, MBA, BBA, B.Com), Session.
   - Photo upload with compression (`src/utils/compressImage.ts`).
   - **Single PDF Upload**: Drag-and-drop or file selector accepting only PDF (`.pdf`, `application/pdf`), displaying selected file card with name, size (KB/MB), and remove action.
4. **Step 2: Fee Details (`src/components/admission/StepFeeDetails.tsx`)**:
   - Total Fee input (default/course fee e.g. ₹1,20,000).
   - Discount amount input.
   - Auto-computed Net Fee (`Total Fee - Discount`).
   - Down Payment / Initial Payment input.
   - Auto-computed Balance Due (`Net Fee - Down Payment`).
   - Payment Method selector: UPI QR, Bank Transfer, Cash.
   - Dynamic payment receptor view (UPI ID / QR / Bank A/C details from settings/default).
   - Payment UTR Number input (required if online/UPI/Bank).
   - Payment Screenshot upload with image preview.
5. **Step 3: Review & Submit (`src/components/admission/StepReviewSubmit.tsx`)**:
   - Structured summary cards displaying all entered data across Personal, Academic, Course, Uploaded PDF dossier, and Fee/Payment details.
   - Declaration checkbox ("I confirm that all student details and payment proofs are verified").
   - Action buttons: "Back to Edit" (can jump to step 1 or 2) and "Submit Admission".
6. **Container & Success View (`src/components/admission/AdmissionWizard.tsx`)**:
   - Manages wizard step state (1, 2, 3) and form state.
   - Inline validation check on Next: if required fields are missing, display `FormErrorAlert` at the top and prevent advancing.
   - Upon submission, display success card with generated Unique Student ID (e.g. `STU-XXXXX-XX`) and actions ("View Profile", "Add Another Student").
7. **Route Integration (`src/app/worker/admission/page.tsx`)**:
   - Embed `AdmissionWizard`.
   - Fix unescaped entity (`Boss's` -> `Boss&apos;s` or text).
   - Ensure clean layout on both mobile and desktop.
8. **Dashboard Trigger (`src/app/admin/dashboard/page.tsx`)**:
   - Add a "+ Add Student" button in the admin dashboard header that opens the `AdmissionWizard` in a dialog, allowing admins to add students directly.

## Verification Requirements
- Execute `npm run build` — must exit with code 0 with Turbopack compilation.
- Execute `npm run lint` — verify 0 errors in all modified files.
- Document all executed commands, test steps, and results in `C:\Users\satya\Desktop\New folder\admin-portal\.agents\worker_m2\handoff.md`.
- Send completion message to orchestrator.
