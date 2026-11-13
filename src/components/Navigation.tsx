'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, BookOpen, CheckCircle, FileText, Globe, Sparkles, Camera } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useOffline } from '@/hooks/useOffline';

export function Navigation() {
  const pathname = usePathname();
  const { currentLanguage, setIsModalOpen, t } = useLanguage();
  const { isOffline } = useOffline();

  const navItems = [
    { href: '/chat', label: 'बोलें / Chat', icon: MessageSquare },
    { href: '/schemes', label: t('schemes'), icon: BookOpen },
    { href: '/eligibility', label: t('eligibility'), icon: CheckCircle },
    { href: '/grievance', label: t('grievance'), icon: FileText },
  ];

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF671F] via-white to-[#046A38] p-[2px] shadow-sm flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#FF9933] group-hover:rotate-12 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-[#FF671F] to-[#046A38] bg-clip-text text-transparent">
                  जन एआई
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-800 font-semibold uppercase tracking-wider">
                  Bharat
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium leading-none">
                AI for Citizens & Welfare
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    px-3.5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all
                    ${
                      isActive
                        ? 'bg-orange-50 text-[#FF671F] shadow-xs border border-orange-200/60'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#FF671F]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Controls: Language Selector & Status */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isOffline && (
              <span className="text-[11px] font-bold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full border border-amber-300">
                ऑफलाइन / Offline
              </span>
            )}

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-100 hover:bg-orange-50 border border-slate-200 text-slate-800 text-xs sm:text-sm font-bold shadow-2xs transition-all active:scale-95"
              aria-label="Change Language"
            >
              <Globe className="w-4 h-4 text-[#FF671F]" />
              <span className="text-base leading-none">{currentLanguage.nativeName}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex justify-around items-center shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[11px] font-semibold transition-all
                ${isActive ? 'text-[#FF671F]' : 'text-slate-500 hover:text-slate-800'}
              `}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className="truncate max-w-[68px]">{item.label.split('/')[0].trim()}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
