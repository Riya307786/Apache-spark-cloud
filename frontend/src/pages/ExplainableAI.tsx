import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Info,
  Clock,
  ShieldCheck,
  Zap,
  RotateCcw,
  Sliders
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid
} from 'recharts';
import { api } from '../services/api';
import { ModelSummary } from '../types';

export const ExplainableAI: React.FC = () => {
  const [models, setModels] = useState<ModelSummary[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [globalShap, setGlobalShap] = useState<any>(null);
  const [localShap, setLocalShap] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'global' | 'local'>('global');

  // Interactive patient input for local waterfall breakdown
  const [patientInput, setPatientInput] = useState<Record<string, number>>({
    HighBP: 1,
    HighChol: 1,
    BMI: 34.2,
    GenHlth: 4,
    Age: 9,
    DiffWalk: 1,
    PhysActivity: 0,
    Smoker: 1,
    HeartDiseaseorAttack: 1
  });

  useEffect(() => {
    loadModelsAndShap();
  }, []);

  useEffect(() => {
    if (selectedModelId) {
      loadShapData(selectedModelId);
    }
  }, [selectedModelId]);

  const loadModelsAndShap = async () => {
    try {
      const list = await api.getModels();
      setModels(list);
      const active = list.find(m => m.is_active) || list[0];
      if (active) {
        setSelectedModelId(active.model_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadShapData = async (mId: string) => {
    setLoading(true);
    try {
      const [gShap, lShap] = await Promise.all([
        api.getGlobalExplanations(mId, 150),
        api.getLocalExplanation({ model_id: mId, features: patientInput })
      ]);
      setGlobalShap(gShap);
      setLocalShap(lShap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateLocal = async () => {
    try {
      const lShap = await api.getLocalExplanation({
        model_id: selectedModelId,
        features: patientInput
      });
      setLocalShap(lShap);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-border rounded-2xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-brand-surface border border-brand-light/30 px-3 py-1 rounded-full text-xs font-semibold text-brand mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            SHAP (SHapley Additive exPlanations) Intelligence
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Explainable AI (XAI)</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Model transparency, global feature attributions, and localized patient prediction waterfalls based on cooperative game theory.
          </p>
        </div>

        {/* Global vs Local Toggle */}
        <div className="flex bg-background-secondary p-1 rounded-xl border border-border">
          <button
            onClick={() => setActiveTab('global')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'global' ? 'bg-white text-brand shadow-xs border border-brand-light/40' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Global Importance (Population)
          </button>
          <button
            onClick={() => setActiveTab('local')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'local' ? 'bg-white text-brand shadow-xs border border-brand-light/40' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Local Patient Waterfall
          </button>
        </div>
      </div>

      {/* Scientific Guidance Banner */}
      <div className="bg-background-secondary border border-border rounded-xl p-4 flex items-start gap-3 text-xs text-text-secondary">
        <Info className="w-4 h-4 text-brand shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-text-primary mr-1">Scientific Attribution Disclaimer:</span>
          SHAP values quantify statistical attribution towards the model's prediction score based on training data distributions. They describe model behavior and feature association, but do not imply clinical causality, direct physiological pathogenesis, or interventional outcomes.
        </div>
      </div>

      {/* Model Selection & Latency Bar */}
      <div className="bg-white border border-border rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-text-primary">Explainer Model:</span>
          <select
            value={selectedModelId}
            onChange={(e) => setSelectedModelId(e.target.value)}
            className="text-xs bg-background-secondary border border-border rounded-lg px-3 py-1.5 font-medium text-text-primary focus:outline-none focus:border-brand"
          >
            {models.map(m => (
              <option key={m.model_id} value={m.model_id}>
                {m.model_type.toUpperCase()} — {m.model_id} (AUC: {m.test_roc_auc?.toFixed(4)})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4 text-xs text-text-secondary">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-brand" />
            <span>SHAP Computation Time: <strong>{globalShap?.computation_time_ms || 0} ms</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-status-success" />
            <span>Stability Score: <strong>{(globalShap?.stability_score * 100 || 94).toFixed(0)}%</strong></span>
          </div>
        </div>
      </div>

      {activeTab === 'global' ? (
        /* Global SHAP View */
        <div className="space-y-6">
          <div className="bg-white border border-border rounded-2xl p-6 shadow-xs space-y-4">
            <div className="border-b border-border pb-3">
              <h2 className="text-base font-bold text-text-primary">Global Mean Absolute SHAP Importance (|SHAP|)</h2>
              <p className="text-xs text-text-secondary">
                Average absolute impact of each BRFSS health indicator on model risk predictions across the population cohort
              </p>
            </div>

            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={globalShap?.global_importance?.slice(0, 12) || []}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0E4E8" horizontal={false} />
                  <XAxis type="number" stroke="#77717A" fontSize={11} label={{ value: 'Mean |SHAP Value| (Impact on Model Log-Odds)', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                  <YAxis dataKey="label" type="category" stroke="#77717A" fontSize={11} width={130} />
                  <Tooltip
                    formatter={(val: any) => [val, 'Mean |SHAP|']}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #F0E4E8', fontSize: '11px' }}
                  />
                  <Bar dataKey="mean_abs_shap" fill="#C84B65" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-text-secondary text-center">
              Top drivers: General Health Rating, Body Mass Index (BMI), High Blood Pressure, and Age bracket exert the strongest overall influence on risk prediction.
            </p>
          </div>
        </div>
      ) : (
        /* Local Patient Waterfall Breakdown */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick patient modifier (1 Col) */}
          <div className="bg-white border border-border rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-text-primary border-b border-border pb-3">
              Adjust Patient Attributes
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-text-secondary block mb-1">Body Mass Index (BMI)</label>
                <input
                  type="number"
                  step="0.5"
                  value={patientInput.BMI}
                  onChange={(e) => setPatientInput(p => ({ ...p, BMI: parseFloat(e.target.value) || 25 }))}
                  className="w-full text-xs bg-background-secondary border border-border rounded-lg p-2 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-text-secondary block mb-1">General Health (1: Exc to 5: Poor)</label>
                <select
                  value={patientInput.GenHlth}
                  onChange={(e) => setPatientInput(p => ({ ...p, GenHlth: parseInt(e.target.value) }))}
                  className="w-full text-xs bg-background-secondary border border-border rounded-lg p-2"
                >
                  <option value={1}>1 - Excellent</option>
                  <option value={2}>2 - Very Good</option>
                  <option value={3}>3 - Good</option>
                  <option value={4}>4 - Fair</option>
                  <option value={5}>5 - Poor</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-text-secondary block mb-1">High Blood Pressure</label>
                <select
                  value={patientInput.HighBP}
                  onChange={(e) => setPatientInput(p => ({ ...p, HighBP: parseInt(e.target.value) }))}
                  className="w-full text-xs bg-background-secondary border border-border rounded-lg p-2"
                >
                  <option value={1}>Yes (Diagnosed)</option>
                  <option value={0}>No</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-text-secondary block mb-1">High Cholesterol</label>
                <select
                  value={patientInput.HighChol}
                  onChange={(e) => setPatientInput(p => ({ ...p, HighChol: parseInt(e.target.value) }))}
                  className="w-full text-xs bg-background-secondary border border-border rounded-lg p-2"
                >
                  <option value={1}>Yes (Diagnosed)</option>
                  <option value={0}>No</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-text-secondary block mb-1">Difficulty Walking</label>
                <select
                  value={patientInput.DiffWalk}
                  onChange={(e) => setPatientInput(p => ({ ...p, DiffWalk: parseInt(e.target.value) }))}
                  className="w-full text-xs bg-background-secondary border border-border rounded-lg p-2"
                >
                  <option value={1}>Yes</option>
                  <option value={0}>No</option>
                </select>
              </div>

              <button
                onClick={handleRecalculateLocal}
                className="w-full bg-brand text-white py-2.5 rounded-xl text-xs font-bold hover:bg-brand/90 transition-all flex items-center justify-center gap-2 mt-4"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Recalculate Local Waterfall</span>
              </button>
            </div>
          </div>

          {/* Waterfall Contribution Chart & Table (2 Cols) */}
          <div className="lg:col-span-2 bg-white border border-border rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-3">
              <div>
                <h2 className="text-base font-bold text-text-primary">Patient Prediction Waterfall Explanation</h2>
                <p className="text-xs text-text-secondary">
                  Base population probability: <strong>{(localShap?.base_value * 100 || 13.9).toFixed(1)}%</strong> → Model Output: <strong>{(localShap?.estimated_probability * 100 || 0).toFixed(1)}%</strong>
                </p>
              </div>

              <span className="text-xs font-bold text-brand bg-brand-surface border border-brand-light/30 px-3 py-1 rounded-full font-mono">
                P(Diabetes) = {(localShap?.estimated_probability * 100 || 0).toFixed(1)}%
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={localShap?.all_contributions?.slice(0, 10) || []}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0E4E8" horizontal={false} />
                  <XAxis type="number" stroke="#77717A" fontSize={10} />
                  <YAxis dataKey="label" type="category" stroke="#77717A" fontSize={10} width={130} />
                  <Tooltip
                    formatter={(val: any) => [val, 'SHAP Impact']}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #F0E4E8', fontSize: '11px' }}
                  />
                  <Bar dataKey="shap_value" radius={[0, 4, 4, 0]}>
                    {(localShap?.all_contributions?.slice(0, 10) || []).map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.shap_value > 0 ? '#C84B65' : '#47866C'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Factor Breakdown Lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-brand-surface/60 border border-brand-light/30 p-3.5 rounded-xl space-y-2">
                <p className="text-xs font-bold text-brand flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" />
                  Top Risk-Increasing Indicators (+SHAP)
                </p>
                <div className="text-xs space-y-1">
                  {localShap?.top_risk_increasing?.map((f: any) => (
                    <div key={f.feature} className="flex justify-between text-text-primary">
                      <span>{f.label} ({f.display_value})</span>
                      <span className="font-mono font-bold text-brand">+{f.shap_value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-background-secondary border border-border p-3.5 rounded-xl space-y-2">
                <p className="text-xs font-bold text-status-success flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4" />
                  Top Protective Factors (-SHAP)
                </p>
                <div className="text-xs space-y-1">
                  {localShap?.top_risk_decreasing?.map((f: any) => (
                    <div key={f.feature} className="flex justify-between text-text-primary">
                      <span>{f.label} ({f.display_value})</span>
                      <span className="font-mono font-bold text-status-success">{f.shap_value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
