import React, { useState, useEffect } from 'react';
import { X, Mail, Copy, Check, RefreshCw, Sparkles, Brain, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import type { FollowUpResponse } from '../types';

interface FollowUpModalProps {
  dealId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const FollowUpModal: React.FC<FollowUpModalProps> = ({ dealId, isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<FollowUpResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [tone, setTone] = useState('Professional & consultative');

  const fetchFollowUp = async () => {
    setLoading(true);
    try {
      const res = await api.generateFollowUp(dealId, tone);
      setData(res);
    } catch (err: any) {
      alert('Error generating follow-up: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFollowUp();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!data) return;
    const fullText = `Subject: ${data.subject}\n\n${data.body}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Generate Personalized Follow-Up</h2>
              <p className="text-xs text-slate-400">Synthesized directly from historical Hindsight memories & commitments</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-400 mx-auto" />
              <p className="text-sm font-medium text-slate-200">Querying Hindsight memory bank...</p>
              <p className="text-xs text-slate-400">Synthesizing CRM integration notes and historical commitments</p>
            </div>
          ) : data ? (
            <div className="space-y-4">
              {/* Subject */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Subject Line:
                </label>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-medium text-white">
                  {data.subject}
                </div>
              </div>

              {/* Body */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Personalized Email Body:
                  </label>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                    Hindsight Grounded
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                  {data.body}
                </div>
              </div>

              {/* Memory references callout */}
              <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs space-y-2">
                <div className="flex items-center gap-1.5 text-indigo-300 font-semibold">
                  <Brain className="w-3.5 h-3.5" />
                  <span>Hindsight Memories Referenced in this Email:</span>
                </div>
                <ul className="space-y-1">
                  {data.memory_references_used.map((ref, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-slate-300 text-[11px]">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>{ref}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                <button
                  onClick={fetchFollowUp}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Regenerate</span>
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={onClose}
                    className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Email</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
