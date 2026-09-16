# Original User Request

## 2026-09-14T19:03:59Z

Refactor the Next.js Admission Portal UI to match the premium mobile-first CRM design shown in the reference video, focusing on the metrics dashboard, multi-step admission form, and detailed student payment profiles.

Working directory: C:\Users\satya\Desktop\New folder\admin-portal
Integrity mode: development

## Requirements

### R1. Dashboard Metrics & Mobile-First List
Redesign the dashboard to feature a 6-card metrics grid (Total Students, Action Needed, In Process, Enrolled, Rejected, Cancelled) using pastel background colors. The student list must be a card-based layout on mobile (showing Name, Status Badge, ID, Course, and Marks) instead of a standard table.

### R2. 3-Step Admission Wizard
Enhance the "Add Student" flow into a clear 3-step wizard with a top progress indicator:
1. Student Details (Personal, Academic, Course, Single PDF Upload).
2. Fee Details.
3. Review & Submit.
Include inline validation (e.g., red "Name required" alert at the top).

### R3. Comprehensive Student Profile with Tabs
Redesign the Student Details view to include a tabbed interface specifically for `Fees | Documents | Payments`.
- **Fees Tab:** Show a summary card with Total Fee, Discount, Net Fee, Paid, and Balance Due.
- **Installment Timeline:** Display an installment schedule.
- **Payment History:** Display detailed transaction cards showing Amount, Date, UTR, Bank Details, and a "View Payment Screenshot" button with a "Verified" badge.

## Acceptance Criteria

### UI & Layout Match
- [ ] Dashboard metrics exactly match the 6 categories from the video.
- [ ] Student lists are responsive (cards on mobile, rows/cards on desktop).
- [ ] The Add Student form has exactly 3 steps visible in a top progress bar.
- [ ] The Student Profile dialog/page has working tabs for Fees, Documents, and Payments.
