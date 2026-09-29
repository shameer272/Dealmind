import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Scale,
  Brain,
  Sparkles,
  Bot,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Database,
  RefreshCw,
  Send,
  Info,
  Briefcase
} from 'lucide-react';
import { api } from '../services/api';
import type { MemoryComparisonResponse, Deal } from '../types';

export const MemoryImpact: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [dealId, setDealId] = useState<string>('');
  const [query, setQuery] = useState("Prepare me for tomorrow's meeting with the client");
  const [data, setData] = useState<MemoryComparisonResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [dealsLoading, setDealsLoading] = useState(true);

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

  const samplePrompts = [
    "Prepare me for my meeting with the buyer.",
    "What are the biggest objections raised so far?",
    "Which competitors are being actively considered?",
    "What commitments are still open or unresolved?",
    "What should I focus on in our upcoming discussion?",
    "How has our understanding of the customer evolved?",
    "What risks could prevent this deal from closing?"
  ];

  const runComparison = async (qText?: string) => {
    if (!dealId) return;
    const activeQuery = qText || query;
    setLoading(true);
    try {
      const res = await api.compareMemoryImpact(dealId, activeQuery);
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
      runComparison();
    }
  }, [dealId]);

  const handleDealChange = (newDealId: string) => {
    setDealId(newDealId);
    setSearchParams({ dealId: newDealId });
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-blue-950/20 border border-indigo-500/20 shadow-xl space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Deal Intelligence Contrast
            </span>
          </div>

          {deals.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
              <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
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

        <h1 className="text-2xl font-bold text-white tracking-tight">
          Why Persistent Memory Matters
        </h1>
        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
          Side-by-side comparison illustrating why standard memoryless LLMs fail in complex enterprise sales cycles, versus a DealMind Agent powered by Hindsight cognitive recall.
        </p>
      </div>

      {deals.length === 0 && !dealsLoading ? (
        <div className="py-24 text-center text-slate-400 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
          <Scale className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <h3 className="text-base font-semibold text-white">No active deals to compare</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Memory comparison demonstrates the difference between standard LLM responses and Hindsight-backed recall on your organization's deals.
          </p>
        </div>
      ) : (
        <>
          {/* Query Bar */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask any sales or deal question..."
                className="flex-1 px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={() => runComparison()}
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow transition flex items-center gap-1.5"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Evaluate</span>
              </button>
            </div>

            {/* Quick Prompts */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-[11px] text-slate-500 shrink-0">Try Prompt:</span>
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(p);
                    runComparison(p);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 shrink-0 text-[11px] transition"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-24 text-center text-slate-400">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm">Running Dual-Agent Side-by-Side Comparison...</p>
            </div>
          ) : !data ? (
            <div className="py-20 text-center text-slate-400 border border-dashed border-slate-800 rounded-2xl">
              <p className="text-sm">Select a deal and click Evaluate to see the comparison.</p>
            </div>
          ) : (
            <>
              {/* Key Differentiators Callout */}
              <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="text-xs font-semibold text-white">
                    Key Value Differentiators in this Response:
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.key_memory_differentiators.map((diff, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 text-[10px] font-semibold"
                    >
                      ✓ {diff}
                    </span>
                  ))}
                </div>
              </div>

              {/* Side-by-Side Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Without Memory (Generic LLM) */}
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <Bot className="w-5 h-5 text-slate-400" />
                        <div>
                          <h3 className="text-sm font-bold text-slate-200">Without Hindsight Memory</h3>
                          <p className="text-[10px] text-slate-500">Standard Stateless LLM Prompt</p>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold border border-slate-700">
                        Generic
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/60 text-xs text-slate-400 leading-relaxed font-sans whitespace-pre-line">
                      {data.without_memory_response}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 text-[11px] text-rose-300 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      <span>Limitation:</span>
                    </div>
                    <p>No knowledge of past commitments, stakeholder hierarchy, pricing objections, or budget constraints.</p>
                  </div>
                </div>

                {/* With Hindsight Memory (DealMind Agent) */}
                <div className="p-6 rounded-2xl bg-gradient-to-b from-indigo-950/30 to-slate-900 border border-indigo-500/30 space-y-4 shadow-xl flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-indigo-500/20">
                      <div className="flex items-center gap-2">
                        <Brain className="w-5 h-5 text-indigo-400" />
                        <div>
                          <h3 className="text-sm font-bold text-white">With Hindsight Memory</h3>
                          <p className="text-[10px] text-indigo-300">DealMind Continuous Cognitive Intelligence</p>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                        Deal-Specific
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/20 text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-line shadow-inner">
                      {data.with_memory_response}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Competitive Edge:</span>
                    </div>
                    <p>Accurately recalls past commitments, specific objections, and decision-maker constraints across multi-session history.</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};
