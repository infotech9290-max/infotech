'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Check, Loader2, Building2, Paintbrush, BookOpen, Plus, Trash2, LayoutTemplate } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'brand' | 'fees' | 'payment' | 'database'>('fees');
  
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
      } catch (err) {
        console.error('Failed to fetch payment settings from API', err);
      }
    };
    fetchSettings();
  }, []);

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

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
      } else {
        setDbStatus('error');
        setDbMsg(data.error || 'Setup failed. Check your PAT token.');
      }
    } catch {
      setDbStatus('error');
      setDbMsg('Network error. Please try again.');
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveStatus(null);
    
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

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server error: ${res.status}`);
      }

      // Update brand in header immediately
      if (activeTab === 'brand' && websiteName) {
        window.dispatchEvent(new CustomEvent('brand-update', { detail: websiteName }));
      }

      setSaveStatus('success');
    } catch (err) {
      console.error('Failed to save settings:', err);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  const addCourse = () => {
    setCourses([...courses, { id: Date.now(), name: 'New Course Name', fee: 0, minDownpayment: 0, commissionRate: 0, maxInstallments: 2, inst1: 0, inst2: 0, inst3: 0, inst4: 0 }]);
  };

  const updateCourse = (id: number, field: string, value: string | number) => {
    setCourses(courses.map(c => c.id === id ? { ...c, [field]: value } : c));
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600" /> Changes Saved
          </div>
        )}
      </div>

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
      </div>

      {/* TAB CONTENT: FEES */}
      {activeTab === 'fees' && (
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Manage Courses & Fees</h2>
              <p className="text-xs text-slate-500 mt-0.5">Set the dynamic fee structure and installments that appear in the worker's admission form.</p>
            </div>
            <Button onClick={addCourse} size="sm" className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm text-xs h-9 px-4">
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Course
            </Button>
          </div>
          
          <div className="p-6 overflow-x-auto">
             <table className="w-full text-left min-w-[1100px]">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500">
                    <th className="pb-3 font-bold w-48">Course Name</th>
                    <th className="pb-3 font-bold w-24">Total Fee (₹)</th>
                    <th className="pb-3 font-bold w-24">Min Down (₹)</th>
                    <th className="pb-3 font-bold w-16">EMIs</th>
                    <th className="pb-3 font-bold w-28">1st EMI (₹ & Mths)</th>
                    <th className="pb-3 font-bold w-28">2nd EMI (₹ & Mths)</th>
                    <th className="pb-3 font-bold w-28">3rd EMI (₹ & Mths)</th>
                    <th className="pb-3 font-bold w-28">4th EMI (₹ & Mths)</th>
                    <th className="pb-3 font-bold w-16 text-center">Comm. %</th>
                    <th className="pb-3 font-bold text-right w-12">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {courses.map((course) => (
                    <tr key={course.id} className="group">
                      <td className="py-3 pr-2">
                        <Input value={course.name} onChange={(e) => updateCourse(course.id, 'name', e.target.value)} className="h-9 rounded-lg text-xs font-medium border-transparent group-hover:border-slate-200 focus-visible:border-blue-500 bg-slate-50 group-hover:bg-white transition-all shadow-none" />
                      </td>
                      <td className="py-3 pr-2">
                        <Input type="number" value={course.fee} onChange={(e) => updateCourse(course.id, 'fee', Number(e.target.value))} className="h-9 rounded-lg text-xs font-mono border-transparent group-hover:border-slate-200 focus-visible:border-blue-500 bg-slate-50 group-hover:bg-white transition-all shadow-none" />
                      </td>
                      <td className="py-3 pr-2">
                        <Input type="number" value={course.minDownpayment} onChange={(e) => updateCourse(course.id, 'minDownpayment', Number(e.target.value))} className="h-9 rounded-lg text-xs font-mono border-transparent group-hover:border-slate-200 focus-visible:border-blue-500 bg-slate-50 group-hover:bg-white transition-all shadow-none" />
                      </td>
                      <td className="py-3 pr-2">
                        <Input type="number" min="1" max="4" value={course.maxInstallments || 1} onChange={(e) => updateCourse(course.id, 'maxInstallments', Number(e.target.value))} className="h-9 rounded-lg text-xs font-mono border-transparent group-hover:border-slate-200 focus-visible:border-blue-500 bg-slate-50 group-hover:bg-white transition-all shadow-none text-center p-1" />
                      </td>
                      <td className="py-3 pr-2">
                        <div className="flex flex-col gap-1">
                          <Input type="number" placeholder="Amt" value={course.inst1 || 0} onChange={(e) => updateCourse(course.id, 'inst1', Number(e.target.value))} disabled={(course.maxInstallments || 1) < 1} className="h-7 rounded text-[11px] font-mono border-slate-200 bg-white disabled:opacity-30 shadow-none px-2" />
                          <Input type="number" placeholder="Months" value={(course as any).inst1Months || 1} onChange={(e) => updateCourse(course.id, 'inst1Months', Number(e.target.value))} disabled={(course.maxInstallments || 1) < 1} className="h-7 rounded text-[11px] font-mono border-slate-200 bg-slate-50 disabled:opacity-30 shadow-none px-2" title="Months after admission" />
                        </div>
                      </td>
                      <td className="py-3 pr-2">
                        <div className="flex flex-col gap-1">
                          <Input type="number" placeholder="Amt" value={course.inst2 || 0} onChange={(e) => updateCourse(course.id, 'inst2', Number(e.target.value))} disabled={(course.maxInstallments || 1) < 2} className="h-7 rounded text-[11px] font-mono border-slate-200 bg-white disabled:opacity-30 shadow-none px-2" />
                          <Input type="number" placeholder="Months" value={(course as any).inst2Months || 2} onChange={(e) => updateCourse(course.id, 'inst2Months', Number(e.target.value))} disabled={(course.maxInstallments || 1) < 2} className="h-7 rounded text-[11px] font-mono border-slate-200 bg-slate-50 disabled:opacity-30 shadow-none px-2" title="Months after admission" />
                        </div>
                      </td>
                      <td className="py-3 pr-2">
                        <div className="flex flex-col gap-1">
                          <Input type="number" placeholder="Amt" value={course.inst3 || 0} onChange={(e) => updateCourse(course.id, 'inst3', Number(e.target.value))} disabled={(course.maxInstallments || 1) < 3} className="h-7 rounded text-[11px] font-mono border-slate-200 bg-white disabled:opacity-30 shadow-none px-2" />
                          <Input type="number" placeholder="Months" value={(course as any).inst3Months || 3} onChange={(e) => updateCourse(course.id, 'inst3Months', Number(e.target.value))} disabled={(course.maxInstallments || 1) < 3} className="h-7 rounded text-[11px] font-mono border-slate-200 bg-slate-50 disabled:opacity-30 shadow-none px-2" title="Months after admission" />
                        </div>
                      </td>
                      <td className="py-3 pr-2">
                        <div className="flex flex-col gap-1">
                          <Input type="number" placeholder="Amt" value={course.inst4 || 0} onChange={(e) => updateCourse(course.id, 'inst4', Number(e.target.value))} disabled={(course.maxInstallments || 1) < 4} className="h-7 rounded text-[11px] font-mono border-slate-200 bg-white disabled:opacity-30 shadow-none px-2" />
                          <Input type="number" placeholder="Months" value={(course as any).inst4Months || 4} onChange={(e) => updateCourse(course.id, 'inst4Months', Number(e.target.value))} disabled={(course.maxInstallments || 1) < 4} className="h-7 rounded text-[11px] font-mono border-slate-200 bg-slate-50 disabled:opacity-30 shadow-none px-2" title="Months after admission" />
                        </div>
                      </td>
                      <td className="py-3 pr-2 text-center">
                        <Input type="number" value={course.commissionRate} onChange={(e) => updateCourse(course.id, 'commissionRate', Number(e.target.value))} className="h-9 rounded-lg text-xs font-mono border-transparent group-hover:border-slate-200 focus-visible:border-blue-500 bg-slate-50 group-hover:bg-white transition-all shadow-none text-center p-1" />
                      </td>
                      <td className="py-3 text-right">
                        <Button variant="ghost" size="icon" onClick={() => deleteCourse(course.id)} className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
             <div className="pt-6 flex justify-end">
               <Button onClick={() => handleSave()} disabled={isSaving} className="px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-xl shadow-md transition-all cursor-pointer">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Save Fee Structure
               </Button>
             </div>
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
                <Input value={bankIfsc} onChange={(e) => setBankIfsc(e.target.value)} className="h-12 rounded-xl border-slate-200 font-mono text-sm uppercase" />
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
              <p><span className="text-blue-600">SUPABASE_URL</span> = https://ozjqjhcyckximousfypo.supabase.co</p>
              <p><span className="text-blue-600">SUPABASE_ANON_KEY</span> = eyJhbGci...</p>
              <p><span className="text-red-600">SUPABASE_PAT</span> = sbp_... (your personal access token)</p>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Vercel: Project → Settings → Environment Variables</p>
          </div>
        </div>
      )}

    </div>
  );
}
