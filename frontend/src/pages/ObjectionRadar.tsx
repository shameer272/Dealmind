import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Radar, ShieldAlert, CheckCircle2, AlertTriangle, HelpCircle, ArrowRight, Brain, Briefcase } from 'lucide-react';
import { api } from '../services/api';
import type { ObjectionDetail, Deal } from '../types';

export const ObjectionRadar: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [dealId, setDealId] = useState<string>('');
  const [objections, setObjections] = useState<ObjectionDetail[]>([]);
  const [selectedObjection, setSelectedObjection] = useState<ObjectionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Load authorized deals
  useEffect(() => {
    api.getDeals()
      .then((data) => {
        setDeals(data);
        const queryDealId = searchParams.get('dealId');
        if (queryDealId && data.some((d) => d.id === queryDealId)) {
          setDealId(queryDealId);
        } else if (data.length > 0) {
          setDealId(data[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Fetch objection analysis for selected deal
  useEffect(() => {
    if (!dealId) return;
    setLoading(true);
    api.getObjectionAnalysis(dealId)
      .then((data) => {
        setObjections(data.objections);
        if (data.objections.length > 0) {
          setSelectedObjection(data.objections[0]);
        } else {
          setSelectedObjection(null);
        }
      })
      .catch((err) => {
        console.error(err);
        setObjections([]);
        setSelectedObjection(null);
      })
      .finally(() => setLoading(false));
  }, [dealId]);

  const handleDealChange = (newDealId: string) => {
    setDealId(newDealId);
    setSearchParams({ dealId: newDealId });
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-rose-950/20 to-slate-900 border border-rose-500/20 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Radar className="w-5 h-5 text-rose-400" />
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Hindsight Cognitive Tracking
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Enterprise Objection Radar</h1>
          <p className="text-xs text-slate-400">
            Continuous tracking of objections across multi-session conversations, resolution status, and AI counter-strategies.
          </p>
        </div>

        {deals.length > 0 && (
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
            <Briefcase className="w-3.5 h-3.5 text-rose-400" />
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
      </div>

      {deals.length === 0 && !loading ? (
        <div className="py-24 text-center text-slate-400 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
          <Radar className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <h3 className="text-base font-semibold text-white">No active deals to analyze</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Objection signals are monitored and extracted as client interactions occur in your deals.
          </p>
        </div>
      ) : loading ? (
        <div className="py-24 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Synthesizing Historical Objections...</p>
        </div>
      ) : objections.length === 0 ? (
        <div className="py-20 text-center text-slate-400 border border-dashed border-slate-800 rounded-2xl">
          <p className="text-sm">Zero unresolved objections recorded for this deal.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Objections List / Visual Bars */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Detected Objections ({objections.length}):
            </h3>
            <div className="space-y-2">
              {objections.map((obj, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedObjection(obj)}
                  className={`p-4 rounded-xl border cursor-pointer transition flex flex-col space-y-2 ${
                    selectedObjection?.category === obj.category
                      ? 'bg-rose-950/30 border-rose-500/40 shadow-lg shadow-rose-950/40'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{obj.category}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        obj.resolution_status === 'Resolved'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {obj.resolution_status} ({obj.frequency}x)
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2">{obj.sales_response_used}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Deep Dive Panel */}
          {selectedObjection && (
            <div className="lg:col-span-2 space-y-4">
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
                <div className="space-y-2 pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {selectedObjection.category} Category
                    </span>
                    <span className="text-xs text-slate-400">
                      Severity: {selectedObjection.severity} • Detected {selectedObjection.frequency} times
                    </span>
                  </div>
                  <h2 className="text-base font-semibold text-white">
                    Response Used: "{selectedObjection.sales_response_used}"
                  </h2>
                </div>

                {/* Counter Strategy */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Brain className="w-4 h-4 text-indigo-400" />
                    <span>AI Counter-Strategy (Hindsight Synthesized)</span>
                  </h4>
                  <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs text-slate-200 leading-relaxed">
                    {selectedObjection.ai_recommendation}
                  </div>
                </div>

                {/* Evidence & Commitments */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                    <h5 className="text-[11px] font-semibold text-slate-400 uppercase">
                      Resolution Status
                    </h5>
                    <p className="text-xs text-slate-300">
                      {selectedObjection.resolution_status}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                    <h5 className="text-[11px] font-semibold text-slate-400 uppercase">
                      Explainability Reasoning
                    </h5>
                    <p className="text-xs text-slate-300">
                      {selectedObjection.why_explanation}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
