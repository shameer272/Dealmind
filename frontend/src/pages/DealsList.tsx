import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, ArrowRight, Sparkles, Plus, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import type { Deal } from '../types';
import { CreateDealModal } from '../components/CreateDealModal';

export const DealsList: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState<{ message: string; dealId: string } | null>(null);
  const navigate = useNavigate();

  const loadDeals = () => {
    setLoading(true);
    api.getDeals()
      .then(setDeals)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDeals();
  }, []);

  const handleDealCreated = (newDeal: Deal) => {
    loadDeals();
    setSuccessBanner({
      message: `Opportunity "${newDeal.name}" for ${newDeal.company?.name || 'Client'} registered successfully!`,
      dealId: newDeal.id,
    });
  };

  const formatCurrency = (val: number, cur: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: cur === 'USD' ? 'USD' : 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950/30 to-slate-900 border border-blue-500/20 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-400" />
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Pipeline Management
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Active Opportunities</h1>
          <p className="text-xs text-slate-400">
            Enterprise pipeline with persistent Hindsight memory integration.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-xs text-slate-400 hidden sm:block">
            Showing <strong className="text-white">{deals.length}</strong> active deals
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/20 flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Deal</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-300 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span className="font-medium">{successBanner.message}</span>
          </div>
          <button
            onClick={() => navigate(`/deals/${successBanner.dealId}`)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto transition"
          >
            <span>Open Deal Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Loading Opportunities...</p>
        </div>
      ) : deals.length === 0 ? (
        <div className="py-20 text-center text-slate-400 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30 max-w-lg mx-auto p-8 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto">
            <Briefcase className="w-7 h-7 text-blue-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No active opportunities</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              There are currently no deals associated with your organization. Register your first sales opportunity to activate Hindsight cognitive memory tracking.
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xl shadow-blue-600/25 flex items-center gap-2 mx-auto transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Your First Deal</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {deals.map((deal) => {
            const isFlagship = deal.id === 'deal_acme_flagship';
            return (
              <div
                key={deal.id}
                onClick={() => navigate(`/deals/${deal.id}`)}
                className={`p-6 rounded-2xl border cursor-pointer transition flex flex-col justify-between space-y-4 group ${
                  isFlagship
                    ? 'bg-gradient-to-b from-indigo-950/40 to-slate-900/90 border-indigo-500/40 shadow-xl shadow-indigo-950/30 hover:border-indigo-400'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {deal.stage}
                    </span>
                    {isFlagship && (
                      <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                        <Sparkles className="w-3 h-3" />
                        Flagship Demo
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition">
                      {deal.company?.name || 'Enterprise Client'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{deal.name}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-0.5">
                      <span className="text-[10px] text-slate-500 uppercase">Value</span>
                      <p className="font-bold text-white">{formatCurrency(deal.value, deal.currency)}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-0.5">
                      <span className="text-[10px] text-slate-500 uppercase">Probability</span>
                      <p className="font-bold text-emerald-400">{deal.probability}%</p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">
                    Industry: {deal.company?.industry || 'Technology'}
                  </span>
                  <div className="flex items-center gap-1 text-blue-400 font-semibold group-hover:translate-x-1 transition">
                    <span>Open Deal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Deal Modal */}
      <CreateDealModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleDealCreated}
      />
    </div>
  );
};
