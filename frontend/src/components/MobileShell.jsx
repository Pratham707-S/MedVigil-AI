import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Pill, Clock, FileText, ChevronDown, Type } from 'lucide-react';
import { checkHealth } from '../services/api';

export function MobileShell({ children }) {
  const location = useLocation();
  const [healthStatus, setHealthStatus] = useState('checking');
  const [largeTextMode, setLargeTextMode] = useState(false);

  useEffect(() => {
    async function verify() {
      const res = await checkHealth();
      setHealthStatus(res.status === 'ok' ? 'ok' : 'offline');
    }
    verify();
  }, []);

  const isReviewScreen = location.pathname.startsWith('/review');

  const navItems = [
    { to: '/', label: 'Home', icon: Home, matchExact: true },
    { to: '/medicines', label: 'Medicines', icon: Pill },
    { to: '/timeline', label: 'Timeline', icon: Clock },
    { to: '/summary', label: 'Summary', icon: FileText },
  ];

  return (
    <div className={`min-h-dvh bg-slate-100 flex justify-center text-slate-900 ${largeTextMode ? 'text-[1.08rem]' : ''}`}>
      {/* Mobile container: max-w-md, min-h-dvh, shadow-sm */}
      <div className="w-full max-w-md min-h-dvh bg-white flex flex-col shadow-sm relative border-x border-slate-200">
        
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-2xs">
          {/* Logo with Unified Primary Color */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-700 to-sky-500 text-white flex items-center justify-center font-black text-base shadow-xs font-heading">
              Rx
            </div>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight leading-tight font-heading">
                MedVigil AI
              </h1>
              <span className="text-[10px] font-bold text-sky-700 block -mt-0.5 tracking-wider uppercase">
                Clinical Reconciliation
              </span>
            </div>
          </div>

          {/* Right Header items */}
          <div className="flex items-center gap-1.5">
            {/* Elderly Friendly Large Text (Aa) Toggle */}
            <button
              type="button"
              onClick={() => setLargeTextMode(!largeTextMode)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                largeTextMode
                  ? 'bg-sky-600 text-white border-sky-700 shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title="Toggle Large Text / Senior Reading Mode"
              aria-label="Toggle Senior Reading Mode"
            >
              <Type className="w-3.5 h-3.5" />
              <span>Aa</span>
            </button>

            {/* Language pill */}
            <button
              type="button"
              className="inline-flex items-center gap-0.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg text-xs font-semibold text-slate-700 transition"
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
                    ? 'bg-sky-500 ring-2 ring-sky-200 animate-pulse'
                    : 'bg-amber-500 ring-2 ring-amber-200'
                }`}
              />
              <span className="text-[11px] font-bold text-slate-700">
                {healthStatus === 'ok' ? 'Ready' : 'Demo'}
              </span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className={`flex-1 overflow-y-auto px-4 py-4 ${isReviewScreen ? 'pb-8' : 'pb-24'}`}>
          {children}
        </main>

        {/* Bottom Navigation: Unified primary active state */}
        {!isReviewScreen && (
          <nav
            className="fixed bottom-0 z-30 w-full max-w-md bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex justify-around shadow-lg"
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
                      ? 'text-sky-700 font-extrabold bg-sky-50'
                      : 'text-slate-500 hover:text-slate-800 font-semibold'
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
