import React, { useState, useEffect } from 'react';
import { Search, X, Briefcase, Building, MessageSquare, Brain, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        // Toggle
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (val.trim().length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const data = await api.search(val);
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="px-4 py-3.5 border-b border-slate-800 flex items-center gap-3 bg-slate-950">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search deals, objections, competitors, or memories (e.g. 'Salesforce', 'CRM', '₹10L')..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          {loading && <Loader2 className="w-4 h-4 animate-spin text-blue-400" />}
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-500 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Results */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {query.trim().length < 2 ? (
            <div className="py-12 text-center text-slate-500">
              <p>Type at least 2 characters to search across Deals, Contacts, and Hindsight Memories.</p>
              <div className="flex justify-center gap-2 mt-3">
                <button
                  onClick={() => handleSearch('Salesforce')}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Try: "Salesforce"
                </button>
                <button
                  onClick={() => handleSearch('CRM')}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Try: "CRM"
                </button>
                <button
                  onClick={() => handleSearch('budget')}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Try: "budget"
                </button>
              </div>
            </div>
          ) : results ? (
            <div className="space-y-4">
              {/* Deals */}
              {results.deals?.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    Deals
                  </h4>
                  <div className="space-y-1">
                    {results.deals.map((d: any) => (
                      <div
                        key={d.id}
                        onClick={() => {
                          navigate(`/deals/${d.id}`);
                          onClose();
                        }}
                        className="p-2.5 rounded-lg bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800/80 cursor-pointer flex items-center justify-between transition"
                      >
                        <span className="font-medium text-slate-200">{d.name}</span>
                        <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-semibold">
                          {d.stage}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hindsight Memories */}
              {results.memories?.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5" />
                    Hindsight Memory Matches
                  </h4>
                  <div className="space-y-1.5">
                    {results.memories.map((m: any) => (
                      <div
                        key={m.id}
                        className="p-3 rounded-lg bg-indigo-950/20 border border-indigo-500/20 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-200">{m.fact}</span>
                          <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] uppercase font-semibold">
                            {m.type}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Source: {m.source || 'Historical Interaction'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interactions */}
              {results.interactions?.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Historical Interactions
                  </h4>
                  <div className="space-y-1">
                    {results.interactions.map((i: any) => (
                      <div
                        key={i.id}
                        onClick={() => {
                          navigate(`/deals/${i.deal_id}`);
                          onClose();
                        }}
                        className="p-2.5 rounded-lg bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800/80 cursor-pointer flex items-center justify-between transition"
                      >
                        <span className="text-slate-300">{i.title}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.deals?.length === 0 &&
                results.memories?.length === 0 &&
                results.interactions?.length === 0 && (
                  <div className="py-8 text-center text-slate-500">
                    No results found for "{query}".
                  </div>
                )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
