/**
 * Navbar — Top navigation bar with route links, live status indicator, and brand badge.
 */
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Map, Users, MessageSquare,
  BookOpen, Info, Activity, Sparkles
} from 'lucide-react'

const LINKS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/map-analysis', icon: Map, label: 'Map' },
  { to: '/candidates', icon: Users, label: 'Candidates' },
  { to: '/debate', icon: MessageSquare, label: 'Debate' },
  { to: '/docs', icon: BookOpen, label: 'Docs' },
  { to: '/about', icon: Info, label: 'About' },
]

export default function Navbar({ health }) {
  const configured = health?.azure_maps_configured && health?.foundry_configured

  return (
    <>
      {/* Top Navbar */}
      <nav className="h-14 md:h-16 bg-white/95 backdrop-blur-xl border-b border-slate-900/[0.08] flex items-center justify-between px-3.5 md:px-6 z-40 flex-shrink-0 shadow-xs">
        {/* Brand */}
        <NavLink to="/dashboard" className="flex items-center gap-2 md:gap-3 group">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-xl bg-gradient-to-br from-navy-900 via-navy-800 to-primary-600 flex items-center justify-center shadow-md shadow-navy-900/15 group-hover:scale-105 transition-transform duration-200">
            <span className="text-white font-extrabold text-xs md:text-sm tracking-tight">L</span>
          </div>
          <span className="font-extrabold text-navy-900 tracking-tight text-sm md:text-base">
            LocalBiz <span className="text-primary-600 font-bold">AI</span>
          </span>
        </NavLink>

        {/* Desktop Segmented navigation container */}
        <div className="hidden md:flex items-center gap-1 bg-cream-100 p-1 rounded-xl border border-slate-900/[0.06] shadow-inner">
          {LINKS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all duration-200 ${
                  isActive
                    ? 'text-navy-900 bg-white border border-slate-900/[0.08] shadow-sm'
                    : 'text-slate-500 hover:text-navy-900 hover:bg-white/60 border border-transparent'
                }`
              }
            >
              <Icon size={14} className="opacity-90" />
              {label}
            </NavLink>
          ))}
        </div>

        {/* Live status badge */}
        <div className="flex items-center gap-1.5 md:gap-2 px-2.5 py-1 md:px-3 md:py-1.5 rounded-xl bg-white border border-slate-900/[0.08] text-[11px] md:text-xs shadow-xs">
          <span className="relative flex h-2 w-2">
            {configured && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${configured ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          </span>
          <span className={`font-semibold ${configured ? 'text-emerald-700' : 'text-amber-700'}`}>
            {health
              ? (configured ? 'Connected' : 'Config Req')
              : 'Checking...'}
          </span>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar (Phone App Feel) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-2xl px-2 py-1.5 flex items-center justify-around pb-safe">
        {LINKS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-primary-700 font-bold bg-primary-50/80 scale-105'
                  : 'text-slate-500 hover:text-navy-900'
              }`
            }
          >
            <Icon size={17} />
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </>
  )
}
