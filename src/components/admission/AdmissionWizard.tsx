'use client';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TopProgressBar } from './TopProgressBar';
import { FormErrorAlert } from './FormErrorAlert';
import {
  StepStudentDetails,
  StepStudentDetailsData,
} from './StepStudentDetails';
import {
  StepFeeDetails,
  StepFeeDetailsData,
} from './StepFeeDetails';
import {
  StepReviewSubmit,
  StepReviewSubmitData,
} from './StepReviewSubmit';
import { Student } from '@/types/student';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Copy,
  PlusCircle,
  ArrowRight,
  Sparkles,
  Pause,
  Play,
} from 'lucide-react';

interface AdmissionWizardProps {
  onSuccess?: (student: Student) => void;
  onCancel?: () => void;
  onComplete?: () => void;
  isModal?: boolean;
}

export function AdmissionWizard({
  onSuccess,
  onCancel,
  onComplete,
  isModal = false,
}: AdmissionWizardProps) {
  const router = useRouter();
  const { user, role } = useAuth();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [errors, setErrors] = useState<string[]>([]);
  const [errorFields, setErrorFields] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedStudent, setSubmittedStudent] = useState<Student | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState<number>(5);
  const [isRedirectPaused, setIsRedirectPaused] = useState<boolean>(false);

  const containerTopRef = useRef<HTMLDivElement>(null);

  // Form State
  const [studentData, setStudentData] = useState<StepStudentDetailsData>({
    name: '',
    email: '',
    phone: '',
    guardianName: '',
    dob: '',
    gender: '',
    address: '',
      tenthYear: '2022',
      tenthSchool: '',
    tenthBoard: 'CBSE',
    tenthMarks: '',
    twelfthSchool: '',
    twelfthBoard: 'CBSE',
    twelfthStream: 'Science (PCM)',
    twelfthMarks: '',
    course: '',
    session: '2026-2029',
    photo: null,
    photoPreview: undefined,
    pdfDossier: null,
    tenthMarksheet: null,
    twelfthMarksheet: null,
    pdfFileName: undefined,
    pdfFileSize: undefined,
  });

  const [feeData, setFeeData] = useState<StepFeeDetailsData>({
    totalFee: 0,
    discount: 0,
    netFee: 0,
    downPayment: 0,
    balanceDue: 0,
    paymentMethod: 'UPI QR',
    paymentPlan: '2 Installments',
    utr: '',
    paymentScreenshot: null,
    paymentScreenshotPreview: undefined,
  });

  const [reviewData, setReviewData] = useState<StepReviewSubmitData>({
    declarationConfirmed: false,
  });

  const LOCAL_STORAGE_KEY = 'draftAdmission_v1';
  const [isRestored, setIsRestored] = useState(false);

  useEffect(() => {
    try {
      const draftStr = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (draftStr) {
        const draft = JSON.parse(draftStr);
        if (draft.studentData) {
          setStudentData(prev => ({ ...prev, ...draft.studentData }));
        }
        if (draft.feeData) {
          setFeeData(prev => ({ ...prev, ...draft.feeData }));
        }
        if (draft.currentStep && draft.currentStep < 4) {
          setCurrentStep(draft.currentStep);
        }
      }
    } catch (e) {
      console.warn('Failed to parse draft admission', e);
    }
    setIsRestored(true);
  }, []);

  useEffect(() => {
    if (!isRestored || currentStep === 4) return;
    
    const safeStudentData = { ...studentData };
    delete (safeStudentData as any).photo;
    delete safeStudentData.photoPreview;
    delete (safeStudentData as any).pdfDossier;
    delete (safeStudentData as any).tenthMarksheet;
    delete safeStudentData.tenthMarksheetPreview;
    delete (safeStudentData as any).twelfthMarksheet;
    delete safeStudentData.twelfthMarksheetPreview;
    
    const safeFeeData = { ...feeData };
    delete (safeFeeData as any).paymentScreenshot;
    delete safeFeeData.paymentScreenshotPreview;

    const draft = {
      studentData: safeStudentData,
      feeData: safeFeeData,
      currentStep,
      lastSaved: Date.now()
    };
    
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(draft));
  }, [studentData, feeData, currentStep, isRestored]);

  useEffect(() => {
    if (currentStep === 4) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (studentData.name || studentData.phone || studentData.email) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [studentData, currentStep]);

  // Smooth auto-redirect countdown upon reaching Step 4
  useEffect(() => {
    if (currentStep !== 4 || isRedirectPaused || isModal || !submittedStudent) return;

    if (redirectCountdown <= 0) {
      if (onComplete) {
        onComplete();
      } else {
        router.push(role === 'ADMIN' ? '/admin/dashboard' : '/worker/my-dashboard');
      }
      return;
    }

    const timer = setTimeout(() => {
      setRedirectCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [currentStep, redirectCountdown, isRedirectPaused, isModal, submittedStudent, router, onComplete, role]);

  const scrollToTop = () => {
    containerTopRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Step 1 Validation: Strict verification of all mandatory applicant fields
  const validateStep1 = (): boolean => {
    const errList: string[] = [];
    const fieldMap: Record<string, string> = {};

    const trimmedName = studentData.name.trim();
    if (!trimmedName) {
      errList.push('Student Full Name is required');
      fieldMap.name = 'Full name is required';
    } else if (trimmedName.length < 2) {
      errList.push('Student Full Name must be at least 2 characters');
      fieldMap.name = 'Min 2 characters required';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const trimmedEmail = studentData.email.trim();
    if (!trimmedEmail) {
      errList.push('Email address is required');
      fieldMap.email = 'Email address is required';
    } else if (!emailRegex.test(trimmedEmail)) {
      errList.push('A valid email address is required (e.g. student@example.com)');
      fieldMap.email = 'Valid email format required';
    }

    const cleanPhone = studentData.phone.replace(/\D/g, '');
    const phone10 = cleanPhone.slice(-10);
    if (!studentData.phone.trim()) {
      errList.push('Mobile phone number is required');
      fieldMap.phone = 'Phone number is required';
    } else if (phone10.length !== 10) {
      errList.push('A valid 10-digit mobile phone number is required');
      fieldMap.phone = 'Must be exactly 10 digits';
    }

    const trimmedGuardian = studentData.guardianName.trim();
    if (!trimmedGuardian) {
      errList.push('Father or Guardian Name is required');
      fieldMap.guardianName = 'Guardian name is required';
    } else if (trimmedGuardian.length < 2) {
      errList.push('Guardian Name must be at least 2 characters');
      fieldMap.guardianName = 'Min 2 characters required';
    }

    if (!studentData.tenthMarks.trim()) {
      errList.push('10th Marks / Percentage is required');
      fieldMap.tenthMarks = '10th marks required';
    }

    const trimmedTenthYear = studentData.tenthYear.trim();
    const currentYear = new Date().getFullYear();
    const yearNum = parseInt(trimmedTenthYear, 10);
    if (!trimmedTenthYear) {
      errList.push('10th Passing Year is required');
      fieldMap.tenthYear = '10th year required';
    } else if (!/^\d{4}$/.test(trimmedTenthYear) || isNaN(yearNum) || yearNum < 1980 || yearNum > currentYear + 1) {
      errList.push(`10th Passing Year must be a valid 4-digit year (1980-${currentYear + 1})`);
      fieldMap.tenthYear = 'Valid 4-digit year required';
    }

    if (!studentData.twelfthMarks.trim()) {
      errList.push('12th Marks / Percentage is required');
      fieldMap.twelfthMarks = '12th marks required';
    }

    const trimmedTwelfthYear = (studentData.twelfthYear || '').trim();
    const twelfthYearNum = parseInt(trimmedTwelfthYear, 10);
    if (trimmedTwelfthYear && (!/^\d{4}$/.test(trimmedTwelfthYear) || isNaN(twelfthYearNum) || twelfthYearNum < 1980 || twelfthYearNum > currentYear + 1)) {
      errList.push(`12th Passing Year must be a valid 4-digit year (1980-${currentYear + 1})`);
      fieldMap.twelfthYear = 'Valid 4-digit year required';
    }

    if (!studentData.session.trim()) {
      errList.push('Academic session is required');
      fieldMap.session = 'Session is required';
    }

    if (!studentData.course.trim()) {
      errList.push('Target course selection is required');
      fieldMap.course = 'Please select a course';
    }

    if (!studentData.photo) {
      errList.push('Student passport photo is required (auto-compressed)');
      fieldMap.photo = 'Student photo required';
    }

    if (!studentData.pdfDossier) {
      errList.push('Consolidated student academic dossier (single PDF) is required');
      fieldMap.pdfDossier = 'Single PDF upload required';
    }

    setErrors(errList);
    setErrorFields(fieldMap);

    if (errList.length > 0) {
      scrollToTop();
      return false;
    }

    return true;
  };

  // Step 2 Validation: Financials & payment verification
  const validateStep2 = (): boolean => {
    const errList: string[] = [];
    const fieldMap: Record<string, string> = {};

    const net = Math.max(0, (feeData.totalFee || 0) - (feeData.discount || 0));

    if (!feeData.totalFee || feeData.totalFee <= 0) {
      errList.push('Total course tuition fee must be greater than 0');
      fieldMap.totalFee = 'Total fee must be > 0';
    }

    if (feeData.discount < 0) {
      errList.push('Discount cannot be negative');
      fieldMap.discount = 'Cannot be negative';
    } else if (feeData.discount > (feeData.totalFee || 0)) {
      errList.push('Discount cannot exceed total course fee');
      fieldMap.discount = 'Cannot exceed total fee';
    } else if (role !== 'ADMIN' && feeData.discount > 10000) {
      errList.push('Worker discount cannot exceed ₹10,000 without Admin OTP');
      fieldMap.discount = 'Exceeds max allowed (₹10,000)';
    }

    if (feeData.downPayment < 0) {
      errList.push('Down payment cannot be negative');
      fieldMap.downPayment = 'Invalid down payment';
    } else if (studentData.minDownpayment && feeData.downPayment < studentData.minDownpayment && feeData.downPayment < net) {
      errList.push(`Minimum down payment required for this course is ₹${studentData.minDownpayment.toLocaleString('en-IN')}`);
      fieldMap.downPayment = `Min required: ₹${studentData.minDownpayment.toLocaleString('en-IN')}`;
    } else if (feeData.downPayment > net) {
      errList.push('Down payment cannot exceed net payable fee');
      fieldMap.downPayment = 'Exceeds net fee';
    }

    const isOnline =
      feeData.paymentMethod === 'UPI QR' ||
      feeData.paymentMethod === 'Bank Transfer' ||
      feeData.paymentMethod === 'UPI';

    if (isOnline) {
      const trimmedUtr = feeData.utr.trim();
      if (!trimmedUtr) {
        errList.push('Bank UTR / Transaction Reference number is required for digital payments');
        fieldMap.utr = 'UTR Reference is required';
      } else if (trimmedUtr.length < 6) {
        errList.push('Bank UTR / Transaction Reference must be at least 6 alphanumeric characters');
        fieldMap.utr = 'Min 6 characters required';
      }

      if (!feeData.paymentScreenshot) {
        errList.push('Payment receipt screenshot upload is required for verification');
        fieldMap.paymentScreenshot = 'Receipt screenshot required';
      }
    }

    setErrors(errList);
    setErrorFields(fieldMap);

    if (errList.length > 0) {
      scrollToTop();
      return false;
    }

    return true;
  };

  // Step Navigation Handlers
  const handleNextFromStep1 = () => {
    if (validateStep1()) {
      const mappedFee = studentData.totalFee || 0;
      setFeeData((prev) => {
        if (prev.totalFee === mappedFee) return prev;
        const net = Math.max(0, mappedFee - (prev.discount || 0));
        const bal = Math.max(0, net - (prev.downPayment || 0));
        return {
          ...prev,
          totalFee: mappedFee,
          netFee: net,
          balanceDue: bal,
        };
      });
      setErrors([]);
      setErrorFields({});
      setCurrentStep(2);
      scrollToTop();
    }
  };

  const handleNextFromStep2 = () => {
    if (validateStep2()) {
      setErrors([]);
      setErrorFields({});
      setCurrentStep(3);
      scrollToTop();
    }
  };

  const handleGoToStep = (stepNumber: number) => {
    setErrors([]);
    setErrorFields({});
    setCurrentStep(stepNumber);
    scrollToTop();
  };

  // Final Submission
  const handleSubmit = () => {
    // 1. Cross-validate Step 1
    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }

    // 2. Cross-validate Step 2
    if (!validateStep2()) {
      setCurrentStep(2);
      return;
    }

    // 3. Confirm Declaration
    if (!reviewData.declarationConfirmed) {
      setErrors(['Please verify and check the declaration before submitting']);
      setErrorFields({ declaration: 'Declaration must be confirmed' });
      scrollToTop();
      return;
    }

    setIsSubmitting(true);
    setErrors([]);
    setErrorFields({});

    const doSubmit = async () => {
      // Generate unique student ID attributed to worker or admin (e.g. STU-WK01-4821 or STU-ADM01-9214)
      const rawWorkerTag = (user?.id || (role === 'ADMIN' ? 'ADM-01' : 'WK-01')).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const studentId = `STU-${rawWorkerTag}-${randomSuffix}`;

      const netFee = Math.max(0, (feeData.totalFee || 0) - (feeData.discount || 0));
      const balanceDue = Math.max(0, netFee - (feeData.downPayment || 0));

      const nowFormatted = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      try {
        // Upload photo if present
        let uploadedPhotoUrl = '';
        if (studentData.photo) {
          const photoData = new FormData();
          photoData.append('file', studentData.photo);
          photoData.append('bucket', 'photos');
          const photoRes = await fetch('/api/upload', { method: 'POST', body: photoData });
          if (photoRes.ok) {
            const pJson = await photoRes.json();
            uploadedPhotoUrl = pJson.url || '';
          }
        }

        // Upload PDF if present
        let uploadedPdfUrl = '';
        if (studentData.pdfDossier) {
          const pdfData = new FormData();
          pdfData.append('file', studentData.pdfDossier);
          pdfData.append('bucket', 'dossiers');
          const pdfRes = await fetch('/api/upload', { method: 'POST', body: pdfData });
          if (pdfRes.ok) {
            const pdfJson = await pdfRes.json();
            uploadedPdfUrl = pdfJson.url || '';
          }
        }

        // Upload screenshot if present
        let uploadedScreenshotUrl = '';
        if (feeData.paymentScreenshot) {
          const ssData = new FormData();
          ssData.append('file', feeData.paymentScreenshot);
          ssData.append('bucket', 'receipts');
          const ssRes = await fetch('/api/upload', { method: 'POST', body: ssData });
          if (ssRes.ok) {
            const ssJson = await ssRes.json();
            uploadedScreenshotUrl = ssJson.url || '';
          }
        }

        // Upload 10th Marksheet if present
        let uploaded10thUrl = '';
        if (studentData.tenthMarksheet) {
          const m10Data = new FormData();
          m10Data.append('file', studentData.tenthMarksheet);
          m10Data.append('bucket', 'dossiers');
          const m10Res = await fetch('/api/upload', { method: 'POST', body: m10Data });
          if (m10Res.ok) {
            const m10Json = await m10Res.json();
            uploaded10thUrl = m10Json.url || '';
          }
        }

        // Upload 12th Marksheet if present
        let uploaded12thUrl = '';
        if (studentData.twelfthMarksheet) {
          const m12Data = new FormData();
          m12Data.append('file', studentData.twelfthMarksheet);
          m12Data.append('bucket', 'dossiers');
          const m12Res = await fetch('/api/upload', { method: 'POST', body: m12Data });
          if (m12Res.ok) {
            const m12Json = await m12Res.json();
            uploaded12thUrl = m12Json.url || '';
          }
        }

      const newStudentRecord: Student = {
        id: studentId,
        name: studentData.name.trim(),
        email: studentData.email.trim(),
        phone: studentData.phone.trim(),
        course: studentData.course,
        status: balanceDue === 0 ? 'Enrolled' : 'Action Needed',
        date: `${nowFormatted}, ${new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        })}`,
        workerId: user?.id || (role === 'ADMIN' ? 'ADM-01' : 'WK-01'),
        workerName: user?.name || user?.email?.split('@')[0] || (role === 'ADMIN' ? 'Super Admin' : 'Counselor'),
        workerEmail: user?.email || '',
        worker: {
          id: user?.id || (role === 'ADMIN' ? 'ADM-01' : 'WK-01'),
          name: user?.name || user?.email?.split('@')[0] || (role === 'ADMIN' ? 'Super Admin' : 'Counselor'),
          email: user?.email || '',
        },
        marks: {
          tenth: studentData.tenthMarks,
          twelfth: studentData.twelfthMarks,
        },
        academic: {
          tenthYear: studentData.tenthYear,
          tenthMarks: studentData.tenthMarks,
          tenthSchool: studentData.tenthSchool,
          twelfthYear: studentData.twelfthYear || '',
          twelfthMarks: studentData.twelfthMarks,
          twelfthStream: studentData.twelfthStream || '',
        },
        fees: {
          totalFee: feeData.totalFee,
          discount: feeData.discount,
          netFee,
          paidAmount: feeData.downPayment,
          balanceDue,
        },
        installments: [
          {
            id: 'INST-1',
            title: '1st Installment (At Admission)',
            dueDate: nowFormatted,
            amount: feeData.downPayment,
            status: 'PAID',
            paidDate: nowFormatted,
          },
          ...(balanceDue > 0
            ? (() => {
                const numInstalls = Math.min(parseInt(feeData.paymentPlan?.charAt(0) || '1') || 1, studentData.maxInstallments || 2);
                let runningTotal = 0;
                
                return Array.from({ length: numInstalls }).map((_, i) => {
                  let emiAmount = 0;
                  if (i === numInstalls - 1) {
                    emiAmount = Math.max(0, balanceDue - runningTotal);
                  } else {
                    const predefined = [
                      studentData.inst1 || 0,
                      studentData.inst2 || 0,
                      studentData.inst3 || 0,
                      studentData.inst4 || 0,
                    ];
                    emiAmount = predefined[i] > 0 
                      ? predefined[i] 
                      : Math.round(balanceDue / numInstalls);
                    runningTotal += emiAmount;
                  }

                  const date = new Date();
                  date.setDate(date.getDate() + ((i + 1) * 30));
                  
                  return {
                    id: `INST-${i + 2}`,
                    title: `Installment ${i + 1} (Scheduled)`,
                    dueDate: date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                    amount: emiAmount,
                    status: 'PENDING' as const,
                  };
                });
              })()
            : []),
        ],
        payments: [
          {
            id: `PMT-${Date.now()}`,
            amount: feeData.downPayment,
            date: nowFormatted,
            method: feeData.paymentMethod,
            utr: feeData.utr?.trim() || (feeData.paymentMethod === 'Cash' ? 'CASH-OFFICE' : 'OFFLINE-DESK'),
            bankDetails:
              feeData.paymentMethod === 'UPI QR'
                ? 'Official UPI'
                : feeData.paymentMethod === 'Cash' ? 'Cash Desk' : 'Official Bank A/c',
            screenshotUrl: uploadedScreenshotUrl || feeData.paymentScreenshotPreview || '/receipt-qr.png',
            verified: true,
          },
        ],
        documents: [
          {
            id: 'DOC-DOSSIER-1',
            title: 'Consolidated Academic Dossier (Single PDF)',
            fileName:
              studentData.pdfFileName ||
              `${studentData.name.trim().replace(/\s+/g, '_')}_Dossier.pdf`,
            fileSize: studentData.pdfFileSize || '2.1 MB',
            uploadDate: nowFormatted,
            url: uploadedPdfUrl || '#',
            type: 'PDF',
          },
        ],
        photoUrl: uploadedPhotoUrl || studentData.photoPreview,
      };

        // Secure Server-Side Route Submission (NEVER browser direct Supabase)
        const res = await fetch('/api/admissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            unique_id: studentId,
            student_name: studentData.name.trim(),
            father_name: studentData.guardianName?.trim() || 'N/A',
            email: studentData.email?.trim() || '',
            phone: studentData.phone?.trim() || '',
            graduation_course: studentData.course,
            graduation_session: studentData.session || '2026-2029',
            tenth_marks: studentData.tenthMarks.trim(),
            status: balanceDue === 0 ? 'Enrolled' : 'Action Needed',
            worker_id: user?.id || (role === 'ADMIN' ? 'ADM-01' : 'WK-01'),
            worker_name: user?.name || user?.email?.split('@')[0] || (role === 'ADMIN' ? 'Super Admin' : 'Counselor'),
            worker_email: user?.email || '',
            total_fee: feeData.totalFee || 0,
            discount: feeData.discount || 0,
            paid_amount: feeData.downPayment || 0,
            balance_due: balanceDue,
            payment_method: feeData.paymentMethod,
            payment_utr: feeData.utr?.trim() || (feeData.paymentMethod === 'Cash' ? 'CASH-DESK' : ''),
            tenth_school: studentData.tenthSchool?.trim() || '',
            tenth_year: studentData.tenthYear?.trim() || '',
            twelfth_details: studentData.twelfthMarks?.trim() || '',
            twelfth_year: studentData.twelfthYear?.trim() || '',
            twelfth_stream: studentData.twelfthStream?.trim() || '',
            photo_url: uploadedPhotoUrl,
            dossier_pdf_url: uploadedPdfUrl,
            tenth_marksheet_url: uploaded10thUrl,
            twelfth_marksheet_url: uploaded12thUrl,
            payment_screenshot_url: uploadedScreenshotUrl,
          }),
        });

        const resJson = await res.json();
        if (!res.ok || resJson.error) {
          throw new Error(resJson.error || 'Failed to submit admission record through server route.');
        }

        setIsSubmitting(false);
        setSubmittedStudent(newStudentRecord);
        setRedirectCountdown(5);
        setIsRedirectPaused(false);

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('admission-created', { detail: newStudentRecord }));
        }
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        setCurrentStep(4);
        if (onSuccess) onSuccess(newStudentRecord);
      } catch (dbErr) {
        console.error('Admission submission error:', dbErr);
        const msg = dbErr instanceof Error ? dbErr.message : 'Failed to connect to the database. Admission not saved.';
        setErrors([msg]);
        setIsSubmitting(false);
        scrollToTop();
      }
    };

    doSubmit();
  };

  const handleReset = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setStudentData({
      name: '',
      email: '',
      phone: '',
      guardianName: '',
      dob: '',
      gender: '',
      address: '',
      tenthYear: '2022',
      tenthSchool: '',
      tenthBoard: 'CBSE',
    twelfthYear: '2024',
      tenthMarks: '',
      twelfthSchool: '',
      twelfthBoard: 'CBSE',
      twelfthStream: 'Science (PCM)',
      twelfthMarks: '',
      course: '',
      session: '2026-2029',
      photo: null,
      photoPreview: undefined,
      pdfDossier: null,
      tenthMarksheet: null,
      twelfthMarksheet: null,
      pdfFileName: undefined,
      pdfFileSize: undefined,
    });
    setFeeData({
      totalFee: 0,
      discount: 0,
      netFee: 0,
      downPayment: 0,
      balanceDue: 0,
      paymentMethod: 'UPI QR',
      paymentPlan: '2 Installments',
      utr: '',
      paymentScreenshot: null,
      paymentScreenshotPreview: undefined,
    });
    setReviewData({ declarationConfirmed: false });
    setSubmittedStudent(null);
    setRedirectCountdown(5);
    setIsRedirectPaused(false);
    setErrors([]);
    setErrorFields({});
    setCurrentStep(1);
  };

  const copyStudentId = () => {
    if (submittedStudent) {
      navigator.clipboard.writeText(submittedStudent.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  return (
    <div
      ref={containerTopRef}
      className={`w-full ${isModal ? 'max-w-4xl mx-auto' : 'max-w-3xl mx-auto'}`}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
      {/* Step 4: Success View */}
      {currentStep === 4 && submittedStudent ? (
        <div className="bg-white rounded-3xl border border-emerald-200 shadow-sm p-6 sm:p-10 text-center animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Admission Verified & Confirmed
          </span>

          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Admission Successful!
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-md mx-auto">
            Student record created and dossier archived into university admissions database.
          </p>

          {/* Smooth Auto-Redirect Status Banner */}
          {!isModal && (
            <div className="mt-5 p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs max-w-lg mx-auto">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-mono font-bold text-xs flex items-center justify-center shadow-xs">
                  {redirectCountdown}s
                </div>
                <div className="text-left">
                  <p className="font-semibold text-blue-950">
                    {isRedirectPaused
                      ? 'Auto-redirect paused.'
                      : `Redirecting to My Dashboard in ${redirectCountdown} seconds...`}
                  </p>
                  <p className="text-[11px] text-blue-700">
                    Admission securely persisted via /api/admissions.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsRedirectPaused((prev) => !prev)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-blue-200 bg-white text-blue-700 hover:bg-blue-50 font-semibold text-[11px] transition-colors"
                >
                  {isRedirectPaused ? (
                    <>
                      <Play className="w-3 h-3" /> Resume
                    </>
                  ) : (
                    <>
                      <Pause className="w-3 h-3" /> Pause
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => router.push('/worker/my-dashboard')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] shadow-xs transition-colors"
                >
                  Go Now <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Unique Student ID Card */}
          <div className="mt-6 p-5 rounded-2xl bg-slate-50 border border-slate-200/80 max-w-md mx-auto">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Unique Student ID (Permanent)
            </span>
            <div className="flex items-center justify-center gap-3 mt-2">
              <span className="text-2xl sm:text-3xl font-mono font-extrabold text-emerald-600 tracking-wider">
                {submittedStudent.id}
              </span>
              <button
                type="button"
                onClick={copyStudentId}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Copy Student ID"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            {copiedId && (
              <p className="text-[11px] text-emerald-600 font-medium mt-1">
                Copied to clipboard!
              </p>
            )}
          </div>

          {/* Key Summary Snapshot */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto mt-6 text-left text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Student</span>
              <span className="font-bold text-slate-900 truncate block">
                {submittedStudent.name}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Course</span>
              <span className="font-bold text-slate-900 truncate block">
                {submittedStudent.course}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Collected</span>
              <span className="font-bold text-emerald-700 block">
                ₹{submittedStudent.fees.paidAmount.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Balance Due</span>
              <span className="font-bold text-amber-800 block">
                ₹{submittedStudent.fees.balanceDue.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Button
              type="button"
              onClick={handleReset}
              variant="outline"
              className="w-full sm:w-auto h-10 px-5 text-xs font-semibold gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Add Another Student
            </Button>

            {isModal && onCancel ? (
              <Button
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto h-10 px-6 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
              >
                Close & View on Dashboard
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => {
                  if (onComplete) {
                    onComplete();
                  } else {
                    router.push(role === 'ADMIN' ? '/admin/dashboard' : '/worker/my-dashboard');
                  }
                }}
                className="w-full sm:w-auto h-10 px-6 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white gap-2"
              >
                View in My Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div>
          {/* Top 3-Step Progress Indicator */}
          <TopProgressBar
            currentStep={currentStep}
            onStepClick={(step) => handleGoToStep(step)}
          />

          {/* Top Inline Validation Alert Banner */}
          {errors.length > 0 && (
            <FormErrorAlert
              errors={errors}
              onDismiss={() => setErrors([])}
            />
          )}

          {/* Active Counselor & Target Student ID Tag Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl mb-6 text-xs">
            <div className="flex items-center gap-2.5 text-slate-700">
              <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center text-[10px] shadow-2xs">
                {(user?.id || (role === 'ADMIN' ? 'ADM' : 'WK')).slice(0, 3)}
              </span>
              <div>
                <span className="text-slate-500">Processing Counselor: </span>
                <strong className="text-slate-900">{user?.name || user?.email?.split('@')[0] || 'Counselor'}</strong>
                <span className="text-slate-400 mx-1.5">•</span>
                <span className="text-blue-600 font-mono font-semibold">ID: {user?.id || (role === 'ADMIN' ? 'ADM-01' : 'WK-01')}</span>
              </div>
            </div>
            <div className="text-slate-600 font-mono text-[11px] sm:text-right bg-white px-2.5 py-1 rounded-xl border border-slate-200">
              Student ID Tag: <strong className="text-emerald-600">STU-{(user?.id || (role === 'ADMIN' ? 'ADM01' : 'WK01')).replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}-XXXX</strong>
            </div>
          </div>

          {/* Step 1: Student Details */}
          {currentStep === 1 && (
            <StepStudentDetails
              data={studentData}
              onChange={(updates) => {
                setStudentData((prev) => ({ ...prev, ...updates }));
                if (updates.course || updates.totalFee !== undefined) {
                  const mappedFee = updates.totalFee !== undefined ? updates.totalFee : (studentData.totalFee || 0);
                  setFeeData((prev) => {
                    if (prev.totalFee === mappedFee) return prev;
                    const net = Math.max(0, mappedFee - (prev.discount || 0));
                    const bal = Math.max(0, net - (prev.downPayment || 0));
                    return {
                      ...prev,
                      totalFee: mappedFee,
                      netFee: net,
                      balanceDue: bal,
                    };
                  });
                }
              }}
              onNext={handleNextFromStep1}
              errorFields={errorFields}
            />
          )}

          {/* Step 2: Fee Details */}
          {currentStep === 2 && (
            <StepFeeDetails
              data={feeData}
              onChange={(updates) =>
                setFeeData((prev) => ({ ...prev, ...updates }))
              }
              onBack={() => handleGoToStep(1)}
              onNext={handleNextFromStep2}
              errorFields={errorFields}
              minDownpayment={studentData.minDownpayment || 0}
              maxInstallments={studentData.maxInstallments || 2}
              predefinedInstalls={[
                studentData.inst1 || 0,
                studentData.inst2 || 0,
                studentData.inst3 || 0,
                studentData.inst4 || 0,
              ]}
              predefinedMonths={[
                studentData.inst1Months || 1,
                studentData.inst2Months || 2,
                studentData.inst3Months || 3,
                studentData.inst4Months || 4,
              ]}
            />
          )}

          {/* Step 3: Review & Submit */}
          {currentStep === 3 && (
            <StepReviewSubmit
              studentData={studentData}
              feeData={feeData}
              reviewData={reviewData}
              onChange={(updates) =>
                setReviewData((prev) => ({ ...prev, ...updates }))
              }
              onGoToStep={handleGoToStep}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              errorFields={errorFields}
            />
          )}
        </div>
      )}
          </motion.div>
        </AnimatePresence>
    </div>
  );
}



