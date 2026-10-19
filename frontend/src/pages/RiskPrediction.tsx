import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  Upload,
  User,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Download,
  Info,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { ModelSummary } from '../types';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

export const RiskPrediction: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');
  const [models, setModels] = useState<ModelSummary[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  
  // Single record form inputs with realistic BRFSS defaults
  const [formData, setFormData] = useState<Record<string, number>>({
    HighBP: 1,
    HighChol: 1,
    CholCheck: 1,
    BMI: 29.5,
    Smoker: 0,
    Stroke: 0,
    HeartDiseaseorAttack: 0,
    PhysActivity: 1,
    Fruits: 1,
    Veggies: 1,
    HvyAlcoholConsump: 0,
    AnyHealthcare: 1,
    NoDocbcCost: 0,
    GenHlth: 3,
    MentHlth: 2,
    PhysHlth: 3,
    DiffWalk: 0,
    Sex: 1,
    Age: 8,
    Education: 5,
    Income: 6
  });

  const [predictionResult, setPredictionResult] = useState<any>(null);
  const [isPredicting, setIsPredicting] = useState<boolean>(false);
  
  // Batch state
  const [batchFile, setBatchFile] = useState<File | null>(null);
  const [batchResult, setBatchResult] = useState<any>(null);
  const [batchLoading, setBatchLoading] = useState<boolean>(false);
  const [batchError, setBatchError] = useState<string | null>(null);

  useEffect(() => {
    api.getModels().then((list) => {
      setModels(list);
      const active = list.find(m => m.is_active) || list[0];
      if (active) setSelectedModelId(active.model_id);
    }).catch(console.error);
  }, []);

  const handleInputChange = (field: string, val: number) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleSinglePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPredicting(true);
    try {
      const res = await api.predictSingle({
        model_id: selectedModelId || undefined,
        features: formData
      });
      setPredictionResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPredicting(false);
    }
  };

  const handleBatchUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchFile) return;
    setBatchLoading(true);
    setBatchError(null);
    try {
      const fd = new FormData();
      fd.append('file', batchFile);
      if (selectedModelId) fd.append('model_id', selectedModelId);
      const res = await api.predictBatch(fd);
      setBatchResult(res);
    } catch (err: any) {
      setBatchError(err.message || 'Batch prediction failed');
    } finally {
      setBatchLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <DisclaimerBanner />

      {/* Header */}
      <div className="bg-white border border-border rounded-2xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-brand-surface border border-brand-light/30 px-3 py-1 rounded-full text-xs font-semibold text-brand mb-2">
            <HeartPulse className="w-3.5 h-3.5" />
            Empirical Risk Inference Engine
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Risk Prediction & Stratification</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Estimate individual patient risk or process population cohort batches using calibrated production models.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex bg-background-secondary p-1 rounded-xl border border-border">
          <button
            onClick={() => setActiveTab('single')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'single' ? 'bg-white text-brand shadow-xs border border-brand-light/40' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Single Patient Profile</span>
          </button>
          <button
            onClick={() => setActiveTab('batch')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'batch' ? 'bg-white text-brand shadow-xs border border-brand-light/40' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Batch Population CSV</span>
          </button>
        </div>
      </div>

      {/* Model Selection Bar */}
      <div className="bg-white border border-border rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-text-primary">Inference Model:</span>
          <select
            value={selectedModelId}
            onChange={(e) => setSelectedModelId(e.target.value)}
            className="text-xs bg-background-secondary border border-border rounded-lg px-3 py-1.5 font-medium text-text-primary focus:outline-none focus:border-brand"
          >
            {models.map(m => (
              <option key={m.model_id} value={m.model_id}>
                {m.model_type.toUpperCase()} — {m.model_id} (AUC: {m.test_roc_auc?.toFixed(4)}) {m.is_active ? '★ ACTIVE' : ''}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-text-secondary">
          Input features will be transformed using the model's locked StandardScaler pipeline.
        </span>
      </div>

      {activeTab === 'single' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form (2 Cols) */}
          <form onSubmit={handleSinglePredict} className="lg:col-span-2 bg-white border border-border rounded-2xl p-6 shadow-xs space-y-6">
            {/* Section 1: Clinical & Physiological */}
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider text-brand border-b border-border pb-1.5">
                1. Clinical & Physiological Indicators
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-text-secondary block mb-1">High Blood Pressure</label>
                  <select
                    value={formData.HighBP}
                    onChange={(e) => handleInputChange('HighBP', parseInt(e.target.value))}
                    className="w-full text-xs bg-background-secondary border border-border rounded-lg p-2 text-text-primary"
                  >
                    <option value={0}>No</option>
                    <option value={1}>Yes (Diagnosed)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-text-secondary block mb-1">High Cholesterol</label>
                  <select
                    value={formData.HighChol}
                    onChange={(e) => handleInputChange('HighChol', parseInt(e.target.value))}
                    className="w-full text-xs bg-background-secondary border border-border rounded-lg p-2 text-text-primary"
                  >
                    <option value={0}>No</option>
                    <option value={1}>Yes (Diagnosed)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-text-secondary block mb-1">Cholesterol Checked (5 yrs)</label>
                  <select
                    value={formData.CholCheck}
                    onChange={(e) => handleInputChange('CholCheck', parseInt(e.target.value))}
                    className="w-full text-xs bg-background-secondary border border-border rounded-lg p-2 text-text-primary"
                  >
                    <option value={1}>Yes</option>
                    <option value={0}>No</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-text-secondary block mb-1">Body Mass Index (BMI)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="12"
                    max="98"
                    value={formData.BMI}
                    onChange={(e) => handleInputChange('BMI', parseFloat(e.target.value) || 25)}
                    className="w-full text-xs bg-background-secondary border border-border rounded-lg p-2 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-text-secondary block mb-1">History of Stroke</label>
                  <select
                    value={formData.Stroke}
                    onChange={(e) => handleInputChange('Stroke', parseInt(e.target.value))}
                    className="w-full text-xs bg-background-secondary border border-border rounded-lg p-2 text-text-primary"
                  >
                    <option value={0}>No</option>
                    <option value={1}>Yes</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-text-secondary block mb-1">Coronary Heart Disease (MI)</label>
                  <select
                    value={formData.HeartDiseaseorAttack}
                    onChange={(e) => handleInputChange('HeartDiseaseorAttack', parseInt(e.target.value))}
                    className="w-full text-xs bg-background-secondary border border-border rounded-lg p-2 text-text-primary"
                  >
                    <option value={0}>No</option>
                    <option value={1}>Yes</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-text-secondary block mb-1">General Health Self-Rating</label>
                  <select
                    value={formData.GenHlth}
                    onChange={(e) => handleInputChange('GenHlth', parseInt(e.target.value))}
                    className="w-full text-xs bg-background-secondary border border-border rounded-lg p-2 text-text-primary"
                  >
                    <option value={1}>1 - Excellent</option>
                    <option value={2}>2 - Very Good</option>
                    <option value={3}>3 - Good</option>
                    <option value={4}>4 - Fair</option>
                    <option value={5}>5 - Poor</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-text-secondary block mb-1">Poor Physical Health (Days 0-30)</label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={formData.PhysHlth}
                    onChange={(e) => handleInputChange('PhysHlth', parseInt(e.target.value) || 0)}
                    className="w-full text-xs bg-background-secondary border border-border rounded-lg p-2 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-text-secondary block mb-1">Difficulty Walking / Stairs</label>
                  <select
                    value={formData.DiffWalk}
                    onChange={(e) => handleInputChange('DiffWalk', parseInt(e.target.value))}
                    className="w-full text-xs bg-background-secondary border border-border rounded-lg p-2 text-text-primary"
                  >
                    <option value={0}>No</option>
                    <option value={1}>Yes</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Behavioral & Lifestyle */}
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider text-brand border-b border-border pb-1.5">
                2. Lifestyle & Behavioral Factors
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-text-secondary block mb-1">Smoker (100+ Cigarettes)</label>
                  <select
                    value={formData.Smoker}
                    onChange={(e) => handleInputChange('Smoker', parseInt(e.target.value))}
                    className="w-full text-xs bg-background-secondary border border-border rounded-lg p-2 text-text-primary"
                  >
                    <option value={0}>No</option>
                    <option value={1}>Yes</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-text-secondary block mb-1">Physical Activity (Past 30 Days)</label>
                  <select
                    value={formData.PhysActivity}
                    onChange={(e) => handleInputChange('PhysActivity', parseInt(e.target.value))}
                    className="w-full text-xs bg-background-secondary border border-border rounded-lg p-2 text-text-primary"
                  >
                    <option value={1}>Yes</option>
                    <option value={0}>No</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-text-secondary block mb-1">Consumes Fruit 1+ Times/Day</label>
                  <select
                    value={formData.Fruits}
                    onChange={(e) => handleInputChange('Fruits', parseInt(e.target.value))}
                    className="w-full text-xs bg-background-secondary border border-border rounded-lg p-2 text-text-primary"
                  >
                    <option value={1}>Yes</option>
                    <option value={0}>No</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-text-secondary block mb-1">Consumes Veggies 1+ Times/Day</label>
                  <select
                    value={formData.Veggies}
                    onChange={(e) => handleInputChange('Veggies', parseInt(e.target.value))}
                    className="w-full text-xs bg-background-secondary border border-border rounded-lg p-2 text-text-primary"
                  >
                    <option value={1}>Yes</option>
                    <option value={0}>No</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-text-secondary block mb-1">Heavy Alcohol Consumption</label>
                  <select
                    value={formData.HvyAlcoholConsump}
                    onChange={(e) => handleInputChange('HvyAlcoholConsump', parseInt(e.target.value))}
                    className="w-full text-xs bg-background-secondary border border-border rounded-lg p-2 text-text-primary"
                  >
                    <option value={0}>No</option>
                    <option value={1}>Yes (&gt;14 drinks men / &gt;7 women)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-text-secondary block mb-1">Poor Mental Health (Days 0-30)</label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={formData.MentHlth}
                    onChange={(e) => handleInputChange('MentHlth', parseInt(e.target.value) || 0)}
                    className="w-full text-xs bg-background-secondary border border-border rounded-lg p-2 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Socio-demographic & Access */}
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider text-brand border-b border-border pb-1.5">
                3. Socio-Demographic & Healthcare Access
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-text-secondary block mb-1">Biological Sex</label>
                  <select
                    value={formData.Sex}
                    onChange={(e) => handleInputChange('Sex', parseInt(e.target.value))}
                    className="w-full text-xs bg-background-secondary border border-border rounded-lg p-2 text-text-primary"
                  >
                    <option value={0}>Female</option>
                    <option value={1}>Male</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-text-secondary block mb-1">Age Category (BRFSS 1-13)</label>
                  <select
                    value={formData.Age}
                    onChange={(e) => handleInputChange('Age', parseInt(e.target.value))}
                    className="w-full text-xs bg-background-secondary border border-border rounded-lg p-2 text-text-primary"
                  >
                    <option value={1}>1: 18 to 24</option>
                    <option value={2}>2: 25 to 29</option>
                    <option value={3}>3: 30 to 34</option>
                    <option value={4}>4: 35 to 39</option>
                    <option value={5}>5: 40 to 44</option>
                    <option value={6}>6: 45 to 49</option>
                    <option value={7}>7: 50 to 54</option>
                    <option value={8}>8: 55 to 59</option>
                    <option value={9}>9: 60 to 64</option>
                    <option value={10}>10: 65 to 69</option>
                    <option value={11}>11: 70 to 74</option>
                    <option value={12}>12: 75 to 79</option>
                    <option value={13}>13: 80 or older</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-text-secondary block mb-1">Education Level (1-6)</label>
                  <select
                    value={formData.Education}
                    onChange={(e) => handleInputChange('Education', parseInt(e.target.value))}
                    className="w-full text-xs bg-background-secondary border border-border rounded-lg p-2 text-text-primary"
                  >
                    <option value={1}>1: Never attended / Kindergarten</option>
                    <option value={2}>2: Elementary</option>
                    <option value={3}>3: Some High School</option>
                    <option value={4}>4: High School Graduate</option>
                    <option value={5}>5: Some College / Technical</option>
                    <option value={6}>6: College Graduate (4+ yrs)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-text-secondary block mb-1">Income Bracket (1-8)</label>
                  <select
                    value={formData.Income}
                    onChange={(e) => handleInputChange('Income', parseInt(e.target.value))}
                    className="w-full text-xs bg-background-secondary border border-border rounded-lg p-2 text-text-primary"
                  >
                    <option value={1}>1: &lt; $10,000</option>
                    <option value={2}>2: $10,000 to &lt; $15,000</option>
                    <option value={3}>3: $15,000 to &lt; $20,000</option>
                    <option value={4}>4: $20,000 to &lt; $25,000</option>
                    <option value={5}>5: $25,000 to &lt; $35,000</option>
                    <option value={6}>6: $35,000 to &lt; $50,000</option>
                    <option value={7}>7: $50,000 to &lt; $75,000</option>
                    <option value={8}>8: $75,000 or more</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-text-secondary block mb-1">Has Healthcare Coverage</label>
                  <select
                    value={formData.AnyHealthcare}
                    onChange={(e) => handleInputChange('AnyHealthcare', parseInt(e.target.value))}
                    className="w-full text-xs bg-background-secondary border border-border rounded-lg p-2 text-text-primary"
                  >
                    <option value={1}>Yes</option>
                    <option value={0}>No</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-text-secondary block mb-1">Could Not Afford Doctor (12 mo)</label>
                  <select
                    value={formData.NoDocbcCost}
                    onChange={(e) => handleInputChange('NoDocbcCost', parseInt(e.target.value))}
                    className="w-full text-xs bg-background-secondary border border-border rounded-lg p-2 text-text-primary"
                  >
                    <option value={0}>No</option>
                    <option value={1}>Yes</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPredicting}
              className="w-full bg-brand text-white py-3 rounded-xl text-xs font-bold hover:bg-brand/90 transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <HeartPulse className="w-4 h-4" />
              <span>{isPredicting ? 'Computing Calibrated Risk...' : 'Calculate Model-Estimated Diabetes Risk'}</span>
            </button>
          </form>

          {/* Results Card (1 Col) */}
          <div className="bg-white border border-border rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <h2 className="text-base font-bold text-text-primary border-b border-border pb-3">
                Risk Assessment Outcome
              </h2>

              {predictionResult ? (
                <div className="space-y-5 mt-4">
                  {/* Gauge Metric */}
                  <div className="text-center bg-background-secondary p-5 rounded-2xl border border-border">
                    <p className="text-xs font-medium text-text-secondary">Estimated Diabetes Posterior Odds</p>
                    <p className="text-4xl font-extrabold text-brand font-mono mt-1">
                      {predictionResult.estimated_percentage}%
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Probability: {predictionResult.estimated_probability}
                    </p>

                    {/* Progress Bar */}
                    <div className="w-full h-3 bg-border rounded-full overflow-hidden mt-3">
                      <div
                        style={{ width: `${predictionResult.estimated_percentage}%` }}
                        className="h-full bg-brand transition-all duration-500"
                      />
                    </div>
                  </div>

                  {/* Tier Badge & Clinical Action Guidance */}
                  <div className="p-4 rounded-xl border border-border bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-secondary">Assigned Stratification:</span>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        predictionResult.risk_stratification.tier_id === 'higher'
                          ? 'bg-brand-paleRed text-brand border border-brand-light/30'
                          : predictionResult.risk_stratification.tier_id === 'intermediate'
                          ? 'bg-status-warning/10 text-status-warning border border-status-warning/30'
                          : 'bg-status-success/10 text-status-success border border-status-success/30'
                      }`}>
                        {predictionResult.risk_stratification.tier_name}
                      </span>
                    </div>

                    <div className="text-xs text-text-secondary pt-2 border-t border-border">
                      <span className="font-semibold text-text-primary block mb-1">Protocol Recommendation:</span>
                      {predictionResult.risk_stratification.action_guidance}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-text-secondary space-y-2">
                  <HeartPulse className="w-8 h-8 text-brand-light mx-auto" />
                  <p>Submit patient characteristics to compute model-based posterior risk.</p>
                </div>
              )}
            </div>

            <div className="text-[11px] text-text-secondary border-t border-border pt-3">
              Model: <span className="font-mono text-text-primary">{selectedModelId || 'Default'}</span>
            </div>
          </div>
        </div>
      ) : (
        /* Batch Prediction Mode */
        <div className="bg-white border border-border rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-text-primary">Batch Cohort Population Inference</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Upload a CSV file containing BRFSS feature indicators to score up to 25,000 individuals simultaneously.
            </p>
          </div>

          <form onSubmit={handleBatchUpload} className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center space-y-3 bg-background-secondary/30 hover:border-brand-light transition-all">
              <Upload className="w-10 h-10 text-brand mx-auto" />
              <div className="text-xs text-text-secondary">
                <label className="cursor-pointer font-bold text-brand hover:underline">
                  Choose CSV file
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setBatchFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>{' '}
                or drag and drop here
              </div>
              {batchFile && (
                <p className="text-xs font-mono font-bold text-text-primary">
                  Selected: {batchFile.name} ({(batchFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            {batchError && (
              <div className="p-3 rounded-xl bg-status-error/10 border border-status-error/30 text-status-error text-xs">
                {batchError}
              </div>
            )}

            <button
              type="submit"
              disabled={!batchFile || batchLoading}
              className="bg-brand text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-brand/90 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{batchLoading ? 'Processing Cohort Records...' : 'Score Population Batch'}</span>
            </button>
          </form>

          {batchResult && (
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-background-secondary border border-border p-4 rounded-xl">
                  <p className="text-xs text-text-secondary font-medium">Processed Records</p>
                  <p className="text-xl font-bold text-text-primary mt-1">{batchResult.total_records.toLocaleString()}</p>
                </div>
                <div className="bg-background-secondary border border-border p-4 rounded-xl">
                  <p className="text-xs text-text-secondary font-medium">High-Risk Patients Flagged</p>
                  <p className="text-xl font-bold text-brand mt-1">{batchResult.tier_summary['Higher Risk'] || 0}</p>
                </div>
                <div className="bg-background-secondary border border-border p-4 rounded-xl">
                  <p className="text-xs text-text-secondary font-medium">Lower-Risk Patients</p>
                  <p className="text-xl font-bold text-status-success mt-1">{batchResult.tier_summary['Lower Risk'] || 0}</p>
                </div>
              </div>

              {/* Preview Table */}
              <div className="overflow-x-auto border border-border rounded-xl">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-border text-text-secondary bg-background-secondary/50">
                      <th className="py-2.5 px-3">Age</th>
                      <th className="py-2.5 px-3">BMI</th>
                      <th className="py-2.5 px-3">HighBP</th>
                      <th className="py-2.5 px-3">HighChol</th>
                      <th className="py-2.5 px-3">GenHlth</th>
                      <th className="py-2.5 px-3 text-right">Predicted Prob</th>
                      <th className="py-2.5 px-3 text-center">Stratified Tier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {batchResult.preview?.map((row: any, idx: number) => (
                      <tr key={idx} className="hover:bg-background-secondary/30">
                        <td className="py-2 px-3">{row.Age}</td>
                        <td className="py-2 px-3">{row.BMI}</td>
                        <td className="py-2 px-3">{row.HighBP}</td>
                        <td className="py-2 px-3">{row.HighChol}</td>
                        <td className="py-2 px-3">{row.GenHlth}</td>
                        <td className="py-2 px-3 text-right font-bold text-brand">
                          {(row.Predicted_Diabetes_Probability * 100).toFixed(1)}%
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.Stratified_Risk_Tier === 'Higher Risk'
                              ? 'bg-brand-paleRed text-brand'
                              : row.Stratified_Risk_Tier === 'Intermediate Risk'
                              ? 'bg-status-warning/10 text-status-warning'
                              : 'bg-status-success/10 text-status-success'
                          }`}>
                            {row.Stratified_Risk_Tier}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
