import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Pill, Clock, FileText, ChevronDown } from 'lucide-react';
import { checkHealth } from '../services/api';

export function MobileShell({ children }) {
  const location = useLocation();
  const [healthStatus, setHealthStatus] = useState('checking');

  useEffect(() => {
    async function verify() {
      const res = await checkHealth();
      setHealthStatus(res.status === 'ok' ? 'ok' : 'offline');
    }
    verify();
  }, []);

  // Hide bottom nav on the Review Draft screen: /review/:prescriptionId or /review
  const isReviewScreen = location.pathname.startsWith('/review');

  const navItems = [
    { to: '/', label: 'Home', icon: Home, matchExact: true },
    { to: '/medicines', label: 'Medicines', icon: Pill },
    { to: '/timeline', label: 'Timeline', icon: Clock },
    { to: '/summary', label: 'Summary', icon: FileText },
  ];

  return (
    <div className="min-h-dvh bg-slate-100 flex justify-center text-slate-800">
      {/* Mobile container: max-w-md, min-h-dvh, shadow-sm */}
      <div className="w-full max-w-md min-h-dvh bg-white flex flex-col shadow-sm relative border-x border-slate-200/80">
        
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between shadow-2xs">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-700 to-teal-500 text-white flex items-center justify-center font-black text-base shadow-xs">
              Rx
            </div>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                MedVigil AI
              </h1>
              <span className="text-[10px] font-semibold text-emerald-700 block -mt-0.5">ORBIX RECONCILIATION</span>
            </div>
          </div>

          {/* Right Header items: Language pill + API Status dot */}
          <div className="flex items-center gap-2">
            {/* Language pill */}
            <button
              type="button"
              className="inline-flex items-center gap-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full text-xs font-semibold text-slate-700 transition"
              title="Change Language"
            >
              <span>EN</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Subtle API Status Dot */}
            <div
              className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full"
              title={healthStatus === 'ok' ? 'API Online / Mock Ready' : 'API Connecting'}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  healthStatus === 'ok'
                    ? 'bg-emerald-500 ring-2 ring-emerald-200 animate-pulse'
                    : 'bg-amber-500 ring-2 ring-amber-200'
                }`}
              />
              <span className="text-[11px] font-semibold text-slate-600">
                {healthStatus === 'ok' ? 'API Ready' : 'Connecting'}
              </span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className={`flex-1 overflow-y-auto px-4 py-4 ${isReviewScreen ? 'pb-8' : 'pb-24'}`}>
          {children}
        </main>

        {/* Bottom Navigation: 4 fixed tabs, min-h-[48px], hidden on /review */}
        {!isReviewScreen && (
          <nav
            className="fixed bottom-0 z-30 w-full max-w-md bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-2 py-1.5 flex justify-around shadow-lg"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 8px) + 4px)' }}
            aria-label="Mobile Bottom Navigation"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.matchExact
                ? location.pathname === '/' || location.pathname === '/upload'
                : location.pathname.startsWith(item.to);

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex flex-col items-center justify-center min-h-[48px] px-3 rounded-xl transition-all duration-150 flex-1 touch-manipulation ${
                    isActive
                      ? 'text-emerald-700 font-bold bg-emerald-50'
                      : 'text-slate-400 hover:text-slate-600 font-medium'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                  <span className="text-[11px] tracking-tight">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        )}

      </div>
    </div>
  );
}
