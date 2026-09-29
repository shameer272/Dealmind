import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

interface AddInteractionModalProps {
  dealId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddInteractionModal: React.FC<AddInteractionModalProps> = ({
  dealId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [type, setType] = useState('Meeting');
  const [title, setTitle] = useState('');
  const [participants, setParticipants] = useState('Sarah Jenkins (VP Eng), Vikram Rao (Architect), Rep');
  const [content, setContent] = useState('');
  const [outcome, setOutcome] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [learnedData, setLearnedData] = useState<any>(null);

  if (!isOpen) return null;

  const loadTemplate = (tmpl: string) => {
    if (tmpl === 'crm') {
      setType('Meeting');
      setTitle('Technical Architecture & CRM Webhook Validation');
      setContent(
        'Met with Vikram Rao. He reiterated that bi-directional CRM integration latency must remain under 50ms with zero duplicate accounts. If webhook synchronization fails during load testing, engineering will block procurement.'
      );
      setOutcome('Walked through sub-50ms sync sandbox; agreed to provide live webhook credentials.');
      setNextSteps('Send API credentials and schedule 15-min connector test.');
    } else if (tmpl === 'budget') {
      setType('Call');
      setTitle('Commercial Scope & Budget Alignment');
      setContent(
        'Executive check-in with Sarah Jenkins. She clarified: Our budget ceiling is strictly ₹10 lakh for year one. Any quote exceeding ₹10L cannot be approved by engineering leadership.'
      );
      setOutcome('Confirmed proposal scope will stay within the ₹10 Lakh envelope.');
      setNextSteps('Submit revised commercial proposal.');
    } else if (tmpl === 'competitor') {
      setType('Meeting');
      setTitle('Competitive Evaluation Discussion');
      setContent(
        'Sarah stated they are also receiving bundled discounting from Salesforce Einstein and considering HubSpot Sales Hub for email cadence. We must emphasize our multi-session persistent Hindsight memory layer.'
      );
      setOutcome('Highlighted difference between single-prompt LLMs and Hindsight cognitive persistence.');
      setNextSteps('Deliver competitive differentiation battlecard.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    setLoading(true);
    setLearnedData(null);

    try {
      const res = await api.addInteraction(dealId, {
        type,
        title,
        content,
        participants,
        outcome,
        next_steps: nextSteps,
      });
      setLearnedData(res);
      onSuccess();
    } catch (err: any) {
      alert('Error recording interaction: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Record Interaction & Update Hindsight</h2>
              <p className="text-xs text-slate-400">AI automatically extracts facts, objections, and updates deal memory</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {learnedData ? (
            /* Success Feedback Showing What Hindsight Learned */
            <div className="space-y-4 animate-in zoom-in-95 duration-200">
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-sm text-emerald-200">
                    Interaction Analyzed & Memory Updated!
                  </h3>
                  <p className="text-xs text-emerald-400/90 mt-1">
                    Hindsight retained {learnedData.memories_learned} new structured memory units in this deal bank.
                  </p>
                </div>
              </div>

              {learnedData.analysis?.extracted_facts?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    New Memories Retained in Hindsight:
                  </h4>
                  <div className="space-y-2">
                    {learnedData.analysis.extracted_facts.map((fact: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex items-start justify-between text-xs"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                          <span className="text-slate-200">{fact.fact}</span>
                        </div>
                        <span className="shrink-0 ml-3 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase">
                          {fact.memory_type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs space-y-1">
                <p className="font-medium text-slate-300">Recommended Next Step:</p>
                <p className="text-blue-300">{learnedData.analysis?.recommended_next_step}</p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Input Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Quick Template Picker */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Demo Templates (Click to auto-populate):
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => loadTemplate('crm')}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition"
                  >
                    ⚡ CRM Webhook Objection
                  </button>
                  <button
                    type="button"
                    onClick={() => loadTemplate('budget')}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition"
                  >
                    💰 ₹10L Budget Parameter
                  </button>
                  <button
                    type="button"
                    onClick={() => loadTemplate('competitor')}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition"
                  >
                    🥊 Salesforce Competitor
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Interaction Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Meeting">Meeting</option>
                    <option value="Call">Call</option>
                    <option value="Email">Email</option>
                    <option value="Demo">Demo</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Note">Note</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Interaction Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Technical Deep Dive on CRM Webhooks"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Participants
                </label>
                <input
                  type="text"
                  value={participants}
                  onChange={(e) => setParticipants(e.target.value)}
                  placeholder="Sarah Jenkins, Vikram Rao, Rep"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Conversation / Meeting Notes
                </label>
                <textarea
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste conversation transcript, meeting summary, or raw sales notes. DealMind will automatically extract objections, preferences, and commitments into Hindsight..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Outcome
                  </label>
                  <input
                    type="text"
                    value={outcome}
                    onChange={(e) => setOutcome(e.target.value)}
                    placeholder="e.g. Addressed latency concerns; requested live API credentials."
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Agreed Next Steps
                  </label>
                  <input
                    type="text"
                    value={nextSteps}
                    onChange={(e) => setNextSteps(e.target.value)}
                    placeholder="e.g. Send SOC2 pack and schedule sandbox walkthrough."
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  🔐 Sanitized: Credentials and tokens stripped before retention.
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow transition"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Extracting & Retaining...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Analyze & Retain Memory</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
