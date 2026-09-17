'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Settings,
  Footprints,
  LogOut,
  PlusCircle,
  ArrowRightLeft,
  GraduationCap,
  UserCircle,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';

interface NavItem {
  id: string;
  name: string;
  icon: React.ElementType;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('overview');

  const navItems: NavItem[] = [
    { id: 'overview',   name: 'Overview & Leads',  icon: LayoutDashboard },
    { id: 'workers',    name: 'Manage Workers',    icon: Users },
    { id: 'settings',   name: 'System Settings',   icon: Settings },
    { id: 'footprints', name: 'Audit Footprints',  icon: Footprints },
  ];

  const [brandName, setBrandName] = useState('');

  useEffect(() => {
    fetch('/api/settings').then(res => res.json()).then(json => {
      const name = json.data?.brand?.websiteName;
      if (name) setBrandName(name);
    }).catch(console.error);
  }, []);

  // Keep currentTab synchronized with URL search params and custom events
  useEffect(() => {
    const syncFromUrl = () => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab') || 'overview';
      if (['overview', 'workers', 'settings', 'footprints', 'admission'].includes(tab)) {
        setCurrentTab(tab);
      }
    };

    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    
    const onTabChange = (e: CustomEvent) => {
      if (e.detail && ['overview', 'workers', 'settings', 'footprints', 'admission'].includes(e.detail)) {
        setCurrentTab(e.detail);
      }
    };
    window.addEventListener('admin-tab-change', onTabChange as EventListener);

    const onBrandUpdate = (e: CustomEvent) => {
      if (e.detail) {
        setBrandName(e.detail);
      }
    };
    window.addEventListener('brand-update', onBrandUpdate as EventListener);

    return () => {
      window.removeEventListener('popstate', syncFromUrl);
      window.removeEventListener('admin-tab-change', onTabChange as EventListener);
      window.removeEventListener('brand-update', onBrandUpdate as EventListener);
    };
  }, []);

  const switchTab = (tabId: string) => {
    setCurrentTab(tabId);
    if (typeof window !== 'undefined') {
      if (window.location.pathname !== '/admin/dashboard') {
        router.push(`/admin/dashboard?tab=${tabId}`);
      } else {
        const url = new URL(window.location.href);
        url.searchParams.set('tab', tabId);
        window.history.pushState({}, '', url.toString());
        window.dispatchEvent(new CustomEvent('admin-tab-change', { detail: tabId }));
      }
    }
  };

  return (
    <ProtectedRoute requireAdmin={true}>
      <div suppressHydrationWarning className="min-h-screen bg-slate-50 flex flex-col font-sans">
        
        {/* Top Master Navigation Bar (Single Controller - No Left Sidebar) */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20 gap-4">
              
              {/* Brand Logo */}
              <div 
                onClick={() => switchTab('overview')}
                className="flex items-center gap-3 cursor-pointer shrink-0 hover:opacity-90 transition-opacity"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">
                    {(brandName || 'Admissions Portal').split(' ')[0]} <span className="text-blue-600">{(brandName || 'Admissions Portal').split(' ').slice(1).join(' ')}</span>
                  </h1>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                    Admin Command Portal
                  </p>
                </div>
              </div>

              {/* Center Navigation Tabs (Desktop) */}
              <nav className="hidden lg:flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60">
                {navItems.map((item) => {
                  const isActive = currentTab === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => switchTab(item.id)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                        isActive
                          ? "bg-white text-blue-600 shadow-xs border border-slate-200/70"
                          : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                      )}
                    >
                      <Icon className={cn("w-4 h-4", isActive ? "text-blue-600" : "text-slate-400")} />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Right Side: Switch Worker + Logout */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                {/* Switch to Worker View */}
                <Link
                  href="/worker/my-dashboard"
                  className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-colors cursor-pointer"
                  title="Switch to Counselor/Worker View"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-amber-700" />
                  <span>Worker View</span>
                </Link>

                {/* Admin Profile Badge */}
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold">
                  <UserCircle className="w-4 h-4 text-slate-500" />
                  <span>Admin</span>
                </div>

                {/* Sign Out Button */}
                <button
                  type="button"
                  onClick={logout}
                  className="p-2.5 rounded-xl border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

            </div>

            {/* Mobile / Tablet Horizontal Scroll Tab Strip */}
            <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-3 pt-1 no-scrollbar border-t border-slate-100">
              {navItems.map((item) => {
                const isActive = currentTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => switchTab(item.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors",
                      isActive
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.name}</span>
                  </button>
                );
              })}
              <Link
                href="/worker/my-dashboard"
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 shrink-0"
              >
                <ArrowRightLeft className="w-3 h-3" />
                <span>Worker View</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content Area — Full Width! */}
        <main className="flex-1 w-full max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
