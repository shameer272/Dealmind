import React, { useState, useEffect } from 'react';
import { TrendingUp, Brain, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import type { MemoryGrowthDataPoint } from '../types';

export const LearningCurve: React.FC = () => {
  const [dataPoints, setDataPoints] = useState<MemoryGrowthDataPoint[]>([]);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMemoryGrowth()
      .then((res) => {
        setDataPoints(res.data_points);
        setSummary(res.summary);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 shadow-xl space-y-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-400" />
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Cognitive Compounding
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">The AI Learning Curve</h1>
        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
          How DealMind becomes exponentially more valuable with each customer interaction through persistent <strong>Hindsight memory</strong> retention.
        </p>
      </div>

      {/* Progression Milestones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Interaction 1
          </span>
          <h3 className="font-bold text-white text-sm">Generic Understanding</h3>
          <p className="text-xs text-slate-400">
            Broad discovery questions; identical to any off-the-shelf chatbot.
          </p>
          <span className="inline-block text-[10px] text-slate-500 font-mono">
            Personalization: 15%
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
            Interaction 5
          </span>
          <h3 className="font-bold text-white text-sm">Structured Profile</h3>
          <p className="text-xs text-slate-400">
            Customer budget locked; key executive sponsors and technical architects identified.
          </p>
          <span className="inline-block text-[10px] text-blue-400 font-mono">
            Personalization: 64%
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
            Interaction 10
          </span>
          <h3 className="font-bold text-white text-sm">Objection Mastery</h3>
          <p className="text-xs text-slate-400">
            Technical webhook latency mapped; SOC2 security cleared; competitor counter-plans ready.
          </p>
          <span className="inline-block text-[10px] text-indigo-300 font-mono">
            Personalization: 98%
          </span>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/30 space-y-2">
          <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
            Hindsight Power
          </span>
          <h3 className="font-bold text-white text-sm">Autonomous Deal Partner</h3>
          <p className="text-xs text-slate-300">
            Generates high-precision meeting briefs and follow-ups with zero memory decay.
          </p>
          <span className="inline-block text-[10px] text-purple-300 font-mono">
            Compounded ROI: 5.2x
          </span>
        </div>
      </div>

      {/* Growth Metric Table & Bar Visualization */}
      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Empirical Memory Growth Matrix</h3>
            <p className="text-xs text-slate-400">Empirical memory progression across progressive interactions (Cognitive benchmark)</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
            Cognitive Benchmark
          </span>
        </div>

        <div className="space-y-3">
          {dataPoints.map((dp, i) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="w-36 font-semibold text-slate-200">{dp.interaction}</div>

              {/* Progress visualizer */}
              <div className="flex-1 space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Strategic Personalization Depth</span>
                  <span className="font-mono text-white font-bold">{dp.strategic_depth_score}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${dp.strategic_depth_score}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 text-slate-400 text-[11px] sm:w-48 justify-end">
                <span>Facts: <strong className="text-slate-200">{dp.facts_known}</strong></span>
                <span>Objections: <strong className="text-slate-200">{dp.objections_tracked}</strong></span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/20 text-xs text-blue-300">
          <strong>Key Takeaway: </strong> {summary}
        </div>
      </div>
    </div>
  );
};
