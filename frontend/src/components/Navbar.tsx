import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain,
  Search,
  Sparkles,
  Database,
  Building2,
  User as UserIcon,
  LogOut,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenSearch: () => void;
  onLaunchDemo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSearch, onLaunchDemo }) => {
  const [hindsightStatus, setHindsightStatus] = useState<string>('Connecting...');
  const [engineType, setEngineType] = useState<string>('Hindsight Protocol');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { user, organization, logout } = useAuth();
  const navigate = useNavigate();
  const isAcme = organization?.id === 'org_acme' || user?.organization_id === 'org_acme';

  useEffect(() => {
    api.getHealth()
      .then(data => {
        if (data?.hindsight?.status === 'connected') {
          setHindsightStatus('Connected');
          setEngineType('Hindsight Cloud / Local Server');
        } else {
          setHindsightStatus('Active');
          setEngineType('Hindsight Embedded Core');
        }
      })
      .catch(() => {
        setHindsightStatus('Active');
        setEngineType('Hindsight Engine');
      });
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  // Format initials
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const roleLabel =
    user?.role === 'sales_manager'
      ? 'Sales Manager'
      : user?.role === 'admin'
      ? 'Admin'
      : 'Sales Rep';

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
      {/* Brand & Tagline */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-tight text-white">DealMind</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
              Hindsight AI
            </span>
          </div>
          <p className="text-xs text-slate-400">Memory-Powered Sales Intelligence</p>
        </div>
      </div>

      {/* Middle: Search bar trigger */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-sm hover:border-slate-700 transition"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-500" />
            <span>Search deals, objections, memories...</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 rounded border border-slate-700 text-slate-400">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right Controls: Hindsight Status, Demo Launcher, User Menu */}
      <div className="flex items-center gap-3">
        {/* Hindsight Status Indicator */}
        <div
          title={`Memory Engine: ${engineType}`}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/30 text-xs text-emerald-400"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-medium">Hindsight: {hindsightStatus}</span>
        </div>

        {/* Demo Mode Button (Only available for Acme Technologies users) */}
        {isAcme && (
          <button
            onClick={onLaunchDemo}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Launch Demo Story</span>
          </button>
        )}

        {/* Real User Profile / Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2.5 pl-2.5 py-1 border-l border-slate-800 hover:opacity-90 transition focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 border border-indigo-400/40 flex items-center justify-center font-bold text-xs text-white shadow-sm">
              {initials}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-medium text-slate-200 leading-tight">
                {user?.name || 'Account'}
              </p>
              <p className="text-[10px] text-slate-400 leading-tight">
                {organization?.name || 'Organization'}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Profile Dropdown Menu */}
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-1">
              {/* User details header */}
              <div className="px-4 py-3 border-b border-slate-800">
                <p className="text-sm font-semibold text-white">{user?.name}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>

              {/* Organization and Role Badges */}
              <div className="px-4 py-3 space-y-2 border-b border-slate-800 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-2 text-slate-400">
                    <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                    Organization
                  </span>
                  <span className="font-medium text-white">{organization?.name || 'Standard'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-2 text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                    Role
                  </span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-medium text-[11px] border border-indigo-500/20">
                    {roleLabel}
                  </span>
                </div>
              </div>

              {/* Logout Option */}
              <div className="px-2 pt-1.5">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
