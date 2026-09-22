/**
 * MapView — Azure Maps Web SDK integration.
 * Fetches the Maps subscription key from the backend (/api/location/maps-key)
 * so the key is never hard-coded in the frontend bundle.
 *
 * Renders:
 *   - Home location marker (gradient 🏠 pin)
 *   - Red translucent search-zone circle
 *   - Candidate markers with labels
 *   - POI markers by category
 *   - Category toggle bar
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { checkHealth } from '../services/api'
import axios from 'axios'

const CATEGORY_COLORS = {
  restaurant: '#f97316',
  cafe: '#a78bfa',
  coffee: '#a78bfa',
  school: '#34d399',
  office: '#60a5fa',
  hospital: '#f43f5e',
  clinic: '#fb923c',
  shopping: '#fbbf24',
  supermarket: '#fbbf24',
  gym: '#06b6d4',
  fitness: '#06b6d4',
  hotel: '#8b5cf6',
  pharmacy: '#10b981',
  bank: '#6366f1',
  transit: '#14b8a6',
  parking: '#6b7280',
  park: '#22c55e',
  college: '#a855f7',
  bakery: '#f59e0b',
  bar: '#3b82f6',
  default: '#94a3b8',
}

const getCategoryColor = (cat) => {
  const lower = (cat || '').toLowerCase()
  for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
    if (lower.includes(key)) return color
  }
  return CATEGORY_COLORS.default
}

const CANDIDATE_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6']

export default function MapView({
  homeCoords,
  radius = 2,
  pois = [],
  candidates = [],
  selectedCandidate,
  onCandidateSelect,
  onMapClick,
}) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const popupRef = useRef(null)
  const [mapReady, setMapReady] = useState(false)
  const [mapsKey, setMapsKey] = useState(null)
  const [keyError, setKeyError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [visibleCategories, setVisibleCategories] = useState(new Set())
  const [categories, setCategories] = useState([])

  // ── Step 1: Fetch the maps key — auto-retry up to 10x every 3s ──
  useEffect(() => {
    let cancelled = false
    const fetchKey = () => {
      axios.get('/api/location/maps-key')
        .then(r => {
          if (cancelled) return
          if (r.data.key) {
            setMapsKey(r.data.key)
            setKeyError(false)
          } else {
            setKeyError(true)
          }
        })
        .catch(() => {
          if (cancelled) return
          setKeyError(true)
        })
    }
    fetchKey()
    return () => { cancelled = true }
  }, [retryCount])

  // ── Step 2: Wait for atlas SDK + key, then init map ──
  useEffect(() => {
    if (!mapsKey || !mapRef.current || mapInstance.current) return

    const tryInit = () => {
      if (typeof window.atlas === 'undefined') {
        setTimeout(tryInit, 300)
        return
      }
      const map = new window.atlas.Map(mapRef.current, {
        center: [homeCoords?.longitude ?? 77.2, homeCoords?.latitude ?? 20.5],
        zoom: homeCoords ? 13 : 4,
        style: 'road',
        language: 'en-US',
        authOptions: {
          authType: 'subscriptionKey',
          subscriptionKey: mapsKey,
        },
      })

      map.events.add('ready', () => {
        mapInstance.current = map
        setMapReady(true)

        // Initialize reusable location popup
        popupRef.current = new window.atlas.Popup({
          fillColor: '#faf8f5',
          pixelOffset: [0, -36],
          closeButton: true,
        })

        map.events.add('click', (e) => {
          if (e.position) {
            onMapClick?.({ latitude: e.position[1], longitude: e.position[0] })
          }
        })
      })
    }
    tryInit()

    return () => {
      if (popupRef.current) {
        popupRef.current.close()
        popupRef.current = null
      }
      if (mapInstance.current) {
        mapInstance.current.dispose()
        mapInstance.current = null
        setMapReady(false)
      }
    }
  }, [mapsKey])

  // ── Step 3: Update POI category list ──
  useEffect(() => {
    const cats = [...new Set(pois.map(p => p.category))]
    setCategories(cats)
    setVisibleCategories(new Set(cats))
  }, [pois])

  // ── Step 4: Render data whenever map or data changes ──
  const renderMapData = useCallback(() => {
    const map = mapInstance.current
    if (!map || !homeCoords) return

    // Clear previous localbiz layers & sources
    try {
      map.layers.getLayers().forEach(l => {
        if (l.getId()?.startsWith('lb-')) map.layers.remove(l)
      })
      map.sources.getSources().forEach(s => {
        if (s.getId()?.startsWith('lb-')) map.sources.remove(s)
      })
      map.markers.clear()
    } catch {}

    // Pan to home
    map.setCamera({
      center: [homeCoords.longitude, homeCoords.latitude],
      zoom: radius <= 1 ? 14 : radius <= 2 ? 13 : 12,
      type: 'ease',
      duration: 600,
    })

    // Search-zone circle
    const circleDs = new window.atlas.source.DataSource('lb-circle')
    map.sources.add(circleDs)
    circleDs.add(new window.atlas.data.Feature(
      new window.atlas.data.Point([homeCoords.longitude, homeCoords.latitude])
    ))
    map.layers.add(new window.atlas.layer.BubbleLayer(circleDs, 'lb-circle-fill', {
      radius: radius * 1000 * 0.09,
      color: 'rgba(239,68,68,0.07)',
      strokeColor: 'rgba(239,68,68,0.55)',
      strokeWidth: 1.5,
    }))

    // Home marker
    map.markers.add(new window.atlas.HtmlMarker({
      htmlContent: `
        <div style="display:flex;flex-direction:column;align-items:center;">
          <div style="
            width:38px;height:38px;
            background:linear-gradient(135deg,#6470f3,#f97316);
            border-radius:50%;border:3px solid white;
            display:flex;align-items:center;justify-content:center;
            box-shadow:0 4px 20px rgba(100,112,243,0.6),0 0 0 4px rgba(100,112,243,0.15);
          ">🏠</div>
          <div style="
            background:rgba(11,13,23,0.95);color:white;
            font-size:9px;font-weight:800;letter-spacing:1px;
            padding:2px 6px;border-radius:4px;margin-top:2px;
            border:1px solid rgba(100,112,243,0.35);white-space:nowrap;
          ">YOUR LOCATION</div>
        </div>`,
      position: [homeCoords.longitude, homeCoords.latitude],
      anchor: 'bottom',
    }))

    // POI markers
    // POI markers with tooltips
    pois.forEach(poi => {
      if (!visibleCategories.has(poi.category)) return
      const color = getCategoryColor(poi.category)
      map.markers.add(new window.atlas.HtmlMarker({
        htmlContent: `<div title="${poi.name} (${poi.category})" style="
          width:10px;height:10px;background:${color};border-radius:50%;
          border:1.5px solid white;
          box-shadow:0 0 6px ${color}80;opacity:0.9;cursor:pointer;
        "></div>`,
        position: [poi.coordinates.longitude, poi.coordinates.latitude],
        anchor: 'center',
      }))
    })

    // Candidate markers
    candidates.forEach((cand, i) => {
      const color = CANDIDATE_COLORS[i % CANDIDATE_COLORS.length]
      const letter = cand.label?.split(' ')[1]?.slice(0, 1) || String.fromCharCode(65 + i)
      const isSelected = selectedCandidate?.id === cand.id
      const size = isSelected ? 44 : 36
      const marker = new window.atlas.HtmlMarker({
        htmlContent: `
          <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;" title="${cand.label}">
            <div style="
              width:${size}px;height:${size}px;background:${color};
              border-radius:50%;border:${isSelected ? '3px' : '2px'} solid white;
              display:flex;align-items:center;justify-content:center;
              box-shadow:0 4px 14px ${color}90${isSelected ? `,0 0 0 6px ${color}35` : ''};
              transition:all 0.2s;
            ">
              <span style="color:white;font-weight:800;font-size:${isSelected ? 14 : 12}px;">${letter}</span>
            </div>
            <div style="
              background:rgba(10,25,47,0.92);color:white;
              font-size:9px;font-weight:800;letter-spacing:0.5px;
              padding:2px 6px;border-radius:6px;margin-top:2px;
              border:1px solid ${color}80;white-space:nowrap;
              box-shadow:0 2px 8px rgba(0,0,0,0.15);
            ">${cand.label}</div>
          </div>`,
        position: [cand.coordinates.longitude, cand.coordinates.latitude],
        anchor: 'bottom',
      })
      map.markers.add(marker)
      map.events.add('click', marker, () => {
        onCandidateSelect?.(cand)
        map.setCamera({
          center: [cand.coordinates.longitude, cand.coordinates.latitude],
          zoom: 14.5,
          type: 'ease',
          duration: 500,
        })
        if (popupRef.current) {
          popupRef.current.setOptions({
            position: [cand.coordinates.longitude, cand.coordinates.latitude],
            content: `
              <div style="padding:10px 12px;max-width:260px;font-family:system-ui,-apple-system,sans-serif;color:#0a192f;background:#faf8f5;">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:4px;">
                  <strong style="font-size:13px;color:#0a192f;">${cand.label}</strong>
                  <span style="font-size:10px;font-weight:700;padding:2px 6px;border-radius:6px;background:${color}18;color:${color};border:1px solid ${color}40;">
                    ${cand.opportunity_level ? 'Strategic Zone' : 'Candidate'}
                  </span>
                </div>
                ${cand.formatted_address ? `<p style="font-size:11px;color:#475569;margin:2px 0 6px 0;line-height:1.3;">📍 ${cand.formatted_address}</p>` : ''}
                ${cand.nearest_landmark ? `<div style="font-size:11px;color:#1e293b;margin-bottom:4px;">🏢 <strong>Anchor:</strong> ${cand.nearest_landmark}</div>` : ''}
                <div style="display:flex;gap:8px;align-items:center;margin-top:6px;font-size:11px;font-weight:600;color:#2563eb;border-top:1px solid rgba(0,0,0,0.06);padding-top:5px;">
                  <span>Direct Rivals: ${cand.competitor_count}</span>
                  <span>•</span>
                  <span>${cand.route_info.straight_line_km}km</span>
                </div>
              </div>`,
            pixelOffset: [0, -38]
          })
          popupRef.current.open(map)
        }
      })
    })

    // If selected candidate changed, gently center map on it and show popup
    if (selectedCandidate) {
      map.setCamera({
        center: [selectedCandidate.coordinates.longitude, selectedCandidate.coordinates.latitude],
        zoom: 14.5,
        type: 'ease',
        duration: 500,
      })
      if (popupRef.current) {
        popupRef.current.setOptions({
          position: [selectedCandidate.coordinates.longitude, selectedCandidate.coordinates.latitude],
          content: `
            <div style="padding:10px 12px;max-width:260px;font-family:system-ui,-apple-system,sans-serif;color:#0a192f;background:#faf8f5;">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:4px;">
                <strong style="font-size:13px;color:#0a192f;">${selectedCandidate.label}</strong>
                <span style="font-size:10px;font-weight:700;padding:2px 6px;border-radius:6px;background:#2563eb18;color:#2563eb;border:1px solid #2563eb40;">
                  Selected
                </span>
              </div>
              ${selectedCandidate.formatted_address ? `<p style="font-size:11px;color:#475569;margin:2px 0 6px 0;line-height:1.3;">📍 ${selectedCandidate.formatted_address}</p>` : ''}
              ${selectedCandidate.nearest_landmark ? `<div style="font-size:11px;color:#1e293b;margin-bottom:4px;">🏢 <strong>Anchor:</strong> ${selectedCandidate.nearest_landmark}</div>` : ''}
              <div style="display:flex;gap:8px;align-items:center;margin-top:6px;font-size:11px;font-weight:600;color:#2563eb;border-top:1px solid rgba(0,0,0,0.06);padding-top:5px;">
                <span>Rivals: ${selectedCandidate.competitor_count}</span>
                <span>•</span>
                <span>${selectedCandidate.route_info.straight_line_km}km</span>
              </div>
            </div>`,
          pixelOffset: [0, -38]
        })
        popupRef.current.open(map)
      }
    }
  }, [homeCoords, radius, pois, candidates, visibleCategories, selectedCandidate])

  useEffect(() => {
    if (mapReady) renderMapData()
  }, [mapReady, renderMapData])

  const toggleCategory = (cat) => {
    setVisibleCategories(prev => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Map canvas */}
      <div className="relative flex-1 bg-cream-100">
        <div ref={mapRef} className="w-full h-full" />

        {/* Search zone label */}
        {homeCoords && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none z-10">
            <div className="bg-red-500/15 border border-red-500/40 text-red-700 text-[11px] font-bold px-3.5 py-1 rounded-full backdrop-blur-md shadow-sm">
              🔴 SEARCH ZONE — {radius >= 1 ? `${radius} km` : `${radius * 1000} m`}
            </div>
          </div>
        )}

        {/* Loading overlay — before key arrives */}
        {!mapsKey && !keyError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-cream-50/90 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-full border-2 border-primary-500/30 border-t-primary-600 animate-spin mb-3" />
            <p className="text-slate-600 text-xs font-semibold">Loading Azure Maps…</p>
          </div>
        )}

        {/* Key not configured / backend down */}
        {keyError && !mapsKey && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-cream-50/90 backdrop-blur-sm">
            <div className="text-4xl">🗺️</div>
            <p className="text-navy-900 text-sm font-bold">Map not available</p>
            <p className="text-slate-600 text-xs max-w-xs text-center font-medium">
              Backend may be starting up. Ensure <code className="text-primary-600 font-bold">AZURE_MAPS_KEY</code> is set in{' '}
              <code className="text-slate-600">backend/.env</code>.
            </p>
            <button
              onClick={() => { setKeyError(false); setRetryCount(c => c + 1) }}
              className="mt-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md bg-primary-600 hover:bg-primary-700"
            >
              ↺ Retry Connection
            </button>
          </div>
        )}

        {/* Empty state — map loaded but no location yet */}
        {mapReady && !homeCoords && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 pointer-events-none">
            <div className="bg-white/95 border border-slate-900/[0.08] text-navy-900 text-xs font-semibold px-4 py-2 rounded-full shadow-md backdrop-blur-sm">
              📍 Search an address or click the map to begin
            </div>
          </div>
        )}
      </div>

      {/* POI category toggle bar */}
      {categories.length > 0 && (
        <div className="bg-white/95 border-t border-slate-900/[0.08] px-3 py-2 flex flex-wrap gap-1.5 items-center shadow-xs">
          <button
            onClick={() => visibleCategories.size === categories.length
              ? setVisibleCategories(new Set())
              : setVisibleCategories(new Set(categories))}
            className="text-[10px] px-2.5 py-1 rounded-md border border-slate-900/[0.1] text-slate-700 font-bold hover:text-navy-900 hover:bg-cream-100 transition-colors"
          >
            {visibleCategories.size === categories.length ? 'Hide all' : 'Show all'}
          </button>
          {categories.slice(0, 14).map(cat => (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className="text-[10px] px-2 py-1 rounded-md transition-all duration-200 flex items-center gap-1.5 border font-semibold"
              style={visibleCategories.has(cat) ? {
                background: `${getCategoryColor(cat)}15`,
                borderColor: `${getCategoryColor(cat)}50`,
                color: getCategoryColor(cat),
              } : {
                background: 'rgba(15,39,68,0.03)',
                borderColor: 'rgba(15,39,68,0.08)',
                color: '#64748b',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: getCategoryColor(cat) }} />
              {cat}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
