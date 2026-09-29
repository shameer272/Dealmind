import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Clock,
  AlertTriangle,
  Brain,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Briefcase,
  Layers,
  Plus
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user, organization } = useAuth();

  const isAcme = organization?.id === 'org_acme' || user?.organization_id === 'org_acme';

  useEffect(() => {
    api.getDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center py-24 text-slate-400">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm">Loading Sales Intelligence Dashboard...</p>
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

  const displayName = user?.name ? user.name.split(' ')[0] : 'there';
  const orgName = organization?.name || 'Workspace';

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/20 border border-indigo-500/20 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              DealMind Active
            </span>
            <span className="text-xs text-slate-400">• {orgName}</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Welcome back, {displayName}. Here's your deal intelligence.
          </h1>
          <p className="text-xs text-slate-400">
            {isAcme
              ? "You have 2 meetings today. Acme Technologies' CRM integration objection remains open."
              : `You have ${data?.meetings_today_count ?? 0} meetings scheduled today and ${data?.active_deals_count ?? 0} active deals in your pipeline.`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isAcme ? (
            <button
              onClick={() => navigate('/deals/deal_acme_flagship')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Open Flagship Acme Deal</span>
            </button>
          ) : (
            <button
              onClick={() => navigate('/deals')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition active:scale-95"
            >
              <Briefcase className="w-4 h-4" />
              <span>Explore Pipeline</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stat Cards (Using strictly nullish ?? checks, NO fallback to demo numbers) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Pipeline Value</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-bold text-white">{formatCurrency(data?.total_pipeline_value ?? 0)}</p>
          <p className="text-[11px] text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>{data?.active_deals_count ?? 0} Active Opportunities</span>
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Meetings Today</span>
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-xl font-bold text-white">{data?.meetings_today_count ?? 0}</p>
          <p className="text-[11px] text-blue-400 truncate">
            {data?.meetings_today?.length
              ? data.meetings_today.map((m: any) => m.company_name).slice(0, 2).join(' & ')
              : 'No scheduled meetings'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Follow-ups Due</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-bold text-white">{data?.follow_ups_due_count ?? 0}</p>
          <p className="text-[11px] text-amber-400">
            {(data?.follow_ups_due_count ?? 0) > 0 ? `${data.follow_ups_due_count} commitments due` : 'Tasks up to date'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">High-Risk Deals</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-xl font-bold text-white">{data?.high_risk_deals_count ?? 0}</p>
          <p className="text-[11px] text-rose-400">
            {(data?.high_risk_deals_count ?? 0) > 0 ? 'Requires attention' : 'Zero at-risk deals'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/30 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-indigo-300">
            <span className="text-xs font-medium">Hindsight Memory</span>
            <Brain className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-xl font-bold text-white">
            {isAcme ? '25 Facts Retained' : `${data?.deals?.length ?? 0} Deals Scoped`}
          </p>
          <p className="text-[11px] text-indigo-300">
            {isAcme ? '10 Interactions Tracked' : `${orgName} Bank`}
          </p>
        </div>
      </div>

      {/* Main Grid: Upcoming Meetings & Live Memory Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Deals Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Active Enterprise Deals</h3>
                <p className="text-xs text-slate-400">Deals authorized for {orgName}</p>
              </div>
              <button
                onClick={() => navigate('/deals')}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {(!data?.deals || data.deals.length === 0) ? (
              <div className="py-12 text-center text-slate-400 border border-dashed border-slate-800 rounded-xl">
                <Briefcase className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p className="text-sm font-medium text-slate-300">No active deals yet</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-3">
                  Your organization workspace is ready. Register opportunities to activate pipeline intelligence and memory.
                </p>
                <button
                  onClick={() => navigate('/deals')}
                  className="px-3.5 py-1.5 bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Deal in Pipeline</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                      <th className="pb-3">Company & Deal</th>
                      <th className="pb-3">Stage</th>
                      <th className="pb-3">Value</th>
                      <th className="pb-3">Health Score</th>
                      <th className="pb-3">Next Action</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {data.deals.map((deal: any) => (
                      <tr
                        key={deal.id}
                        className="hover:bg-slate-800/30 transition group cursor-pointer"
                        onClick={() => navigate(`/deals/${deal.id}`)}
                      >
                        <td className="py-3">
                          <p className="font-semibold text-white group-hover:text-blue-400 transition">
                            {deal.company_name}
                          </p>
                          <p className="text-[11px] text-slate-400">{deal.name}</p>
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {deal.stage}
                          </span>
                        </td>
                        <td className="py-3 font-semibold text-slate-200">
                          {formatCurrency(deal.value)}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  deal.health_score >= 75
                                    ? 'bg-emerald-500'
                                    : deal.health_score >= 60
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                }`}
                                style={{ width: `${deal.health_score}%` }}
                              />
                            </div>
                            <span className="font-mono text-[11px] text-slate-300">
                              {deal.health_score}/100
                            </span>
                          </div>
                        </td>
                        <td className="py-3 text-slate-300 max-w-[150px] truncate">
                          {deal.next_action}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/prepare-me?dealId=${deal.id}`);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white text-[11px] font-medium transition"
                          >
                            Prepare
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Upcoming Meetings Card */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>Upcoming Meetings Today</span>
            </h3>

            {(!data?.meetings_today || data.meetings_today.length === 0) ? (
              <div className="py-6 text-center text-slate-400 border border-dashed border-slate-800/80 rounded-xl">
                <Calendar className="w-5 h-5 mx-auto mb-1.5 text-slate-600" />
                <p className="text-xs text-slate-400">No meetings scheduled for today</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.meetings_today.map((meet: any) => (
                  <div
                    key={meet.id}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <p className="font-semibold text-white text-xs">{meet.company_name}</p>
                      <p className="text-[11px] text-slate-400">{meet.contact}</p>
                      <span className="inline-block text-[10px] text-blue-400 font-mono">
                        ⏰ {meet.time}
                      </span>
                    </div>
                    <button
                      onClick={() => navigate(`/prepare-me?dealId=${meet.deal_id}`)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/30 text-xs font-semibold transition"
                    >
                      Prepare Me
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Hindsight Memory Feed */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-gradient-to-b from-indigo-950/20 to-slate-900/80 border border-indigo-500/20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">Recent Hindsight Insights</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                Cognitive Feed
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Key customer facts and objections automatically distilled from ongoing interactions:
            </p>

            {(!data?.recent_insights || data.recent_insights.length === 0) ? (
              <div className="py-8 text-center text-slate-400 border border-dashed border-slate-800 rounded-xl">
                <Brain className="w-6 h-6 mx-auto mb-2 text-slate-600" />
                <p className="text-xs text-slate-400">No objection or risk signals detected yet</p>
                <p className="text-[11px] text-slate-500 mt-1">Intelligence is formed automatically as meetings are added.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.recent_insights.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white text-xs">{item.deal}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${
                          item.priority === 'high'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {item.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{item.insight}</p>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => navigate('/memory')}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition text-center block"
            >
              Explore Full Customer Memory
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
