import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Brain, Filter, Search, Tag, Sparkles, Calendar, CheckCircle2, ShieldCheck, Bookmark, Briefcase } from 'lucide-react';
import { api } from '../services/api';
import type { MemoryItem, Deal } from '../types';

export const CustomerMemory: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [dealId, setDealId] = useState<string>('');
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Load organization's authorized deals first
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

  // When dealId changes, fetch memories for that authorized deal
  useEffect(() => {
    if (!dealId) return;
    setLoading(true);
    api.getDealMemory(dealId)
      .then(setMemories)
      .catch((err) => {
        console.error(err);
        setMemories([]);
      })
      .finally(() => setLoading(false));
  }, [dealId]);

  const handleDealChange = (newDealId: string) => {
    setDealId(newDealId);
    setSearchParams({ dealId: newDealId });
  };

  const categories = [
    { label: 'All Memories', value: 'ALL' },
    { label: 'Customer Facts', value: 'CUSTOMER_PROFILE' },
    { label: 'Budget & Pricing', value: 'BUDGET' },
    { label: 'Objections', value: 'OBJECTION' },
    { label: 'Competitors', value: 'COMPETITOR' },
    { label: 'Preferences', value: 'PREFERENCE' },
    { label: 'Commitments', value: 'COMMITMENT' },
    { label: 'Success Patterns', value: 'SUCCESS_PATTERN' },
  ];

  const filteredMemories = memories.filter((m) => {
    const matchesCategory = filterType === 'ALL' || m.memory_type === filterType;
    const matchesSearch =
      !searchTerm ||
      m.fact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.source_title && m.source_title.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const selectedDeal = deals.find((d) => d.id === dealId);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Hindsight Cognitive Core
            </span>
            <span className="text-xs text-slate-400">• Multi-Turn Memory Bank</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Customer Memory Explorer</h1>
          <p className="text-xs text-slate-400">
            Inspect long-term structured facts retained by Hindsight across authorized deal lifespans.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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

          <div className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <span className="text-slate-400">Total Memories: </span>
            <span className="font-bold text-indigo-400 font-mono text-sm">{memories.length}</span>
          </div>
        </div>
      </div>

      {deals.length === 0 && !loading ? (
        <div className="py-24 text-center text-slate-400 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
          <Brain className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <h3 className="text-base font-semibold text-white">No deals in your organization</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Customer memories will be extracted and indexed as interactions are recorded for your deals.
          </p>
        </div>
      ) : (
        <>
          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            {/* Category Pills */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setFilterType(cat.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                    filterType === cat.value
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search retained memories..."
                className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Memories Grid */}
          {loading ? (
            <div className="py-24 text-center text-slate-400">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm">Recalling Hindsight Memories...</p>
            </div>
          ) : filteredMemories.length === 0 ? (
            <div className="py-20 text-center text-slate-400 border border-dashed border-slate-800 rounded-2xl">
              <p className="text-sm">No memories found matching your filter criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMemories.map((mem) => (
                <div
                  key={mem.id}
                  className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-indigo-500/30 transition flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {mem.memory_type.replace('_', ' ')}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          mem.importance === 'critical'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : mem.importance === 'high'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {mem.importance}
                      </span>
                    </div>

                    <p className="text-sm font-medium text-slate-100 leading-relaxed">
                      {mem.fact}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="truncate max-w-[200px]" title={mem.source_title}>
                      From: {mem.source_title || 'Direct Entry'}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">
                      {new Date(mem.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
