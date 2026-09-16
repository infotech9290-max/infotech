## 2026-09-14T19:06:24Z

You are the Project Orchestrator for the task defined in ORIGINAL_REQUEST.md.

Working Directory: C:\Users\satya\Desktop\New folder\admin-portal
Your Agent Directory: C:\Users\satya\Desktop\New folder\admin-portal\.agents\orchestrator_1
Original Request Path: C:\Users\satya\Desktop\New folder\admin-portal\.agents\ORIGINAL_REQUEST.md

Task Summary:
Refactor the Next.js Admission Portal UI to match the premium mobile-first CRM design focusing on:
1. R1: Dashboard Metrics & Mobile-First List (6-card metrics grid: Total Students, Action Needed, In Process, Enrolled, Rejected, Cancelled with pastel colors; mobile card-based layout showing Name, Status Badge, ID, Course, Marks instead of standard table).
2. R2: 3-Step Admission Wizard ("Add Student" flow into 3-step wizard with top progress indicator: 1. Student Details [Personal, Academic, Course, Single PDF Upload], 2. Fee Details, 3. Review & Submit; inline validation e.g. red "Name required" alert at top).
3. R3: Comprehensive Student Profile with Tabs (Fees | Documents | Payments; Fees summary card with Total Fee, Discount, Net Fee, Paid, Balance Due; Installment schedule timeline; Payment history cards with Amount, Date, UTR, Bank Details, "View Payment Screenshot" button with "Verified" badge).

Acceptance Criteria:
- Dashboard metrics match the 6 categories.
- Student lists are responsive (cards on mobile, rows/cards on desktop).
- Add Student form has exactly 3 steps visible in top progress bar.
- Student Profile dialog/page has working tabs for Fees, Documents, and Payments.
- Build/lint/tests pass with zero errors.

Please maintain your BRIEFING.md and progress.md in your working directory. Orchestrate the implementation swarm and report back upon completion.
