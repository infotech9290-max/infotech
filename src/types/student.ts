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
  graduationSession?: string;// e.g. "2026-2029"
}

export interface FeeSummary {
  totalFee: number;          // e.g. 120000
  discount: number;          // e.g. 15000
  scholarship?: number;      // alias for discount
  netFee: number;            // 105000 (totalFee - discount)
  paidAmount: number;        // e.g. 45000
  balanceDue: number;        // 60000 (netFee - paidAmount)
}

export type InstallmentStatus =
  | 'PAID'
  | 'PENDING'
  | 'OVERDUE'
  | 'Paid'
  | 'Pending'
  | 'Due'
  | 'Overdue';

export interface InstallmentRecord {
  id: string;
  title: string;             // e.g. "1st Installment (At Admission)"
  dueDate: string;           // e.g. "14 Oct 2026"
  amount: number;            // e.g. 45000
  status: InstallmentStatus;
  paidDate?: string;         // e.g. "14 Oct 2026, 10:30 AM"
}

export interface PaymentRecord {
  id: string;
  amount: number;            // e.g. 45000
  date: string;              // e.g. "14 Oct 2026, 10:30 AM"
  method: PaymentMethod;     
  paymentMethod?: PaymentMethod | string; // alias
  utr: string;               // e.g. "UPI-329482930192"
  bankDetails: string;       // e.g. "HDFC Bank (Boss Official A/C)"
  screenshotUrl?: string;    // e.g. "/receipt-qr.png"
  verified: boolean;         // true -> shows green "Verified" badge
}

export interface DocumentRecord {
  id: string;
  title: string;             // e.g. "Consolidated Admission Dossier (PDF)"
  fileName: string;          
  fileSize: string;          // e.g. "2.4 MB"
  uploadDate: string;        // e.g. "14 Oct 2026"
  url: string;
  type: 'PDF' | 'IMAGE';
  verified?: boolean;
  checklistItems?: string[]; // e.g. ['Class 10 Marksheet', 'Class 12 Marksheet', 'Aadhaar Card']
}

export interface Student {
  id: string;                // e.g. "STU-9X82-KPL"
  name: string;              
  fatherName?: string;       // optional father name
  email: string;             // e.g. "rahul.sharma@example.com"
  phone: string;             // e.g. "+91 98765 43210"
  course: string;            
  status: StudentStatus;     // 'Action Needed' | 'In Process' | 'Enrolled' | 'Rejected' | 'Cancelled'
  date: string;              // e.g. "14 Oct 2026, 10:30 AM"
  registrationDate?: string; // registration ISO or date string
  workerId?: string;
  workerName: string;        
  workerEmail: string;       // e.g. worker's email
  worker?: {
    id?: string;
    name: string;
    email: string;
  };
  marks: {
    tenth: string;
    twelfth: string;
  };
  academic: AcademicRecord;
  fees: FeeSummary;
  installments: InstallmentRecord[];
  payments: PaymentRecord[];
  documents: DocumentRecord[];
  photoUrl?: string;
}

export function normalizeInstallmentStatus(
  status: InstallmentStatus | string
): 'PAID' | 'PENDING' | 'OVERDUE' {
  const upper = String(status || '').toUpperCase();
  if (upper === 'PAID') return 'PAID';
  if (upper === 'OVERDUE' || upper === 'DUE') return 'OVERDUE';
  return 'PENDING';
}

export function formatINR(amount: number): string {
  return `₹${Math.round(amount || 0).toLocaleString('en-IN')}`;
}
