import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Brain,
  Scale,
  Sparkles,
  Radar,
  TrendingUp,
  Building2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, organization } = useAuth();
  const isAcme = organization?.id === 'org_acme' || user?.organization_id === 'org_acme';

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Active Deals', path: '/deals', icon: Briefcase },
    { label: 'Customer Memory', path: '/memory', icon: Brain, badge: 'Hindsight' },
    { label: 'Why Memory Matters', path: '/memory-impact', icon: Scale, highlight: true },
    { label: 'Prepare for Meeting', path: '/prepare-me', icon: Sparkles },
    { label: 'Objection Radar', path: '/objections', icon: Radar },
    { label: 'Learning Curve', path: '/learning-curve', icon: TrendingUp },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col justify-between py-5 shrink-0 select-none">
      <div className="space-y-6">
        <div className="px-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Intelligence Engine
          </p>
        </div>

        <nav className="space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition
                  ${isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }
                  ${item.highlight ? 'relative overflow-hidden' : ''}
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                    {item.badge}
                  </span>
                )}
                {item.highlight && (
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Account / Workspace Context Quick Jump */}
      <div className="px-4 space-y-4">
        {isAcme ? (
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-indigo-500/20">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wide">
                Flagship Account
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                ₹10L
              </span>
            </div>
            <p className="text-xs font-semibold text-white truncate">Acme Technologies</p>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
              10 historical interactions retained in Hindsight.
            </p>
            <NavLink
              to="/deals/deal_acme_flagship"
              className="mt-3 block text-center py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition"
            >
              Open Acme Story
            </NavLink>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800">
            <div className="flex items-center gap-1.5 mb-1 text-slate-400">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[11px] font-semibold uppercase tracking-wide">
                Workspace
              </span>
            </div>
            <p className="text-xs font-semibold text-white truncate">
              {organization?.name || 'Company Account'}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Isolated multi-tenant memory active.
            </p>
            <NavLink
              to="/deals"
              className="mt-3 block text-center py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
            >
              View Active Deals
            </NavLink>
          </div>
        )}

        <div className="pt-2 border-t border-slate-900 px-1 text-[11px] text-slate-500 flex items-center justify-between">
          <span>DealMind v1.0</span>
          <span>SaaS Enterprise</span>
        </div>
      </div>
    </aside>
  );
};
