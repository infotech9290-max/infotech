'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Check, Loader2, Building2, Paintbrush, BookOpen, Plus, Trash2, LayoutTemplate, AlertCircle, KeyRound, Lock, GraduationCap, Calendar, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'brand' | 'fees' | 'payment' | 'database' | 'security'>('fees');
  
  // Payment State
  const [upiId, setUpiId] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  
  // Brand State
  const [websiteName, setWebsiteName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  
  // Fees State
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        const json = await res.json();
        if (json.data) {
          // Payment
          setUpiId(json.data.upi_id || '');
          setBankName(json.data.bank_name || '');
          setAccountName(json.data.account_name || '');
          setBankAccount(json.data.bank_account || '');
          setBankIfsc(json.data.bank_ifsc || '');
          
          // Courses
          if (json.data.courses) {
            setCourses(json.data.courses);
          }
          
          // Brand
          if (json.data.brand) {
            if (json.data.brand.websiteName) setWebsiteName(json.data.brand.websiteName);
            if (json.data.brand.logoUrl !== undefined) setLogoUrl(json.data.brand.logoUrl);
          }
        }
        if (json.warning) {
          setDbWarning(json.warning);
        }
      } catch (err) {
        console.error('Failed to fetch payment settings from API', err);
      }
    };
    fetchSettings();
  }, []);

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'success' | 'warning' | 'error' | null>(null);
  const [saveMessage, setSaveMessage] = useState('');
  const [dbWarning, setDbWarning] = useState('');

  // Database Setup State
  const [dbPat, setDbPat] = useState('');
  const [dbStatus, setDbStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [dbMsg, setDbMsg] = useState('');

  const handleDbSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbPat.trim()) return;
    setDbStatus('loading');
    setDbMsg('');
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pat: dbPat.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDbStatus('success');
        setDbMsg('✅ Database initialized successfully! All tables created.');
        setDbWarning('');
      } else {
        setDbStatus('error');
        setDbMsg(data.error || 'Setup failed. Check your PAT token.');
      }
    } catch {
      setDbStatus('error');
      setDbMsg('Network error. Please try again.');
    }
  };

  // Admin Password Change State
  const [adminCurrentPass, setAdminCurrentPass] = useState('');
  const [adminNewPass, setAdminNewPass] = useState('');
  const [adminConfirmPass, setAdminConfirmPass] = useState('');
  const [adminPassStatus, setAdminPassStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [adminPassMsg, setAdminPassMsg] = useState('');

  const handleAdminPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminNewPass !== adminConfirmPass) {
      setAdminPassStatus('error');
      setAdminPassMsg('New password and confirmation do not match.');
      return;
    }
    if (adminNewPass.length < 6) {
      setAdminPassStatus('error');
      setAdminPassMsg('New password must be at least 6 characters long.');
      return;
    }

    setAdminPassStatus('loading');
    setAdminPassMsg('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'infotech9290@gmail.com',
          currentPassword: adminCurrentPass,
          newPassword: adminNewPass,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminPassStatus('success');
        setAdminPassMsg('✅ Super Admin password updated successfully in Supabase! Use your new password on next login.');
        setAdminCurrentPass('');
        setAdminNewPass('');
        setAdminConfirmPass('');
      } else {
        setAdminPassStatus('error');
        setAdminPassMsg(`❌ ${data.error || 'Failed to update password.'}`);
      }
    } catch {
      setAdminPassStatus('error');
      setAdminPassMsg('❌ Network error while updating password.');
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveStatus(null);
    setSaveMessage('');
    
    try {
      const payload: any = {};
      
      if (activeTab === 'fees') {
        payload.courses = courses;
      } else if (activeTab === 'brand') {
        payload.brand = { websiteName, logoUrl };
      } else if (activeTab === 'payment') {
        payload.upi_id = upiId;
        payload.bank_name = bankName;
        payload.account_name = accountName;
        payload.bank_account = bankAccount;
        payload.bank_ifsc = bankIfsc;
      }

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resJson = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(resJson.error || `Server error: ${res.status}`);
      }

      // Update brand in header immediately
      if (activeTab === 'brand' && websiteName) {
        window.dispatchEvent(new CustomEvent('brand-update', { detail: websiteName }));
      }

      if (resJson.warning) {
        setSaveStatus('warning');
        setSaveMessage(resJson.warning);
      } else {
        setSaveStatus('success');
        setSaveMessage('Changes Saved');
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      const errMsg = err instanceof Error ? err.message : 'Failed to save settings';
      setSaveStatus('error');
      setSaveMessage(errMsg);
    } finally {
      setIsSaving(false);
      setTimeout(() => {
        setSaveStatus(null);
        setSaveMessage('');
      }, 5000);
    }
  };

  const addCourse = () => {
    const defaultTotal = 50000;
    const defaultDown = 10000;
    const defaultBal = defaultTotal - defaultDown;
    const emiEach = Math.round(defaultBal / 2);
    setCourses([
      ...courses,
      {
        id: Date.now(),
        name: 'New Course Name',
        fee: defaultTotal,
        minDownpayment: defaultDown,
        commissionRate: 5,
        maxInstallments: 2,
        inst1: emiEach,
        inst1Months: 1,
        inst2: emiEach,
        inst2Months: 2,
        inst3: 0,
        inst3Months: 3,
        inst4: 0,
        inst4Months: 4,
      },
    ]);
  };

  const updateCourse = (id: number, field: string, value: any) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const autoSplitEMIs = (courseId: number) => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        const total = Number(c.fee) || 0;
        const down = Number(c.minDownpayment) || 0;
        const bal = Math.max(0, total - down);
        const num = Math.min(Math.max(Number(c.maxInstallments) || 1, 1), 4);
        if (num <= 1) {
          return {
            ...c,
            inst1: 0,
            inst2: 0,
            inst3: 0,
            inst4: 0,
          };
        }
        const each = Math.floor(bal / num);
        const remainder = bal - each * num;
        return {
          ...c,
          inst1: each + remainder,
          inst1Months: 1,
          inst2: num >= 2 ? each : 0,
          inst2Months: 2,
          inst3: num >= 3 ? each : 0,
          inst3Months: 3,
          inst4: num >= 4 ? each : 0,
          inst4Months: 4,
        };
      })
    );
  };

  const deleteCourse = (id: number) => {
    setCourses(courses.filter(c => c.id !== id));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500 font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            Global Platform Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage global platform settings, brand identity, and fee structures.</p>
        </div>
        {saveStatus === 'success' && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold animate-in fade-in shadow-sm">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" /> {saveMessage || 'Changes Saved'}
          </div>
        )}
        {saveStatus === 'warning' && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold animate-in fade-in shadow-sm max-w-md">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" /> <span className="truncate">{saveMessage || 'Saved locally'}</span>
          </div>
        )}
        {saveStatus === 'error' && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 text-red-800 border border-red-200 text-xs font-bold animate-in fade-in shadow-sm max-w-md">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" /> <span className="truncate">{saveMessage || 'Save failed'}</span>
          </div>
        )}
      </div>

      {/* DB NOTICE BANNER */}
      {dbWarning && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs shadow-sm">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Supabase database tables not initialized yet. Settings are active & saved locally. For cloud multi-device sync, initialize your database.</span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('database')}
            className="font-bold text-amber-700 hover:text-amber-900 underline whitespace-nowrap text-xs cursor-pointer"
          >
            Go to DB Setup →
          </button>
        </div>
      )}

      {/* TABS */}
      <div className="flex space-x-1 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('fees')}
          className={cn(
            "px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2",
            activeTab === 'fees' ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          )}
        >
          <BookOpen className="w-4 h-4" />
          Fee Structures
        </button>
        <button
          onClick={() => setActiveTab('brand')}
          className={cn(
            "px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2",
            activeTab === 'brand' ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          )}
        >
          <Paintbrush className="w-4 h-4" />
          Brand Identity
        </button>
        <button
          onClick={() => setActiveTab('payment')}
          className={cn(
            "px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2",
            activeTab === 'payment' ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          )}
        >
          <LayoutTemplate className="w-4 h-4" />
          Payment Info
        </button>
        <button
          onClick={() => setActiveTab('database')}
          className={cn(
            "px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2",
            activeTab === 'database' ? "border-red-600 text-red-700" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          )}
        >
          <ShieldCheck className="w-4 h-4" />
          DB Setup
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={cn(
            "px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2",
            activeTab === 'security' ? "border-purple-600 text-purple-700" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          )}
        >
          <KeyRound className="w-4 h-4" />
          Admin Password
        </button>
      </div>

      {/* TAB CONTENT: FEES */}
      {activeTab === 'fees' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          {/* Header Card */}
          <div className="bg-white rounded-3xl border border-slate-200/60 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Manage Courses & Fees</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Industrial Course Fee & EMI Planner. Configure exact Rs and due schedule for each installment.
                  </p>
                </div>
              </div>
            </div>
            <Button
              onClick={addCourse}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-sm text-sm h-11 px-5 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 mr-2" /> Add New Course
            </Button>
          </div>

          {/* Courses List */}
          {courses.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/60 p-12 text-center space-y-4 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <BookOpen className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">No courses configured yet</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Click the button below to add your first course with custom fees and EMI plans.
                </p>
              </div>
              <Button onClick={addCourse} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl">
                <Plus className="w-4 h-4 mr-1.5" /> Create First Course
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {courses.map((course, idx) => {
                const fee = Number(course.fee) || 0;
                const minDown = Number(course.minDownpayment) || 0;
                const maxInst = Math.min(Math.max(Number(course.maxInstallments) || 1, 1), 4);
                const balance = Math.max(0, fee - minDown);

                const emi1 = Number(course.inst1) || 0;
                const emi2 = Number(course.inst2) || 0;
                const emi3 = Number(course.inst3) || 0;
                const emi4 = Number(course.inst4) || 0;

                const scheduledEmiTotal =
                  (maxInst >= 1 ? emi1 : 0) +
                  (maxInst >= 2 ? emi2 : 0) +
                  (maxInst >= 3 ? emi3 : 0) +
                  (maxInst >= 4 ? emi4 : 0);
                const totalConfigured =
                  minDown +
                  (maxInst > 1
                    ? maxInst === 2
                      ? emi1 + emi2
                      : maxInst === 3
                      ? emi1 + emi2 + emi3
                      : emi1 + emi2 + emi3 + emi4
                    : 0);
                const isBalanced = maxInst === 1 ? true : fee > 0 && totalConfigured === fee;
                const diff = fee - totalConfigured;

                return (
                  <div
                    key={course.id}
                    className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm hover:border-slate-300 transition-all"
                  >
                    {/* Course Card Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                          #{idx + 1}
                        </div>
                        <div className="flex-1 max-w-lg">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                            Course Name
                          </Label>
                          <Input
                            value={course.name}
                            onChange={(e) => updateCourse(course.id, 'name', e.target.value)}
                            placeholder="e.g. BCA, MCA, Full Stack Web Development"
                            className="h-11 text-base font-bold text-slate-900 border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus-visible:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 self-end sm:self-auto">
                        <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {maxInst === 1 ? '1-Time Full Payment' : `${maxInst} Installments Plan`}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCourse(course.id)}
                          className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl h-10 px-3 transition-colors cursor-pointer"
                          title="Delete course"
                        >
                          <Trash2 className="w-4 h-4 mr-1.5" /> Remove
                        </Button>
                      </div>
                    </div>

                    {/* Pricing Inputs (3 Columns) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Total Fee */}
                      <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-1.5">
                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                          Total Course Fee (₹)
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                            ₹
                          </span>
                          <Input
                            type="number"
                            value={course.fee === 0 ? '0' : course.fee || ''}
                            onChange={(e) =>
                              updateCourse(
                                course.id,
                                'fee',
                                e.target.value === '' ? 0 : Number(e.target.value)
                              )
                            }
                            placeholder="50000"
                            className="pl-8 h-12 font-mono text-base font-bold text-slate-900 rounded-xl bg-white border-slate-200"
                          />
                        </div>
                        <p className="text-[11px] text-slate-400">Total payable tuition fee</p>
                      </div>

                      {/* Minimum Down Payment */}
                      <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-1.5">
                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                          Min. Down Payment (₹)
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                            ₹
                          </span>
                          <Input
                            type="number"
                            value={course.minDownpayment === 0 ? '0' : course.minDownpayment || ''}
                            onChange={(e) =>
                              updateCourse(
                                course.id,
                                'minDownpayment',
                                e.target.value === '' ? 0 : Number(e.target.value)
                              )
                            }
                            placeholder="10000"
                            className="pl-8 h-12 font-mono text-base font-bold text-slate-900 rounded-xl bg-white border-slate-200"
                          />
                        </div>
                        <p className="text-[11px] text-slate-400">Required token amount at registration</p>
                      </div>

                      {/* Counselor Commission % */}
                      <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-1.5">
                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                          Counselor Incentive (%)
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={course.commissionRate === 0 ? '0' : course.commissionRate || ''}
                            onChange={(e) =>
                              updateCourse(
                                course.id,
                                'commissionRate',
                                e.target.value === '' ? 0 : Number(e.target.value)
                              )
                            }
                            placeholder="5"
                            className="h-12 font-mono text-base font-bold text-slate-900 rounded-xl bg-white border-slate-200 pr-8"
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                            %
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">Commission given to counselor per admission</p>
                      </div>
                    </div>

                    {/* EMI / Installments Section */}
                    <div className="bg-gradient-to-br from-slate-50 to-blue-50/20 p-5 sm:p-6 rounded-2xl border border-slate-200 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-600" />
                            Installments & EMI Plan (Konsa EMI par kitna Rs lena hai)
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Remaining Balance after Min. Down Payment: <strong className="text-blue-700 font-mono">₹{balance.toLocaleString('en-IN')}</strong>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Max Installments Select */}
                          <select
                            value={maxInst}
                            onChange={(e) => {
                              const newCount = Number(e.target.value);
                              updateCourse(course.id, 'maxInstallments', newCount);
                            }}
                            className="h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 cursor-pointer shadow-2xs"
                          >
                            <option value={1}>1 Full Payment (No EMI)</option>
                            <option value={2}>Up to 2 Installments</option>
                            <option value={3}>Up to 3 Installments</option>
                            <option value={4}>Up to 4 Installments</option>
                          </select>

                          {maxInst > 1 && (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => autoSplitEMIs(course.id)}
                              className="h-10 px-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-all shadow-sm"
                              title="Auto-calculate equal split for remaining balance"
                            >
                              <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Auto Equal Split
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Individual EMI Cards */}
                      {maxInst > 1 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
                          {/* EMI 1 */}
                          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900">1st EMI</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                Month {(course as any).inst1Months || 1}
                              </span>
                            </div>
                            <div>
                              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                                Rupees to Take (₹)
                              </Label>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                                  ₹
                                </span>
                                <Input
                                  type="number"
                                  value={course.inst1 === 0 ? '0' : course.inst1 || ''}
                                  onChange={(e) =>
                                    updateCourse(
                                      course.id,
                                      'inst1',
                                      e.target.value === '' ? 0 : Number(e.target.value)
                                    )
                                  }
                                  placeholder="Amount"
                                  className="pl-6 h-10 text-xs font-mono font-bold bg-slate-50 border-slate-200"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                                Due Timing
                              </Label>
                              <select
                                value={(course as any).inst1Months || 1}
                                onChange={(e) =>
                                  updateCourse(course.id, 'inst1Months', Number(e.target.value))
                                }
                                className="w-full h-9 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 px-2.5"
                              >
                                <option value={1}>After 1 Month (30 Days)</option>
                                <option value={2}>After 2 Months (60 Days)</option>
                                <option value={3}>After 3 Months (90 Days)</option>
                              </select>
                            </div>
                          </div>

                          {/* EMI 2 */}
                          {maxInst >= 2 && (
                            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-900">2nd EMI</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                  Month {(course as any).inst2Months || 2}
                                </span>
                              </div>
                              <div>
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                                  Rupees to Take (₹)
                                </Label>
                                <div className="relative">
                                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                                    ₹
                                  </span>
                                  <Input
                                    type="number"
                                    value={course.inst2 === 0 ? '0' : course.inst2 || ''}
                                    onChange={(e) =>
                                      updateCourse(
                                        course.id,
                                        'inst2',
                                        e.target.value === '' ? 0 : Number(e.target.value)
                                      )
                                    }
                                    placeholder="Amount"
                                    className="pl-6 h-10 text-xs font-mono font-bold bg-slate-50 border-slate-200"
                                  />
                                </div>
                              </div>
                              <div>
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                                  Due Timing
                                </Label>
                                <select
                                  value={(course as any).inst2Months || 2}
                                  onChange={(e) =>
                                    updateCourse(course.id, 'inst2Months', Number(e.target.value))
                                  }
                                  className="w-full h-9 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 px-2.5"
                                >
                                  <option value={2}>After 2 Months (60 Days)</option>
                                  <option value={3}>After 3 Months (90 Days)</option>
                                  <option value={4}>After 4 Months (120 Days)</option>
                                  <option value={6}>After 6 Months (180 Days)</option>
                                </select>
                              </div>
                            </div>
                          )}

                          {/* EMI 3 */}
                          {maxInst >= 3 && (
                            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-900">3rd EMI</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                  Month {(course as any).inst3Months || 3}
                                </span>
                              </div>
                              <div>
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                                  Rupees to Take (₹)
                                </Label>
                                <div className="relative">
                                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                                    ₹
                                  </span>
                                  <Input
                                    type="number"
                                    value={course.inst3 === 0 ? '0' : course.inst3 || ''}
                                    onChange={(e) =>
                                      updateCourse(
                                        course.id,
                                        'inst3',
                                        e.target.value === '' ? 0 : Number(e.target.value)
                                      )
                                    }
                                    placeholder="Amount"
                                    className="pl-6 h-10 text-xs font-mono font-bold bg-slate-50 border-slate-200"
                                  />
                                </div>
                              </div>
                              <div>
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                                  Due Timing
                                </Label>
                                <select
                                  value={(course as any).inst3Months || 3}
                                  onChange={(e) =>
                                    updateCourse(course.id, 'inst3Months', Number(e.target.value))
                                  }
                                  className="w-full h-9 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 px-2.5"
                                >
                                  <option value={3}>After 3 Months (90 Days)</option>
                                  <option value={4}>After 4 Months (120 Days)</option>
                                  <option value={6}>After 6 Months (180 Days)</option>
                                  <option value={9}>After 9 Months (270 Days)</option>
                                </select>
                              </div>
                            </div>
                          )}

                          {/* EMI 4 */}
                          {maxInst >= 4 && (
                            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-900">4th EMI</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                  Month {(course as any).inst4Months || 4}
                                </span>
                              </div>
                              <div>
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                                  Rupees to Take (₹)
                                </Label>
                                <div className="relative">
                                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                                    ₹
                                  </span>
                                  <Input
                                    type="number"
                                    value={course.inst4 === 0 ? '0' : course.inst4 || ''}
                                    onChange={(e) =>
                                      updateCourse(
                                        course.id,
                                        'inst4',
                                        e.target.value === '' ? 0 : Number(e.target.value)
                                      )
                                    }
                                    placeholder="Amount"
                                    className="pl-6 h-10 text-xs font-mono font-bold bg-slate-50 border-slate-200"
                                  />
                                </div>
                              </div>
                              <div>
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                                  Due Timing
                                </Label>
                                <select
                                  value={(course as any).inst4Months || 4}
                                  onChange={(e) =>
                                    updateCourse(course.id, 'inst4Months', Number(e.target.value))
                                  }
                                  className="w-full h-9 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 px-2.5"
                                >
                                  <option value={4}>After 4 Months (120 Days)</option>
                                  <option value={6}>After 6 Months (180 Days)</option>
                                  <option value={9}>After 9 Months (270 Days)</option>
                                  <option value={12}>After 12 Months (1 Year)</option>
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-white border border-slate-200 text-center text-xs text-slate-500 font-medium">
                          1 Full Payment active. No installments are scheduled for this course.
                        </div>
                      )}

                      {/* Balance Verification Strip */}
                      {maxInst > 1 && fee > 0 && (
                        <div
                          className={`p-3.5 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                            isBalanced
                              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                              : 'bg-amber-50 border border-amber-200 text-amber-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {isBalanced ? (
                              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                            )}
                            <span>
                              {isBalanced ? (
                                <>
                                  Fee Breakdown Balanced: <strong>Downpayment (₹{minDown.toLocaleString('en-IN')})</strong> +{' '}
                                  <strong>EMIs Total (₹{scheduledEmiTotal.toLocaleString('en-IN')})</strong> ={' '}
                                  <strong>Total Fee (₹{fee.toLocaleString('en-IN')})</strong>
                                </>
                              ) : (
                                <>
                                  Balance discrepancy: Downpayment + EMIs is{' '}
                                  <strong>₹{totalConfigured.toLocaleString('en-IN')}</strong> vs Total Fee{' '}
                                  <strong>₹{fee.toLocaleString('en-IN')}</strong> (Diff: ₹{Math.abs(diff).toLocaleString('en-IN')})
                                </>
                              )}
                            </span>
                          </div>
                          {!isBalanced && (
                            <button
                              type="button"
                              onClick={() => autoSplitEMIs(course.id)}
                              className="font-bold underline text-amber-900 hover:text-amber-950 cursor-pointer whitespace-nowrap text-xs"
                            >
                              Auto-Balance EMIs →
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Sticky Save Bar */}
          <div className="pt-2 flex justify-end">
            <Button
              onClick={() => handleSave()}
              disabled={isSaving}
              className="px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-xl shadow-md transition-all cursor-pointer text-sm"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Save Fee Structure
            </Button>
          </div>
        </div>
      )}

      {/* TAB CONTENT: BRAND IDENTITY */}
      {activeTab === 'brand' && (
        <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
             <h2 className="text-lg font-bold text-slate-900">Brand Configuration</h2>
             <p className="text-xs text-slate-500 mt-0.5">Customize the name and logo that appears across the portal.</p>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Website Name</Label>
                  <Input
                    value={websiteName}
                    onChange={(e) => setWebsiteName(e.target.value)}
                    placeholder="e.g. Acme Admissions"
                    className="h-12 rounded-xl border-slate-200 focus-visible:ring-blue-500 text-sm font-bold"
                  />
                  <p className="text-[11px] text-slate-400">This replaces the default brand name on the top master header and login screen.</p>
                </div>
                
                <div className="space-y-2 pt-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Custom Logo (URL)</Label>
                  <Input
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="Leave blank to use default icon"
                    className="h-12 rounded-xl border-slate-200 focus-visible:ring-blue-500 text-sm"
                  />
                  <p className="text-[11px] text-slate-400">Enter a full image URL (e.g. https://...) or leave blank to use default icon.</p>
                </div>
              </div>

              {/* Preview Box */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col items-center justify-center text-center">
                 <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">Live Preview</p>
                 <div className="flex items-center gap-3">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-10 h-10 rounded-xl object-contain bg-white shadow-sm" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white shadow-md">
                        <LayoutTemplate className="w-6 h-6" />
                      </div>
                    )}
                    <div className="text-left">
                      <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">
                        {websiteName || 'Brand Name'}
                      </h1>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                        Admin Command Portal
                      </p>
                    </div>
                 </div>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end border-t border-slate-100">
              <Button type="submit" disabled={isSaving} className="px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-xl shadow-md transition-all cursor-pointer">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Apply Brand
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* TAB CONTENT: PAYMENT (Existing Code) */}
      {activeTab === 'payment' && (
        <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
           <div className="p-6 border-b border-slate-100 bg-slate-50/50">
             <h2 className="text-lg font-bold text-slate-900">Official Payment Coordinates</h2>
             <p className="text-xs text-slate-500 mt-0.5">These payment details are displayed directly to workers on the admission wizard.</p>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Official UPI ID</Label>
              <Input value={upiId} onChange={(e) => setUpiId(e.target.value)} className="h-12 rounded-xl border-slate-200 focus-visible:ring-blue-500 font-mono text-sm" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Bank Name</Label>
                <Input value={bankName} onChange={(e) => setBankName(e.target.value)} className="h-12 rounded-xl border-slate-200 focus-visible:ring-blue-500" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Account Name</Label>
                <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} className="h-12 rounded-xl border-slate-200 focus-visible:ring-blue-500" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Account Number</Label>
                <Input value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} className="h-12 rounded-xl border-slate-200 font-mono text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">IFSC Code</Label>
                <Input value={bankIfsc} onChange={(e) => setBankIfsc(e.target.value.toUpperCase())} className="h-12 rounded-xl border-slate-200 font-mono text-sm uppercase" />
              </div>
            </div>
            <div className="pt-4 flex justify-between border-t border-slate-100">
               <div className="flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Synced in real time.
              </div>
              <Button type="submit" disabled={isSaving} className="px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-xl shadow-md transition-all">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Save Bank Details
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* TAB CONTENT: DATABASE SETUP */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-red-100 text-red-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Database Auto-Setup</h3>
                <p className="text-xs text-slate-500">One-click initialize — creates all tables automatically</p>
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-600 bg-white/60 rounded-xl p-3 space-y-1">
              <p>🔑 <strong>Supabase Personal Access Token (PAT)</strong> required (One-time initialization)</p>
              <p>📍 How to get: <strong>supabase.com → Account (top right) → Access Tokens → Generate new token → Database: Full access</strong></p>
              <p>✅ Once generated, paste the token below and click Initialize.</p>
            </div>
          </div>

          {/* Setup Form */}
          <form onSubmit={handleDbSetup} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Supabase Personal Access Token (PAT)
              </label>
              <input
                type="password"
                value={dbPat}
                onChange={(e) => setDbPat(e.target.value)}
                placeholder="sbp_xxxxxxxxxxxxxxxxxxxx"
                required
                className="w-full h-12 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
              />
              <p className="text-[11px] text-slate-400">
                This token is used only during table creation and is never permanently stored on the server.
              </p>
            </div>

            {dbMsg && (
              <div className={`p-4 rounded-xl text-sm font-medium flex items-start gap-3 ${
                dbStatus === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                <span>{dbMsg}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={dbStatus === 'loading' || !dbPat.trim()}
              className="w-full h-12 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              {dbStatus === 'loading' ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Initializing Database...</>
              ) : dbStatus === 'success' ? (
                <><Check className="w-4 h-4 mr-2" /> Database Ready!</>
              ) : (
                '🚀 Initialize Database Now'
              )}
            </Button>
          </form>

          {/* Vercel Tip */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
            <h4 className="text-sm font-bold text-blue-800 mb-2">💡 Production Deployment (Vercel / Netlify):</h4>
            <p className="text-xs text-slate-600 mb-3">
              Add these Environment Variables in your Vercel Project Settings (Project → Settings → Environment Variables):
            </p>
            <div className="bg-white rounded-xl border border-blue-100 p-3 font-mono text-xs text-slate-700 space-y-1.5">
              <p><span className="text-blue-600">SUPABASE_URL</span> = https://&lt;your-project-id&gt;.supabase.co</p>
              <p><span className="text-blue-600">SUPABASE_ANON_KEY</span> = eyJhbGci...</p>
              <p><span className="text-red-600">SUPABASE_PAT</span> = sbp_... (your personal access token)</p>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Vercel: Project → Settings → Environment Variables</p>
          </div>
        </div>
      )}

      {/* TAB CONTENT: ADMIN SECURITY & PASSWORD */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 max-w-2xl">
          <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-purple-50/50">
            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-700">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Super Admin Password & Security</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage master credentials for <strong className="text-purple-700">infotech9290@gmail.com</strong>
              </p>
            </div>
          </div>

          <form onSubmit={handleAdminPasswordChange} className="p-6 sm:p-8 space-y-5">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm">
                  SA
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Super Admin Account</p>
                  <p className="text-xs text-slate-500 font-mono">infotech9290@gmail.com</p>
                </div>
              </div>
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                ACTIVE
              </span>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Current Password
              </Label>
              <Input
                type="password"
                value={adminCurrentPass}
                onChange={(e) => setAdminCurrentPass(e.target.value)}
                placeholder="Enter current password (default: admin)"
                required
                className="h-12 rounded-xl bg-slate-50 border-slate-200"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                New Strong Password
              </Label>
              <Input
                type="password"
                value={adminNewPass}
                onChange={(e) => setAdminNewPass(e.target.value)}
                placeholder="Enter new password (min. 6 characters)"
                required
                className="h-12 rounded-xl bg-slate-50 border-slate-200"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Confirm New Password
              </Label>
              <Input
                type="password"
                value={adminConfirmPass}
                onChange={(e) => setAdminConfirmPass(e.target.value)}
                placeholder="Re-enter new password to confirm"
                required
                className="h-12 rounded-xl bg-slate-50 border-slate-200"
              />
            </div>

            {adminPassMsg && (
              <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 ${
                adminPassStatus === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                <span>{adminPassMsg}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={adminPassStatus === 'loading' || !adminCurrentPass || !adminNewPass}
              className="w-full h-12 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              {adminPassStatus === 'loading' ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Updating Supabase...</>
              ) : adminPassStatus === 'success' ? (
                <><Check className="w-4 h-4 mr-2" /> Password Updated!</>
              ) : (
                <><Lock className="w-4 h-4 mr-2" /> Update Super Admin Password</>
              )}
            </Button>
          </form>
        </div>
      )}

    </div>
  );
}
