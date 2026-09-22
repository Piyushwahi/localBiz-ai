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
    <nav className="h-16 bg-white/90 backdrop-blur-xl border-b border-slate-900/[0.08] flex items-center justify-between px-6 z-50 flex-shrink-0 shadow-sm">
      {/* Brand */}
      <NavLink to="/dashboard" className="flex items-center gap-3 group">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-navy-900 via-navy-800 to-primary-600 flex items-center justify-center shadow-md shadow-navy-900/15 group-hover:scale-105 transition-transform duration-200">
          <span className="text-white font-extrabold text-sm tracking-tight">L</span>
        </div>
        <span className="font-extrabold text-navy-900 tracking-tight text-base">
          LocalBiz <span className="text-primary-600 font-bold">AI</span>
        </span>
      </NavLink>

      {/* Segmented navigation container */}
      <div className="flex items-center gap-1 bg-cream-100 p-1 rounded-xl border border-slate-900/[0.06] shadow-inner">
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
      <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white border border-slate-900/[0.08] text-xs shadow-sm">
        <span className="relative flex h-2 w-2">
          {configured && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${configured ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
        </span>
        <span className={`font-semibold ${configured ? 'text-emerald-700' : 'text-amber-700'}`}>
          {health
            ? (configured ? 'Azure Connected' : 'Config Required')
            : 'Checking...'}
        </span>
      </div>
    </nav>
  )
}
