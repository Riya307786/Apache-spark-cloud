import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Activity, Database, Layers, Server, RotateCcw } from 'lucide-react';
import { api } from '../services/api';

export const Navbar: React.FC = () => {
  const [health, setHealth] = useState<{
    status: string;
    modelsCount: number;
    activeModel?: string;
    activeJob?: string;
  }>({
    status: 'checking',
    modelsCount: 0
  });

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const [h, m, sys] = await Promise.all([
          api.checkHealth(),
          api.getModels(),
          api.getSystemStatus().catch(() => null)
        ]);
        const active = m.find(x => x.is_active) || m[0];
        const runningJob = sys?.active_jobs?.[0];

        setHealth({
          status: h.status,
          modelsCount: m.length,
          activeModel: active ? `${active.model_type.toUpperCase()} (AUC: ${active.test_roc_auc?.toFixed(4)})` : undefined,
          activeJob: runningJob ? `${runningJob.type} (${runningJob.progress}%)` : undefined
        });
      } catch {
        setHealth({ status: 'offline', modelsCount: 0 });
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 border-b border-border bg-white sticky top-0 z-30 px-6 flex items-center justify-between shadow-xs">
      {/* Brand logo & Tagline */}
      <NavLink to="/" className="flex items-center gap-3 group">
        <div className="w-10 h-10 rounded-xl bg-brand-surface border border-brand-light/40 flex items-center justify-center text-brand shadow-xs group-hover:scale-105 transition-transform">
          <Activity className="w-6 h-6 stroke-[2.2]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-text-primary tracking-tight">DiaRisk Analytics</h1>
            <span className="text-[10px] font-semibold bg-brand-paleRed text-brand px-2 py-0.5 rounded-full border border-brand-light/30">
              v1.0 RESEARCH
            </span>
          </div>
          <p className="text-xs text-text-secondary font-medium -mt-0.5">
            Explainable Diabetes Risk Intelligence
          </p>
        </div>
      </NavLink>

      {/* Header telemetry status */}
      <div className="flex items-center gap-3">
        {/* Active running job pill */}
        {health.activeJob && (
          <NavLink
            to="/processing"
            className="flex items-center gap-2 bg-brand-surface border border-brand-light/50 px-3 py-1.5 rounded-lg text-xs font-semibold text-brand animate-pulse"
          >
            <RotateCcw className="w-3.5 h-3.5 animate-spin" />
            <span>Job: {health.activeJob}</span>
          </NavLink>
        )}

        {/* Dataset tag */}
        <NavLink
          to="/datasets"
          className="hidden md:flex items-center gap-2 bg-background-secondary border border-border px-3 py-1.5 rounded-lg text-xs font-medium text-text-primary hover:border-brand-light transition-colors"
        >
          <Database className="w-3.5 h-3.5 text-brand" />
          <span>CDC BRFSS 2015 (253,680 records)</span>
        </NavLink>

        {/* Active model */}
        {health.activeModel && (
          <NavLink
            to="/models"
            className="hidden lg:flex items-center gap-2 bg-brand-surface border border-brand-light/40 px-3 py-1.5 rounded-lg text-xs font-semibold text-brand hover:bg-brand-paleRed transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Active: {health.activeModel}</span>
          </NavLink>
        )}

        {/* Backend health status pill linking to System page */}
        <NavLink
          to="/system"
          className="flex items-center gap-2 bg-white border border-border hover:border-brand-light px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
          title="Open System & Docker Infrastructure Observability"
        >
          <span className={`w-2 h-2 rounded-full ${health.status === 'healthy' ? 'bg-status-success animate-pulse' : 'bg-status-error'}`} />
          <span className="text-text-secondary">
            {health.status === 'healthy' ? 'Engine Online' : 'Connecting...'}
          </span>
          <Server className="w-3 h-3 text-text-secondary ml-1" />
        </NavLink>
      </div>
    </header>
  );
};
