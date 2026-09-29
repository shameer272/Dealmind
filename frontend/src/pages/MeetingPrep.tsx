import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Brain,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  HelpCircle,
  RefreshCw,
  Building,
  Target,
  FileCheck,
  Briefcase
} from 'lucide-react';
import { api } from '../services/api';
import type { MeetingBriefResponse, Deal } from '../types';

export const MeetingPrep: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [deals, setDeals] = useState<Deal[]>([]);
  const [dealId, setDealId] = useState<string>('');
  const [objective, setObjective] = useState('Executive alignment and technical CRM webhook architecture sign-off');
  const [data, setData] = useState<MeetingBriefResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [dealsLoading, setDealsLoading] = useState(true);
  const [selectedWhy, setSelectedWhy] = useState<string | null>(null);

  // Load authorized deals
  useEffect(() => {
    api.getDeals()
      .then((dealList) => {
        setDeals(dealList);
        const queryDealId = searchParams.get('dealId');
        if (queryDealId && dealList.some((d) => d.id === queryDealId)) {
          setDealId(queryDealId);
        } else if (dealList.length > 0) {
          setDealId(dealList[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setDealsLoading(false));
  }, []);

  const fetchBrief = async () => {
    if (!dealId) return;
    setLoading(true);
    try {
      const res = await api.generateMeetingBrief(dealId, objective);
      setData(res);
    } catch (err) {
      console.error(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dealId) {
      fetchBrief();
    }
  }, [dealId]);

  const handleDealChange = (newDealId: string) => {
    setDealId(newDealId);
    setSearchParams({ dealId: newDealId });
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-slate-900 border border-blue-500/20 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Prepare Me Intelligence
            </span>
          </div>

          <div className="flex items-center gap-3">
            {deals.length > 0 && (
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
                <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                <select
                  value={dealId}
                  onChange={(e) => handleDealChange(e.target.value)}
                  className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
                >
                  {deals.map((d) => (
                    <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                      {d.company?.name || d.name} ({d.name})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {dealId && (
              <button
                onClick={() => navigate(`/deals/${dealId}`)}
                className="text-xs text-slate-400 hover:text-white transition"
              >
                ← Back to Deal
              </button>
            )}
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white tracking-tight">
          Executive Sales Meeting Briefing
        </h1>
        <p className="text-xs text-slate-300">
          Synthesized by the DealMind Agent from historical <strong>Hindsight memories</strong>, open objections, and commitments.
        </p>

        {/* Objective Input */}
        {deals.length > 0 && (
          <div className="pt-2 flex gap-3">
            <input
              type="text"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Specify meeting objective..."
              className="flex-1 px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={fetchBrief}
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow transition flex items-center gap-1.5"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Regenerate Brief</span>}
            </button>
          </div>
        )}
      </div>

      {deals.length === 0 && !dealsLoading ? (
        <div className="py-24 text-center text-slate-400 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
          <Sparkles className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <h3 className="text-base font-semibold text-white">No active deals to prepare for</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Meeting briefs are synthesized from historical interactions and Hindsight memories of your deals.
          </p>
        </div>
      ) : loading ? (
        <div className="py-24 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Synthesizing Executive Briefing from Hindsight Memories...</p>
        </div>
      ) : !data ? (
        <div className="py-20 text-center text-slate-400 border border-dashed border-slate-800 rounded-2xl">
          <p className="text-sm">No meeting brief generated yet. Enter an objective and click Regenerate Brief.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Executive Overview & Suggested Next Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-400" />
                <span>What The Buyer Cares About</span>
              </h3>
              <ul className="space-y-2">
                {data.what_they_care_about.map((point: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-emerald-400" />
                <span>Suggested Next Steps</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-mono bg-slate-950 p-4 rounded-xl border border-slate-800">
                {data.suggested_next_step}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recommended Talking Points */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>Recommended Talking Points (Memory-Backed)</span>
              </h3>
              <ul className="space-y-2.5">
                {data.recommended_talking_points.map((tp: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <span>{tp}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Expected Objections */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Known Customer Objections to Anticipate</span>
              </h3>
              <ul className="space-y-2.5">
                {data.previous_objections.map((obj: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-rose-300 bg-rose-500/5 p-3 rounded-xl border border-rose-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Unresolved Commitments & Risks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Critical Commitments to Honor</span>
              </h3>
              <div className="space-y-2">
                {data.unresolved_commitments.map((c: string, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                    <span className="text-xs text-slate-300">{c}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Brain className="w-4 h-4 text-indigo-400" />
                <span>Explainability Grounding</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                {data.why_explanation}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
