/**
 * LocalBiz AI — Root Application
 * Routes, global state, and layout management.
 */
import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import MapAnalysis from './pages/MapAnalysis'
import Candidates from './pages/Candidates'
import Debate from './pages/Debate'
import Docs from './pages/Docs'
import About from './pages/About'
import { useAnalysis } from './hooks/useAnalysis'

export default function App() {
  const analysis = useAnalysis()
  const { health, fetchHealth } = analysis

  useEffect(() => {
    fetchHealth()
  }, [fetchHealth])

  return (
    <BrowserRouter>
      <div className="flex flex-col h-screen h-[100dvh] bg-cream-50 text-slate-900 overflow-hidden">
        <Navbar health={health} />

        <main className="flex-1 overflow-hidden bg-cream-50">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <Dashboard
                  analysisData={analysis.analysisData}
                  debateData={analysis.debateData}
                  status={analysis.status}
                  health={health}
                />
              }
            />
            <Route
              path="/map-analysis"
              element={
                <MapAnalysis
                  analysisId={analysis.analysisId}
                  status={analysis.status}
                  analysisData={analysis.analysisData}
                  candidates={analysis.candidates}
                  debateData={analysis.debateData}
                  error={analysis.error}
                  runAnalysis={analysis.runAnalysis}
                  reset={analysis.reset}
                />
              }
            />
            <Route
              path="/candidates"
              element={
                <Candidates
                  candidates={analysis.candidates}
                  analysisData={analysis.analysisData}
                  debateData={analysis.debateData}
                />
              }
            />
            <Route
              path="/debate"
              element={<Debate debateData={analysis.debateData} status={analysis.status} />}
            />
            <Route path="/docs" element={<Docs />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
