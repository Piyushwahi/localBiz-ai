/**
 * SearchPanel — Premium AI-style location & business analysis configurator.
 * Glassmorphism design with animated states, typewriter hints, and live feedback.
 */
import { useState, useEffect, useRef } from 'react'
import {
  Search, MapPin, Navigation, Crosshair,
  Loader2, Zap, RotateCcw, ChevronDown,
  Cpu, Radar, Brain, Sparkles
} from 'lucide-react'
import { searchAddress } from '../services/api'
import { BUSINESS_TYPES } from '../data/businessTypes'

const RADII = [
  { value: 0.5, label: '500m' },
  { value: 1.0, label: '1 km' },
  { value: 2.0, label: '2 km' },
  { value: 3.0, label: '3 km' },
  { value: 5.0, label: '5 km' },
]

const PLACEHOLDERS = [
  'Patiala Adalat Bazar, Punjab',
  'Connaught Place, New Delhi',
  'MG Road, Bangalore',
  'Park Street, Kolkata',
  'Bandra West, Mumbai',
  'Sector 17, Chandigarh',
]

const AGENT_STEPS = [
  { icon: '🗺️', label: 'Azure Maps', status: 'maps_fetching' },
  { icon: '📍', label: 'Candidates', status: 'generating_candidates' },
  { icon: '🤖', label: 'AI Agents', status: 'debating' },
  { icon: '⚖️', label: 'Judge', status: 'debating' },
  { icon: '✅', label: 'Complete', status: 'complete' },
]

export default function SearchPanel({ onAnalyze, onLocationSelect, status, onReset }) {
  const [businessType, setBusinessType] = useState('restaurant')
  const [radius, setRadius] = useState(2.0)
  const [addressInput, setAddressInput] = useState('')
  const [coordinates, setCoordinates] = useState(null)
  const [selectedAddress, setSelectedAddress] = useState('')
  const [searching, setSearching] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [placeholderIdx, setPlaceholderIdx] = useState(0)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const inputRef = useRef(null)

  const isRunning = ['starting', 'polling', 'geocoding', 'maps_fetching', 'generating_candidates', 'debating'].includes(status)
  const isComplete = status === 'complete'
  const isError = status === 'error'

  // Rotate placeholder hints
  useEffect(() => {
    const t = setInterval(() => setPlaceholderIdx(i => (i + 1) % PLACEHOLDERS.length), 3000)
    return () => clearInterval(t)
  }, [])

  const QUICK_PRESETS = [
    { label: 'Patiala (Center)', query: 'Patiala, Punjab, India', coords: { latitude: 30.3398, longitude: 76.3869 } },
    { label: 'Leela Bhawan, Patiala', query: 'Leela Bhawan, Patiala, Punjab', coords: { latitude: 30.3421, longitude: 76.3768 } },
    { label: 'Adalat Bazar, Patiala', query: 'Adalat Bazar, Patiala, Punjab', coords: { latitude: 30.3289, longitude: 76.4011 } },
    { label: 'Urban Estate, Patiala', query: 'Urban Estate Phase 2, Patiala, Punjab', coords: { latitude: 30.3556, longitude: 76.4320 } },
    { label: 'Chandigarh (Sec 17)', query: 'Sector 17, Chandigarh, India', coords: { latitude: 30.7398, longitude: 76.7827 } },
  ]

  // Restore last selected location if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem('localbiz_last_location')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.coordinates && parsed.address) {
          setCoordinates(parsed.coordinates)
          setSelectedAddress(parsed.address)
          setAddressInput(parsed.address)
          onLocationSelect?.(parsed.coordinates)
        }
      } else {
        // Default to Patiala
        const defaultPreset = QUICK_PRESETS[0]
        setCoordinates(defaultPreset.coords)
        setSelectedAddress(defaultPreset.query)
        setAddressInput(defaultPreset.query)
        onLocationSelect?.(defaultPreset.coords)
      }
    } catch (_) {}
  }, [])

  const selectPreset = (preset) => {
    setCoordinates(preset.coords)
    setSelectedAddress(preset.query)
    setAddressInput(preset.query)
    setSearchError('')
    onLocationSelect?.(preset.coords)
    try {
      localStorage.setItem('localbiz_last_location', JSON.stringify({ coordinates: preset.coords, address: preset.query }))
    } catch (_) {}
  }

  const selectedBusiness = BUSINESS_TYPES.find(b => b.value === businessType) || BUSINESS_TYPES[0]

  const handleAddressSearch = async (e) => {
    e.preventDefault()
    if (!addressInput.trim()) return
    setSearching(true)
    setSearchError('')
    setSelectedAddress('')
    setCoordinates(null)
    try {
      const result = await searchAddress(addressInput)
      setCoordinates(result.coordinates)
      setSelectedAddress(result.address)
      onLocationSelect?.(result.coordinates)
      try {
        localStorage.setItem('localbiz_last_location', JSON.stringify({ coordinates: result.coordinates, address: result.address }))
      } catch (_) {}
    } catch (err) {
      setSearchError(err?.response?.data?.detail || 'Address not found. Try a more specific address.')
    } finally {
      setSearching(false)
    }
  }

  const [ispWarning, setIspWarning] = useState(false)

  const handleGeolocation = () => {
    if (!navigator.geolocation) return setSearchError('Geolocation not supported.')
    setGeoLoading(true)
    setIspWarning(false)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const rawCoords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
        
        // Detect if desktop browser IP/ISP geolocation routed to Chandigarh (30.73, 76.77)
        const isChandigarhISP = Math.abs(rawCoords.latitude - 30.7333) < 0.12 && Math.abs(rawCoords.longitude - 76.779) < 0.12
        
        if (isChandigarhISP) {
          // Flag ISP routing and auto-correct to Patiala
          setIspWarning(true)
          const patialaCoords = { latitude: 30.3398, longitude: 76.3869 }
          const patialaAddr = 'Patiala, Punjab, India'
          setCoordinates(patialaCoords)
          setSelectedAddress(patialaAddr)
          setAddressInput(patialaAddr)
          onLocationSelect?.(patialaCoords)
          try {
            localStorage.setItem('localbiz_last_location', JSON.stringify({ coordinates: patialaCoords, address: patialaAddr }))
          } catch (_) {}
        } else {
          setCoordinates(rawCoords)
          const addr = `${rawCoords.latitude.toFixed(5)}, ${rawCoords.longitude.toFixed(5)}`
          setSelectedAddress(addr)
          setAddressInput(addr)
          onLocationSelect?.(rawCoords)
          try {
            localStorage.setItem('localbiz_last_location', JSON.stringify({ coordinates: rawCoords, address: addr }))
          } catch (_) {}
        }
        setGeoLoading(false)
      },
      () => { setSearchError('Location access denied or timed out.'); setGeoLoading(false) },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    )
  }

  const handleAnalyze = () => {
    if (!coordinates || isRunning) return
    onAnalyze?.({ latitude: coordinates.latitude, longitude: coordinates.longitude, business_type: businessType, radius_km: radius })
  }

  const currentStepIdx = AGENT_STEPS.findIndex(s => s.status === status)

  return (
    <div className="w-[320px] min-w-[320px] max-w-[320px] flex-shrink-0 flex flex-col overflow-y-auto border-r border-slate-900/[0.08] bg-white">

      {/* ── Header ── */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-900/[0.06] bg-cream-50/70">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-primary-50 border border-primary-200 flex items-center justify-center">
            <Radar size={14} className="text-primary-600" />
          </div>
          <span className="text-xs font-bold text-navy-900 uppercase tracking-widest">LocalBiz AI</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
          9 AI agents · Azure Maps data · Evidence-based
        </p>
      </div>

      <div className="flex flex-col gap-0 flex-1 px-4 py-4 space-y-5">

        {/* ── Business Type ── */}
        <div>
          <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">
            Business Type
          </label>
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(o => !o)}
              disabled={isRunning}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm text-left transition-all duration-200 bg-white border-slate-900/[0.09] shadow-sm hover:border-slate-900/[0.18]"
            >
              <span className="text-xl leading-none">{selectedBusiness.emoji}</span>
              <span className="flex-1 font-semibold text-navy-900">{selectedBusiness.label}</span>
              <ChevronDown size={13} className={`text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl border border-slate-900/[0.08] overflow-hidden shadow-xl bg-white">
                {BUSINESS_TYPES.map(b => (
                  <button
                    key={b.value}
                    onClick={() => { setBusinessType(b.value); setDropdownOpen(false) }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors duration-150 ${
                      b.value === businessType
                        ? 'bg-primary-50 text-primary-700 font-semibold'
                        : 'text-slate-600 hover:bg-cream-100 hover:text-navy-900'
                    }`}
                  >
                    <span className="text-base">{b.emoji}</span>
                    <span>{b.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Location Input ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Your Location
            </label>
            <span className="text-[10px] text-primary-400 font-medium">Patiala, Punjab</span>
          </div>

          {/* Quick Preset Location Chips */}
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            {QUICK_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => selectPreset(p)}
                disabled={isRunning}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all duration-200 flex items-center gap-1 border ${
                  selectedAddress.includes(p.label.split(' ')[0])
                    ? 'bg-primary-500/20 border-primary-500/40 text-primary-300 shadow-sm'
                    : 'bg-white/[0.03] border-white/[0.06] text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]'
                }`}
              >
                <MapPin size={10} className="text-primary-400 flex-shrink-0" />
                {p.label}
              </button>
            ))}
          </div>

          {/* Search form */}
          <form onSubmit={handleAddressSearch} className="relative mb-2">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={addressInput}
                onChange={e => { setAddressInput(e.target.value); setSearchError('') }}
                placeholder={PLACEHOLDERS[placeholderIdx]}
                disabled={isRunning || searching}
                className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border transition-all duration-200 bg-white border-slate-900/[0.09] text-navy-900 shadow-sm focus:border-primary-500"
              />
              <button
                type="submit"
                disabled={!addressInput.trim() || searching || isRunning}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 disabled:opacity-30 bg-primary-50 text-primary-600 hover:bg-primary-100"
              >
                {searching
                  ? <Loader2 size={11} className="animate-spin text-primary-600" />
                  : <Search size={11} className="text-primary-600" />}
              </button>
            </div>
          </form>

          {/* GPS button */}
          <button
            onClick={handleGeolocation}
            disabled={isRunning || geoLoading}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border border-slate-900/[0.09] text-navy-800 bg-cream-50 hover:bg-cream-100 hover:border-slate-900/[0.18] shadow-sm disabled:opacity-40"
          >
            {geoLoading ? <Loader2 size={12} className="animate-spin text-primary-600" /> : <Navigation size={12} className="text-primary-600" />}
            Use GPS Location
          </button>

          {ispWarning && (
            <div className="mt-2 p-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 leading-snug">
              <span className="font-bold text-amber-900">⚡ ISP Auto-Corrected:</span> Your desktop internet routes through the Chandigarh telecom hub. Location was automatically set to <strong>Patiala (30.3398, 76.3869)</strong>.
            </div>
          )}

          <p className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1">
            <Crosshair size={10} /> Or click directly on the map
          </p>

          {/* Confirmed location */}
          {selectedAddress && !searchError && (
            <div className="mt-2.5 px-3 py-2.5 rounded-xl border border-emerald-500/25 bg-emerald-50/70 shadow-sm animate-fade-in">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-md bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin size={10} className="text-emerald-700" />
                </div>
                <div>
                  <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider mb-0.5">Geocoded ✓</p>
                  <p className="text-xs text-emerald-900 leading-relaxed font-semibold">{selectedAddress}</p>
                  {coordinates && (
                    <p className="text-[10px] text-emerald-700 mt-0.5 font-mono">
                      {coordinates.latitude.toFixed(5)}, {coordinates.longitude.toFixed(5)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {searchError && (
            <p className="mt-2 text-xs text-red-600 flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
              {searchError}
            </p>
          )}
        </div>

        {/* ── Radius ── */}
        <div>
          <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">
            Search Radius
          </label>
          <div className="grid grid-cols-5 gap-1">
            {RADII.map(r => (
              <button
                key={r.value}
                onClick={() => setRadius(r.value)}
                disabled={isRunning}
                className={`py-2 rounded-lg text-[11px] font-bold transition-all duration-200 border ${
                  radius === r.value
                    ? 'text-white bg-primary-600 border-primary-700 shadow-sm'
                    : 'text-slate-600 bg-white border-slate-900/[0.08] hover:bg-cream-50'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Agent pipeline progress ── */}
        {(isRunning || isComplete) && (
          <div className="rounded-xl border border-slate-900/[0.08] p-3 animate-fade-in bg-white shadow-sm">
            <div className="flex items-center gap-1.5 mb-3">
              <span className="text-[10px] font-bold text-primary-400 uppercase tracking-widest">Agent Pipeline</span>
              {isRunning && <Loader2 size={10} className="animate-spin text-primary-400 ml-auto" />}
            </div>
            <div className="space-y-1.5">
              {AGENT_STEPS.map((step, i) => {
                const done = isComplete || (currentStepIdx > i)
                const active = !isComplete && currentStepIdx === i
                return (
                  <div key={step.label} className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[11px] flex-shrink-0 transition-all duration-300 ${
                      done ? 'bg-emerald-500/20 border border-emerald-500/30'
                        : active ? 'bg-primary-500/20 border border-primary-500/40'
                        : 'bg-white/[0.03] border border-white/[0.06]'
                    }`}>
                      {done ? '✓' : active ? <Loader2 size={9} className="animate-spin text-primary-400" /> : step.icon}
                    </div>
                    <span className={`text-[11px] font-medium transition-colors duration-300 ${
                      done ? 'text-emerald-400' : active ? 'text-primary-300' : 'text-slate-600'
                    }`}>{step.label}</span>
                    {active && (
                      <span className="ml-auto flex gap-0.5">
                        {[0,1,2].map(d => (
                          <span key={d} className="w-1 h-1 rounded-full bg-primary-400 animate-bounce"
                            style={{ animationDelay: `${d * 0.15}s` }} />
                        ))}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {isError && (
          <div className="rounded-xl border border-red-500/20 p-3"
            style={{ background: 'rgba(239,68,68,0.06)' }}>
            <p className="text-xs text-red-400">Analysis failed. Please try again.</p>
          </div>
        )}

        {/* ── CTA ── */}
        <div className="mt-auto space-y-2 pt-2">
          <button
            onClick={handleAnalyze}
            disabled={!coordinates || isRunning}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            style={{
              background: !coordinates || isRunning
                ? 'rgba(80,80,232,0.3)'
                : 'linear-gradient(135deg, #5050e8 0%, #6470f3 50%, #8097fe 100%)',
              color: 'white',
              boxShadow: !coordinates || isRunning
                ? 'none'
                : '0 0 20px rgba(100,112,243,0.4), 0 4px 15px rgba(80,80,232,0.3)',
              border: '1px solid rgba(100,112,243,0.4)',
            }}
          >
            {isRunning
              ? <><Loader2 size={15} className="animate-spin" /> Analyzing…</>
              : <><Zap size={15} /><span>Run AI Analysis</span><Sparkles size={13} className="opacity-70" /></>
            }
          </button>

          {status !== 'idle' && (
            <button
              onClick={onReset}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-300 transition-colors border border-transparent hover:border-white/[0.06]"
            >
              <RotateCcw size={11} /> New Analysis
            </button>
          )}
        </div>

        {/* ── Footer note ── */}
        <p className="text-[10px] text-slate-700 text-center leading-relaxed pb-2">
          Evidence-based decision support only.<br />Does not guarantee business success.
        </p>
      </div>
    </div>
  )
}
