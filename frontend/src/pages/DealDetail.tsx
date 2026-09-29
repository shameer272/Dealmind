import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  Brain,
  Sparkles,
  Plus,
  Mail,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import type { Deal, DealHealthResponse, ObjectionDetail } from '../types';
import { AddInteractionModal } from '../components/AddInteractionModal';
import { FollowUpModal } from '../components/FollowUpModal';

export const DealDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [deal, setDeal] = useState<Deal | null>(null);
  const [health, setHealth] = useState<DealHealthResponse | null>(null);
  const [objections, setObjections] = useState<ObjectionDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isAddInteractionOpen, setIsAddInteractionOpen] = useState(false);
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [selectedWhy, setSelectedWhy] = useState<string | null>(null);

  const loadData = async () => {
    if (!id) {
      setError('No deal identifier provided.');
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const [dData, hData, oData] = await Promise.all([
        api.getDeal(id),
        api.getDealHealth(id),
        api.getObjectionAnalysis(id)
      ]);
      setDeal(dData);
      setHealth(hData);
      setObjections(oData.objections);
    } catch (err: any) {
      setError(err.message || 'Access restricted: This deal belongs to another organization or does not exist.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 text-center py-24 text-slate-400">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm">Loading Deal Intelligence & Hindsight Memory...</p>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="p-8 max-w-xl mx-auto py-24 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6 text-rose-400" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Deal Access Restricted</h2>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          {error || 'This deal is not accessible under your current organization perimeter.'}
        </p>
        <button
          onClick={() => navigate('/deals')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition"
        >
          Return to Your Organization Deals
        </button>
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header & Primary CTAs */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {deal.stage} Stage
            </span>
            <span className="text-xs text-slate-400">
              {deal.company?.industry} • {deal.company?.location}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{deal.name}</h1>
          <p className="text-xs text-slate-400">
            Account: <strong className="text-slate-200">{deal.company?.name}</strong> • Buying Sponsor:{' '}
            <strong className="text-slate-200">
              {deal.company?.contacts?.[0]?.name} ({deal.company?.contacts?.[0]?.role})
            </strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsAddInteractionOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Interaction</span>
          </button>

          <button
            onClick={() => setIsFollowUpOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Generate Follow-up</span>
          </button>

          <button
            onClick={() => navigate(`/prepare-me?dealId=${deal.id}`)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Prepare for Meeting</span>
          </button>
        </div>
      </div>

      {/* Snapshot Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium">Deal Value</span>
          <p className="text-xl font-bold text-white">{formatCurrency(deal.value)}</p>
          <p className="text-[11px] text-emerald-400">{deal.currency} Pipeline Valuation</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium">Win Probability</span>
          <p className="text-xl font-bold text-white">{deal.probability}%</p>
          <p className="text-[11px] text-blue-400">{deal.probability >= 50 ? 'Strong Alignment' : 'Active Discovery'}</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium">Target Decision</span>
          <p className="text-xl font-bold text-white">{deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString() : 'Target Close'}</p>
          <p className="text-[11px] text-slate-400">Stage: {deal.stage}</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium">Hindsight Memories</span>
          <p className="text-xl font-bold text-indigo-400">{deal.interactions?.length ?? 0} Tracked</p>
          <p className="text-[11px] text-indigo-300">Continuous cognitive memory</p>
        </div>
      </div>

      {/* Deal Health & Objection Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deal Health Card */}
        {health && (
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Explainable Deal Health</h3>
                <p className="text-xs text-slate-400">Computed transparently from verified Hindsight signals</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-white">{health.score}</span>
                <span className="text-xs text-slate-400"> / 100</span>
                <p className="text-[10px] font-semibold text-emerald-400">{health.status_label}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300">
              {health.summary}
            </div>

            <div className="space-y-2">
              <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Contributing Evidence Factors:
              </h4>
              <div className="space-y-1.5">
                {health.factors.map((f, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      {f.status === 'positive' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                      <div>
                        <span className="font-medium text-slate-200">{f.name}</span>
                        <p className="text-[10px] text-slate-400">{f.details}</p>
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-mono font-bold ${
                        f.weight > 0 ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {f.weight > 0 ? `+${f.weight}` : f.weight} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setSelectedWhy(health.why_explanation)}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Why this health score?</span>
              </button>
            </div>
          </div>
        )}

        {/* Objection Radar */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Objection Radar</h3>
              <p className="text-xs text-slate-400">Historical friction points detected in Hindsight memory</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30">
              5 Tracked
            </span>
          </div>

          <div className="space-y-3">
            {objections.map((obj, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-xs">{obj.category}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${
                        obj.severity === 'High'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {obj.severity}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-semibold ${
                      obj.resolution_status === 'Resolved' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    ● {obj.resolution_status} ({obj.frequency}x)
                  </span>
                </div>

                <div className="text-[11px] text-slate-300 space-y-1">
                  <p>
                    <strong className="text-slate-400">AI Recommendation:</strong> {obj.ai_recommendation}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-[10px]">
                  <span className="text-slate-500">
                    Interactions: {obj.related_interactions.join(', ')}
                  </span>
                  <button
                    onClick={() => setSelectedWhy(obj.why_explanation)}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Why?
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Memory Timeline (Section 20) */}
      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-semibold text-white">Hindsight Memory Timeline</h3>
            </div>
            <p className="text-xs text-slate-400">
              Chronological journey of customer discoveries, budget milestones, objections, and preferences
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
            {deal.interactions?.length ?? 0} Memory Milestones
          </span>
        </div>

        {/* Timeline Visual Sequence */}
        {(!deal.interactions || deal.interactions.length === 0) ? (
          <div className="py-12 text-center text-slate-400 border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
            <Clock className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-sm font-medium text-slate-300">No interactions recorded yet</p>
            <p className="text-xs text-slate-500 mt-1">Log a meeting or call above to start building the Hindsight cognitive memory timeline.</p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {deal.interactions.map((int, idx) => (
            <div key={int.id} className="relative group">
              {/* Timeline Node Dot */}
              <div className="absolute -left-[19px] top-1.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-slate-950 group-hover:scale-125 transition" />

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition space-y-1.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">
                      Interaction {idx + 1}: {int.title}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                      {int.type}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(int.occurred_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{int.content}</p>

                {int.outcome && (
                  <div className="pt-1.5 border-t border-slate-900/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">
                      <strong className="text-slate-300">Outcome:</strong> {int.outcome}
                    </span>
                    {int.next_steps && (
                      <span className="text-blue-400 font-medium">Next: {int.next_steps}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      {/* Explainability "Why?" Modal */}
      {selectedWhy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-blue-400">
              <Brain className="w-5 h-5" />
              <h3 className="font-semibold text-white text-sm">Why did DealMind recommend this?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
              {selectedWhy}
            </p>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedWhy(null)}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Interaction Modal */}
      <AddInteractionModal
        dealId={deal.id}
        isOpen={isAddInteractionOpen}
        onClose={() => setIsAddInteractionOpen(false)}
        onSuccess={() => {
          loadData();
        }}
      />

      {/* Follow-up Modal */}
      <FollowUpModal
        dealId={deal.id}
        isOpen={isFollowUpOpen}
        onClose={() => setIsFollowUpOpen(false)}
      />
    </div>
  );
};
