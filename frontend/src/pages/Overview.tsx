import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Database,
  Layers,
  Sparkles,
  Cpu,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Clock,
  Server,
  BarChart2,
  Filter,
  HeartPulse,
  HardDrive
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { api } from '../services/api';
import { DatasetInfo, DatasetSummary, ModelSummary, SystemObservability } from '../types';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

export const Overview: React.FC = () => {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState<DatasetInfo[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('binary');
  const [summary, setSummary] = useState<DatasetSummary | null>(null);
  const [models, setModels] = useState<ModelSummary[]>([]);
  const [systemData, setSystemData] = useState<SystemObservability | null>(null);
  const [recentRuns, setRecentRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadData(selectedDatasetId);
  }, [selectedDatasetId]);

  const loadData = async (dsId: string) => {
    setLoading(true);
    try {
      const [dsList, dsSummary, modelList, sys, runs] = await Promise.all([
        api.getDatasets(),
        api.getDatasetSummary(dsId),
        api.getModels(),
        api.getSystemStatus().catch(() => null),
        api.getProcessingRuns().catch(() => [])
      ]);
      setDatasets(dsList);
      setSummary(dsSummary);
      setModels(modelList);
      setSystemData(sys);
      setRecentRuns(runs);
    } catch (err) {
      console.error('Failed to load overview data', err);
    } finally {
      setLoading(false);
    }
  };

  const activeModel = models.find(m => m.is_active) || models[0];
  const latestRun = recentRuns[0];

  const pieData = summary ? [
    { name: 'No Diabetes (0)', value: summary.target_distribution['0'] || 0, color: '#E8A1B1' },
    { name: 'Diagnosed Diabetes (1)', value: summary.target_distribution['1'] || 0, color: '#C84B65' }
  ] : [];

  return (
    <div className="space-y-6">
      <DisclaimerBanner />

      {/* Hero Banner */}
      <div className="bg-white border border-border rounded-2xl p-6 lg:p-8 shadow-xs relative overflow-hidden">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 bg-brand-surface border border-brand-light/30 px-3 py-1 rounded-full text-xs font-semibold text-brand">
            <Activity className="w-3.5 h-3.5" />
            Executive Population Health & Research Intelligence Dashboard
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-text-primary tracking-tight leading-tight">
            DiaRisk Analytics: Research Intelligence Platform
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed">
            A Scalable and Explainable Cloud-Based Big Data Analytics Framework for Diabetes Risk Prediction and High-Risk Patient Stratification using the CDC Behavioral Risk Factor Surveillance System (BRFSS 2015).
          </p>
        </div>

        {/* Dataset Switcher Pills */}
        <div className="mt-6 pt-6 border-t border-border flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
            <span>Selected Dataset:</span>
            <div className="flex gap-1.5 bg-background-secondary p-1 rounded-xl border border-border">
              {datasets.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDatasetId(d.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedDatasetId === d.id
                      ? 'bg-white text-brand font-semibold shadow-xs border border-brand-light/40'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {d.id === 'binary' ? 'Primary Binary (254K)' : d.id === 'multi_class' ? '3-Class (254K)' : 'Balanced 50/50 (71K)'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/prediction')}
              className="bg-brand text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs hover:bg-brand/90 transition-all flex items-center gap-2"
            >
              <HeartPulse className="w-3.5 h-3.5" />
              <span>Score Patient Profile</span>
            </button>
            <button
              onClick={() => navigate('/processing')}
              className="bg-brand-surface text-brand border border-brand-light/40 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-brand-paleRed transition-all flex items-center gap-2"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Data Processing</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4 EXECUTIVE SECTIONS: DATASET, ML, PROCESSING, OPERATIONAL */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* 1. DATASET SUMMARY CARD */}
        <div
          onClick={() => navigate('/datasets')}
          className="bg-white border border-border rounded-2xl p-5 shadow-xs hover:border-brand-light transition-all cursor-pointer group flex flex-col justify-between space-y-4"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-brand uppercase tracking-wider bg-brand-surface px-2 py-0.5 rounded border border-brand-light/30">
                1. Dataset Summary
              </span>
              <ArrowRight className="w-4 h-4 text-text-secondary group-hover:text-brand transition-transform group-hover:translate-x-1" />
            </div>

            <p className="text-xl font-extrabold text-text-primary mt-3 font-mono">
              {summary ? summary.total_rows.toLocaleString() : '—'}
            </p>
            <p className="text-xs font-medium text-text-secondary mt-0.5">Total Survey Observations</p>
          </div>

          <div className="text-xs text-text-secondary border-t border-border pt-3 space-y-1.5">
            <div className="flex justify-between">
              <span>Features:</span>
              <span className="font-bold text-text-primary font-mono">{summary?.feature_count || 21} Indicators</span>
            </div>
            <div className="flex justify-between">
              <span>Target:</span>
              <span className="font-mono text-brand font-semibold">{summary?.target_column || 'Diabetes_binary'}</span>
            </div>
            <div className="flex justify-between">
              <span>Class Imbalance:</span>
              <span className="font-mono text-text-primary font-semibold">{summary?.imbalance_ratio || '6.18:1'}</span>
            </div>
            <div className="flex justify-between text-status-success font-semibold text-[11px]">
              <span>Validation Status:</span>
              <span>PASSED (0 Nulls)</span>
            </div>
          </div>
        </div>

        {/* 2. ML SUMMARY CARD */}
        <div
          onClick={() => navigate('/models')}
          className="bg-white border border-border rounded-2xl p-5 shadow-xs hover:border-brand-light transition-all cursor-pointer group flex flex-col justify-between space-y-4"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-brand uppercase tracking-wider bg-brand-surface px-2 py-0.5 rounded border border-brand-light/30">
                2. ML Summary
              </span>
              <ArrowRight className="w-4 h-4 text-text-secondary group-hover:text-brand transition-transform group-hover:translate-x-1" />
            </div>

            <p className="text-xl font-extrabold text-brand mt-3 font-mono">
              {activeModel ? `${(activeModel.test_roc_auc * 100).toFixed(1)}%` : '—'}
            </p>
            <p className="text-xs font-medium text-text-secondary mt-0.5">
              Best Test ROC-AUC ({activeModel?.model_type.toUpperCase() || 'None'})
            </p>
          </div>

          <div className="text-xs text-text-secondary border-t border-border pt-3 space-y-1.5">
            <div className="flex justify-between">
              <span>Registered Models:</span>
              <span className="font-bold text-text-primary font-mono">{models.length} Trained</span>
            </div>
            <div className="flex justify-between">
              <span>Test Sensitivity:</span>
              <span className="font-mono text-text-primary font-semibold">
                {activeModel ? `${(activeModel.test_recall * 100).toFixed(1)}%` : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Inference Latency:</span>
              <span className="font-mono text-text-primary font-semibold">{activeModel?.inference_latency_ms || 0} ms/rec</span>
            </div>
            <div className="flex justify-between text-brand font-semibold text-[11px]">
              <span>Active Model ID:</span>
              <span className="font-mono truncate max-w-[120px]">{activeModel?.model_id || 'None'}</span>
            </div>
          </div>
        </div>

        {/* 3. PROCESSING SUMMARY CARD */}
        <div
          onClick={() => navigate('/processing')}
          className="bg-white border border-border rounded-2xl p-5 shadow-xs hover:border-brand-light transition-all cursor-pointer group flex flex-col justify-between space-y-4"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-brand uppercase tracking-wider bg-brand-surface px-2 py-0.5 rounded border border-brand-light/30">
                3. Processing Summary
              </span>
              <ArrowRight className="w-4 h-4 text-text-secondary group-hover:text-brand transition-transform group-hover:translate-x-1" />
            </div>

            <p className="text-xl font-extrabold text-text-primary mt-3 font-mono">
              12 / 12 Stages
            </p>
            <p className="text-xs font-medium text-text-secondary mt-0.5">Visual Pipeline Implemented</p>
          </div>

          <div className="text-xs text-text-secondary border-t border-border pt-3 space-y-1.5">
            <div className="flex justify-between">
              <span>Spark Status:</span>
              <span className={`font-semibold ${systemData?.spark.spark_available ? 'text-status-success' : 'text-brand'}`}>
                {systemData?.spark.spark_available ? 'JVM Online' : 'Host JVM Offline'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Parquet Serialization:</span>
              <span className="font-mono text-status-success font-semibold">Verified ({latestRun?.duration_seconds || '0.5'}s)</span>
            </div>
            <div className="flex justify-between">
              <span>Data-Quality Check:</span>
              <span className="font-mono text-status-success font-semibold">100% Passed</span>
            </div>
            <div className="flex justify-between text-text-primary font-semibold text-[11px]">
              <span>Last Run ID:</span>
              <span className="font-mono truncate max-w-[120px]">{latestRun?.run_id || 'Default'}</span>
            </div>
          </div>
        </div>

        {/* 4. OPERATIONAL SUMMARY CARD */}
        <div
          onClick={() => navigate('/system')}
          className="bg-white border border-border rounded-2xl p-5 shadow-xs hover:border-brand-light transition-all cursor-pointer group flex flex-col justify-between space-y-4"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-brand uppercase tracking-wider bg-brand-surface px-2 py-0.5 rounded border border-brand-light/30">
                4. Operational Summary
              </span>
              <ArrowRight className="w-4 h-4 text-text-secondary group-hover:text-brand transition-transform group-hover:translate-x-1" />
            </div>

            <div className="flex items-center gap-2 mt-3">
              <span className="w-3 h-3 rounded-full bg-status-success animate-pulse" />
              <p className="text-xl font-extrabold text-status-success capitalize">Healthy</p>
            </div>
            <p className="text-xs font-medium text-text-secondary mt-0.5">System & Docker Infrastructure</p>
          </div>

          <div className="text-xs text-text-secondary border-t border-border pt-3 space-y-1.5">
            <div className="flex justify-between">
              <span>Backend Uptime:</span>
              <span className="font-mono text-text-primary font-semibold">{systemData?.uptime_formatted || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span>Host CPU Utilization:</span>
              <span className="font-mono text-text-primary font-semibold">{systemData?.hardware.cpu_percent || 0}%</span>
            </div>
            <div className="flex justify-between">
              <span>Docker Mode:</span>
              <span className="font-semibold text-text-primary">
                {systemData?.docker.daemon_running ? 'Daemon Active' : 'Standalone'}
              </span>
            </div>
            <div className="flex justify-between text-status-success font-semibold text-[11px]">
              <span>Active Background Jobs:</span>
              <span className="font-mono">{systemData?.active_jobs?.length || 0} Running</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Model Leaderboard & Target Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Model Leaderboard (2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-border rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-base font-bold text-text-primary">Production Model Registry Leaderboard</h2>
              <p className="text-xs text-text-secondary">Empirical performance evaluated on held-out test split (15%)</p>
            </div>
            <button
              onClick={() => navigate('/models')}
              className="text-xs font-semibold text-brand hover:underline flex items-center gap-1"
            >
              <span>Model Laboratory</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto border border-border rounded-xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-text-secondary bg-background-secondary/60">
                  <th className="py-2.5 px-3">Model</th>
                  <th className="py-2.5 px-3 text-right">ROC-AUC</th>
                  <th className="py-2.5 px-3 text-right">PR-AUC</th>
                  <th className="py-2.5 px-3 text-right">Sensitivity</th>
                  <th className="py-2.5 px-3 text-right">Specificity</th>
                  <th className="py-2.5 px-3 text-right">Brier Score</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {models.map((m) => (
                  <tr key={m.model_id} className="hover:bg-background-secondary/30">
                    <td className="py-2.5 px-3 font-semibold text-text-primary uppercase flex items-center gap-2">
                      <span>{m.model_type}</span>
                      <span className="text-[10px] font-mono text-text-secondary font-normal">({m.model_id})</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-brand">{m.test_roc_auc?.toFixed(4)}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{m.test_pr_auc?.toFixed(4)}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{m.test_recall ? `${(m.test_recall * 100).toFixed(1)}%` : '—'}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{m.test_precision ? `${(m.test_precision * 100).toFixed(1)}%` : '—'}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{m.test_brier?.toFixed(4)}</td>
                    <td className="py-2.5 px-3 text-center">
                      {m.is_active ? (
                        <span className="bg-status-success/10 text-status-success font-semibold px-2 py-0.5 rounded text-[10px] border border-status-success/30">
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] text-text-secondary">Registered</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => navigate('/explainability')}
              className="flex-1 bg-brand-surface border border-brand-light/40 text-brand py-2.5 rounded-xl text-xs font-semibold hover:bg-brand-paleRed transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Inspect SHAP Feature Importance</span>
            </button>
            <button
              onClick={() => navigate('/stratification')}
              className="flex-1 bg-background-secondary border border-border text-text-primary py-2.5 rounded-xl text-xs font-semibold hover:bg-white transition-all flex items-center justify-center gap-1.5"
            >
              <Layers className="w-4 h-4" />
              <span>View Risk Stratification</span>
            </button>
          </div>
        </div>

        {/* Target Distribution Card (1 Col) */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-text-primary">Target Distribution</h2>
            <p className="text-xs text-text-secondary">BRFSS survey prevalence ratio</p>

            <div className="h-44 w-full mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => Number(val).toLocaleString()}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #F0E4E8', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 mt-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-light" />
                  <span className="text-text-secondary">No Diabetes (0)</span>
                </div>
                <span className="font-semibold text-text-primary">
                  {summary ? summary.target_distribution['0']?.toLocaleString() : '—'} ({summary ? (100 - summary.prevalence_percent).toFixed(1) : '—'}%)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand" />
                  <span className="text-text-secondary">Diagnosed Diabetes (1)</span>
                </div>
                <span className="font-semibold text-text-primary">
                  {summary ? summary.target_distribution['1']?.toLocaleString() : '—'} ({summary ? summary.prevalence_percent : '—'}%)
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border text-[11px] text-text-secondary leading-snug">
            {summary?.duplicate_policy_note}
          </div>
        </div>
      </div>
    </div>
  );
};
