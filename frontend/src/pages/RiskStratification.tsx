import React, { useState, useEffect } from 'react';
import {
  Layers,
  Sliders,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { api } from '../services/api';
import { StratificationData, ModelSummary } from '../types';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

export const RiskStratification: React.FC = () => {
  const [models, setModels] = useState<ModelSummary[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [lowerThreshold, setLowerThreshold] = useState<number>(0.20);
  const [upperThreshold, setUpperThreshold] = useState<number>(0.50);
  const [data, setData] = useState<StratificationData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.getModels().then(list => {
      setModels(list);
      const active = list.find(m => m.is_active) || list[0];
      if (active) setSelectedModelId(active.model_id);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedModelId) {
      loadStratification(selectedModelId, lowerThreshold, upperThreshold);
    }
  }, [selectedModelId, lowerThreshold, upperThreshold]);

  const loadStratification = async (mId: string, lower: number, upper: number) => {
    setLoading(true);
    try {
      const res = await api.getStratificationSummary(mId, lower, upper);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <DisclaimerBanner />

      {/* Header */}
      <div className="bg-white border border-border rounded-2xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-brand-surface border border-brand-light/30 px-3 py-1 rounded-full text-xs font-semibold text-brand mb-2">
            <Layers className="w-3.5 h-3.5" />
            Population Risk Stratification Protocol
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Risk Stratification & Equity Analysis</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Stratify individuals into lower, intermediate, and higher empirical risk bands with Wilson score 95% confidence intervals and demographic subgroup equity audits.
          </p>
        </div>

        {/* Model selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-text-primary">Model:</span>
          <select
            value={selectedModelId}
            onChange={(e) => setSelectedModelId(e.target.value)}
            className="text-xs bg-background-secondary border border-border rounded-lg px-3 py-1.5 font-medium text-text-primary focus:outline-none focus:border-brand"
          >
            {models.map(m => (
              <option key={m.model_id} value={m.model_id}>
                {m.model_type.toUpperCase()} ({m.model_id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Threshold Configuration Card */}
      <div className="bg-white border border-border rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-brand" />
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
              Documented Threshold Policy & Cutoff Sliders
            </h2>
          </div>
          <span className="text-xs text-text-secondary">
            Method: Validation Empirical Distribution Tuning
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between text-xs font-semibold text-text-primary mb-1">
              <span>Lower Risk Cutoff (Upper Bound)</span>
              <span className="text-brand font-mono font-bold">{(lowerThreshold * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.40"
              step="0.05"
              value={lowerThreshold}
              onChange={(e) => setLowerThreshold(parseFloat(e.target.value))}
              className="w-full accent-brand"
            />
            <p className="text-[11px] text-text-secondary mt-1">
              Participants below {(lowerThreshold * 100).toFixed(0)}% are stratified into the Lower-Risk band.
            </p>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-text-primary mb-1">
              <span>Higher Risk Cutoff (Lower Bound)</span>
              <span className="text-brand font-mono font-bold">{(upperThreshold * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.35"
              max="0.75"
              step="0.05"
              value={upperThreshold}
              onChange={(e) => setUpperThreshold(parseFloat(e.target.value))}
              className="w-full accent-brand"
            />
            <p className="text-[11px] text-text-secondary mt-1">
              Participants at or above {(upperThreshold * 100).toFixed(0)}% are flagged for priority clinical screening.
            </p>
          </div>
        </div>
      </div>

      {/* Three Risk Bands Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {data?.tiers?.map((tier) => {
          const isHigh = tier.id === 'higher';
          const isInter = tier.id === 'intermediate';
          return (
            <div
              key={tier.id}
              className={`border rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4 ${
                isHigh
                  ? 'bg-brand-surface/40 border-brand-light/60'
                  : isInter
                  ? 'bg-background-secondary border-border'
                  : 'bg-white border-border'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    isHigh
                      ? 'bg-brand text-white'
                      : isInter
                      ? 'bg-status-warning/20 text-status-warning'
                      : 'bg-status-success/20 text-status-success'
                  }`}>
                    {tier.label}
                  </span>
                  <span className="text-xs font-mono font-semibold text-text-secondary">
                    {tier.threshold_range}
                  </span>
                </div>

                <div className="mt-4">
                  <p className="text-xs text-text-secondary font-medium">Observed Diabetes Frequency</p>
                  <p className={`text-3xl font-extrabold mt-0.5 font-mono ${isHigh ? 'text-brand' : 'text-text-primary'}`}>
                    {tier.observed_rate}%
                  </p>
                  <p className="text-[11px] text-text-secondary mt-0.5">
                    95% CI: [{tier.ci_95.lower}% – {tier.ci_95.upper}%]
                  </p>
                </div>
              </div>

              <div className="border-t border-border/80 pt-3 text-xs space-y-1">
                <div className="flex justify-between text-text-secondary">
                  <span>Cohort Size:</span>
                  <span className="font-semibold text-text-primary font-mono">{tier.count.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Proportion of Population:</span>
                  <span className="font-semibold text-text-primary font-mono">{tier.proportion}%</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Observed Cases:</span>
                  <span className="font-semibold text-text-primary font-mono">{tier.positives.toLocaleString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Columns: Subgroup Equity Analysis vs Sensitivity Sweep */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subgroup Equity Audit Table */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-xs space-y-4">
          <div className="border-b border-border pb-3">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
              Demographic Subgroup Equity Performance
            </h2>
            <p className="text-xs text-text-secondary">
              Evaluating potential disparities across biological sex, age cohorts, and BMI categories
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-text-secondary bg-background-secondary/50">
                  <th className="py-2 px-3 font-semibold">Subgroup</th>
                  <th className="py-2 px-3 font-semibold text-right">Count</th>
                  <th className="py-2 px-3 font-semibold text-right">Flagged High-Risk</th>
                  <th className="py-2 px-3 font-semibold text-right">True Prevalence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data?.subgroup_analysis?.map((sub, idx) => (
                  <tr key={idx} className="hover:bg-background-secondary/30">
                    <td className="py-2 px-3">
                      <p className="font-semibold text-text-primary">{sub.group}</p>
                      <p className="text-[10px] text-text-secondary">{sub.category}</p>
                    </td>
                    <td className="py-2 px-3 text-right font-mono">{sub.count}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-brand">
                      {sub.high_risk_share}%
                    </td>
                    <td className="py-2 px-3 text-right font-mono">
                      {sub.observed_prevalence}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Threshold Sensitivity Sweep */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-xs space-y-4">
          <div className="border-b border-border pb-3">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
              Decision Cutoff Sensitivity Sweep
            </h2>
            <p className="text-xs text-text-secondary">
              Tradeoff between clinical sensitivity (recall) and precision as cutoff varies
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.sensitivity_sweep || []} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0E4E8" />
                <XAxis dataKey="threshold" stroke="#77717A" fontSize={10} label={{ value: 'Decision Cutoff Threshold', position: 'insideBottom', offset: -10, fontSize: 10 }} />
                <YAxis stroke="#77717A" fontSize={10} domain={[0, 1]} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #F0E4E8', fontSize: '11px' }} />
                <Line type="monotone" dataKey="sensitivity" stroke="#C84B65" strokeWidth={2} name="Sensitivity (TPR)" />
                <Line type="monotone" dataKey="precision" stroke="#47866C" strokeWidth={2} name="Precision (PPV)" />
                <Line type="monotone" dataKey="f1" stroke="#C58B38" strokeWidth={2} name="F1-Score" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center gap-6 text-[11px]">
            <span className="flex items-center gap-1.5 text-brand font-semibold">
              <span className="w-2.5 h-0.5 bg-brand" /> Sensitivity
            </span>
            <span className="flex items-center gap-1.5 text-status-success font-semibold">
              <span className="w-2.5 h-0.5 bg-status-success" /> Precision
            </span>
            <span className="flex items-center gap-1.5 text-status-warning font-semibold">
              <span className="w-2.5 h-0.5 bg-status-warning" /> F1-Score
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
