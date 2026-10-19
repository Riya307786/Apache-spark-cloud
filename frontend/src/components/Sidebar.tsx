import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Database,
  Filter,
  FlaskConical,
  HeartPulse,
  Sparkles,
  Layers,
  Cpu,
  Server,
  FileText,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navItems: NavItem[] = [
  { name: 'Research Overview', path: '/', icon: LayoutDashboard },
  { name: 'Dataset Explorer', path: '/datasets', icon: Database },
  { name: 'Data Processing', path: '/processing', icon: Filter, badge: 'Spark' },
  { name: 'Model Laboratory', path: '/models', icon: FlaskConical },
  { name: 'Risk Prediction', path: '/prediction', icon: HeartPulse },
  { name: 'Explainable AI', path: '/explainability', icon: Sparkles, badge: 'SHAP' },
  { name: 'Risk Stratification', path: '/stratification', icon: Layers },
  { name: 'Big Data & Scalability', path: '/scalability', icon: Cpu, badge: 'Bench' },
  { name: 'System & Docker', path: '/system', icon: Server },
  { name: 'Research Reports', path: '/reports', icon: FileText }
];

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState<boolean>(false);

  return (
    <aside
      className={`border-r border-border bg-white flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)] transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="py-4 px-3 space-y-1">
        <div className="flex items-center justify-between px-3 pb-2 text-[11px] font-bold text-text-secondary uppercase tracking-wider">
          {!collapsed && <span>Research Modules</span>}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-lg text-text-secondary hover:text-brand hover:bg-background-secondary transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              title={collapsed ? item.name : undefined}
              className={({ isActive }) =>
                `flex items-center ${
                  collapsed ? 'justify-center px-2 py-3' : 'justify-between px-3.5 py-2.5'
                } rounded-xl text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-brand-surface text-brand font-semibold shadow-xs border border-brand-light/40'
                    : 'text-text-primary hover:bg-background-secondary hover:text-brand'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" />
                {!collapsed && <span>{item.name}</span>}
              </div>
              {!collapsed && item.badge && (
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-brand-paleRed text-brand">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Bottom info panel */}
      {!collapsed && (
        <div className="p-4 border-t border-border bg-background-secondary/60">
          <div className="text-[11px] text-text-secondary leading-snug">
            <p className="font-semibold text-text-primary">DiaRisk Framework</p>
            <p className="mt-0.5">Scalable & Explainable Cloud Analytics</p>
            <div className="mt-2 pt-2 border-t border-border flex items-center justify-between text-[10px]">
              <span>CDC BRFSS 2015</span>
              <span className="text-brand font-semibold">Ready</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
