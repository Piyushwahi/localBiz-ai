/**
 * Candidates page — full candidate comparison view.
 */
import { useState } from 'react'
import CandidateCard from '../components/CandidateCard'
import CompareModal from '../components/CompareModal'
import { GitCompare, Users, Info } from 'lucide-react'

export default function Candidates({ candidates = [], analysisData, debateData }) {
  const [showCompare, setShowCompare] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())

  const finalReport = analysisData?.final_report
  const candidateReports = {}
  finalReport?.candidate_reports?.forEach(r => { candidateReports[r.candidate_id] = r })
  const bestId = finalReport?.recommended_candidate_id

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (next.size < 3) next.add(id)
      return next
    })
  }

  const compareCandidates = candidates.filter(c => selectedIds.has(c.id))

  if (candidates.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        <div className="text-center">
          <Users size={40} className="mx-auto mb-3 opacity-30 text-primary-600" />
          <p className="text-sm font-semibold text-navy-900">No candidates generated yet</p>
          <p className="text-xs text-slate-500 mt-1">Run an analysis from the Map Analysis page to compare candidates.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-navy-900">Candidate Areas</h1>
          <p className="text-sm text-slate-600 mt-1">{candidates.length} AI-generated candidate areas based on Azure Maps spatial data</p>
        </div>
        <div className="flex gap-2">
          {selectedIds.size >= 2 && (
            <button onClick={() => setShowCompare(true)} className="btn-primary">
              <GitCompare size={15} />
              Compare ({selectedIds.size})
            </button>
          )}
          <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 px-3 py-1 bg-cream-100 rounded-lg border border-slate-900/[0.06]">
            <Info size={13} className="text-primary-600" />
            Select up to 3 to compare
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {candidates.map((cand, i) => (
          <div
            key={cand.id}
            onClick={() => toggleSelect(cand.id)}
            className={`cursor-pointer rounded-2xl transition-all duration-200 ${
              selectedIds.has(cand.id) ? 'ring-2 ring-primary-600 shadow-md' : ''
            }`}
          >
            <CandidateCard
              candidate={cand}
              report={candidateReports[cand.id]}
              debateData={debateData}
              index={i}
              isSelected={selectedIds.has(cand.id)}
              onSelect={() => toggleSelect(cand.id)}
              isRecommended={cand.id === bestId}
            />
          </div>
        ))}
      </div>

      {showCompare && compareCandidates.length >= 2 && (
        <CompareModal
          candidates={compareCandidates}
          reports={candidateReports}
          onClose={() => setShowCompare(false)}
        />
      )}
    </div>
  )
}
