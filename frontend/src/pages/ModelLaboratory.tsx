import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  BarChart2,
  Sliders,
  Check
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { api } from '../services/api';
import { ModelSummary, ModelMetrics } from '../types';

export const ModelLaboratory: React.FC = () => {
  const [models, setModels] = useState<ModelSummary[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics | null>(null);
  
  // Training form state
  const [modelType, setModelType] = useState<string>('lightgbm');
  const [datasetId, setDatasetId] = useState<string>('binary');
  const [nEstimators, setNEstimators] = useState<number>(100);
  const [maxDepth, setMaxDepth] = useState<number>(6);
  const [learningRate, setLearningRate] = useState<number>(0.1);
  const [balancedWeights, setBalancedWeights] = useState<boolean>(true);
  
  // Job runner state
  const [trainingJobId, setTrainingJobId] = useState<string | null>(null);
  const [trainingStatus, setTrainingStatus] = useState<any>(null);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'roc' | 'pr' | 'calibration' | 'matrix'>('roc');

  useEffect(() => {
    loadModels();
  }, []);

  useEffect(() => {
    if (selectedModelId) {
      api.getModelMetrics(selectedModelId).then((res) => {
        setModelMetrics(res.test_metrics);
      }).catch(console.error);
    }
  }, [selectedModelId]);

  // Poll training job
  useEffect(() => {
    if (!trainingJobId || !isTraining) return;
    const interval = setInterval(async () => {
      try {
        const job = await api.getTrainingStatus(trainingJobId);
        setTrainingStatus(job);
        if (job.status === 'completed' || job.status === 'failed') {
          setIsTraining(false);
          loadModels();
        }
      } catch (err) {
        console.error(err);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [trainingJobId, isTraining]);

  const loadModels = async () => {
    try {
      const list = await api.getModels();
      setModels(list);
      if (list.length > 0 && !selectedModelId) {
        const active = list.find(m => m.is_active) || list[0];
        setSelectedModelId(active.model_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartTraining = async () => {
    setIsTraining(true);
    setTrainingStatus(null);
    try {
      const res = await api.startTraining({
        model_type: modelType,
        dataset_id: datasetId,
        hyperparameters: {
          n_estimators: nEstimators,
          max_depth: maxDepth,
          learning_rate: learningRate,
          balanced_weights: balancedWeights,
          random_state: 42
        }
      });
      setTrainingJobId(res.job_id);
    } catch (err) {
      console.error(err);
      setIsTraining(false);
    }
  };

  const handleActivateModel = async (id: string) => {
    try {
      await api.activateModel(id);
      loadModels();
    } catch (err) {
      console.error(err);
    }
  };

  const selectedModel = models.find(m => m.model_id === selectedModelId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-border rounded-2xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-brand-surface border border-brand-light/30 px-3 py-1 rounded-full text-xs font-semibold text-brand mb-2">
            <FlaskConical className="w-3.5 h-3.5" />
            Machine Learning Evaluation & Calibration
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Model Laboratory</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Train, tune, and evaluate classification models on held-out test data. Select models using validation data; test sets are reserved strictly for unbiased final evaluation.
          </p>
        </div>
      </div>

      {/* Training Configuration Panel */}
      <div className="bg-white border border-border rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
          <Sliders className="w-4 h-4 text-brand" />
          <span>Launch Algorithm Training Experiment</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Model Type */}
          <div>
            <label className="text-xs font-semibold text-text-primary block mb-1">Algorithm</label>
            <select
              value={modelType}
              onChange={(e) => setModelType(e.target.value)}
              className="w-full text-xs bg-background-secondary border border-border rounded-xl px-3 py-2 font-medium text-text-primary focus:outline-none focus:border-brand"
            >
              <option value="lightgbm">LightGBM (Gradient Boosted Trees)</option>
              <option value="xgboost">XGBoost (Extreme Gradient Boosting)</option>
              <option value="random_forest">Random Forest (Ensemble Bagging)</option>
              <option value="logistic_regression">Logistic Regression (L2 Regularized)</option>
            </select>
          </div>

          {/* Dataset */}
          <div>
            <label className="text-xs font-semibold text-text-primary block mb-1">Dataset Partition</label>
            <select
              value={datasetId}
              onChange={(e) => setDatasetId(e.target.value)}
              className="w-full text-xs bg-background-secondary border border-border rounded-xl px-3 py-2 font-medium text-text-primary focus:outline-none focus:border-brand"
            >
              <option value="binary">Primary Binary (253,680 records)</option>
              <option value="balanced_binary">Balanced 50/50 Binary (70,692 records)</option>
            </select>
          </div>

          {/* Trees / Estimators */}
          <div>
            <label className="text-xs font-semibold text-text-primary block mb-1">
              {modelType === 'logistic_regression' ? 'Max Iterations' : 'Number of Trees / Estimators'}
            </label>
            <input
              type="number"
              min="10"
              max="500"
              value={nEstimators}
              onChange={(e) => setNEstimators(parseInt(e.target.value) || 100)}
              className="w-full text-xs bg-background-secondary border border-border rounded-xl px-3 py-2 font-mono text-text-primary focus:outline-none focus:border-brand"
            />
          </div>

          {/* Max Depth / LR */}
          <div>
            <label className="text-xs font-semibold text-text-primary block mb-1">
              {modelType === 'logistic_regression' ? 'Regularization C' : 'Max Tree Depth'}
            </label>
            <input
              type="number"
              min="2"
              max="30"
              value={maxDepth}
              onChange={(e) => setMaxDepth(parseInt(e.target.value) || 6)}
              className="w-full text-xs bg-background-secondary border border-border rounded-xl px-3 py-2 font-mono text-text-primary focus:outline-none focus:border-brand"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-border">
          <label className="flex items-center gap-2 text-xs text-text-primary cursor-pointer">
            <input
              type="checkbox"
              checked={balancedWeights}
              onChange={(e) => setBalancedWeights(e.target.checked)}
              className="rounded accent-brand w-4 h-4"
            />
            <span className="font-medium">Apply Inverse Class Weighting (Mitigate 6.18:1 Imbalance)</span>
          </label>

          <button
            onClick={handleStartTraining}
            disabled={isTraining}
            className="bg-brand text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-brand/90 transition-all shadow-xs flex items-center gap-2 disabled:opacity-50"
          >
            {isTraining ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>Training in Background ({trainingStatus?.progress || 0}%)...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Start Model Training</span>
              </>
            )}
          </button>
        </div>

        {/* Real-time Training Progress & Logs */}
        {trainingStatus && (
          <div className="mt-3 p-4 rounded-xl bg-background-secondary border border-border space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-text-primary">
                Job: {trainingStatus.id} ({trainingStatus.type})
              </span>
              <span className={`font-semibold capitalize ${trainingStatus.status === 'completed' ? 'text-status-success' : 'text-brand'}`}>
                {trainingStatus.status}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-border rounded-full overflow-hidden">
              <div
                style={{ width: `${trainingStatus.progress}%` }}
                className="h-full bg-brand transition-all duration-300"
              />
            </div>

            <div className="text-[11px] font-mono text-text-secondary max-h-24 overflow-y-auto space-y-0.5">
              {trainingStatus.logs?.map((log: string, idx: number) => (
                <div key={idx}>• {log}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Trained Models Comparison Table */}
      <div className="bg-white border border-border rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-base font-bold text-text-primary">Model Registry & Empirical Benchmark Leaderboard</h2>
            <p className="text-xs text-text-secondary">Measured on 15% held-out test partition (38,052 observations)</p>
          </div>
          <span className="text-xs text-text-secondary font-medium">
            {models.length} Model{models.length === 1 ? '' : 's'} Registered
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-text-secondary bg-background-secondary/50">
                <th className="py-2.5 px-3 font-semibold">Model ID</th>
                <th className="py-2.5 px-3 font-semibold">Algorithm</th>
                <th className="py-2.5 px-3 font-semibold text-right">Test ROC-AUC</th>
                <th className="py-2.5 px-3 font-semibold text-right">PR-AUC</th>
                <th className="py-2.5 px-3 font-semibold text-right">Recall (Sens)</th>
                <th className="py-2.5 px-3 font-semibold text-right">Precision</th>
                <th className="py-2.5 px-3 font-semibold text-right">F1-Score</th>
                <th className="py-2.5 px-3 font-semibold text-right">Brier Score</th>
                <th className="py-2.5 px-3 font-semibold text-right">Latency</th>
                <th className="py-2.5 px-3 font-semibold text-center">Status / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {models.map((m) => {
                const isSelected = m.model_id === selectedModelId;
                return (
                  <tr
                    key={m.model_id}
                    onClick={() => setSelectedModelId(m.model_id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-brand-surface/60 font-medium' : 'hover:bg-background-secondary/40'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono text-brand font-medium">
                      {m.model_id}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-text-primary uppercase">
                      {m.model_type}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-brand">
                      {m.test_roc_auc?.toFixed(4)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {m.test_pr_auc?.toFixed(4)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {m.test_recall ? `${(m.test_recall * 100).toFixed(1)}%` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {m.test_precision ? `${(m.test_precision * 100).toFixed(1)}%` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold">
                      {m.test_f1?.toFixed(4)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {m.test_brier?.toFixed(4)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-text-secondary">
                      {m.inference_latency_ms} ms
                    </td>
                    <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      {m.is_active ? (
                        <span className="inline-flex items-center gap-1 bg-status-success/10 text-status-success font-semibold px-2 py-0.5 rounded-full text-[10px] border border-status-success/30">
                          <Check className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <button
                          onClick={() => handleActivateModel(m.model_id)}
                          className="text-[10px] bg-background-secondary hover:bg-brand-surface text-text-primary hover:text-brand px-2 py-0.5 rounded border border-border"
                        >
                          Activate
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Model Deep-Dive: ROC, PR, Calibration, and Confusion Matrix */}
      {selectedModel && modelMetrics && (
        <div className="bg-white border border-border rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-3">
            <div>
              <h2 className="text-base font-bold text-text-primary">
                Model Evaluation: <span className="text-brand font-mono">{selectedModel.model_id}</span> ({selectedModel.model_type.toUpperCase()})
              </h2>
              <p className="text-xs text-text-secondary">
                Calibration curves, ROC analysis, and confusion matrices
              </p>
            </div>

            {/* Sub-tabs */}
            <div className="flex bg-background-secondary p-1 rounded-xl border border-border">
              <button
                onClick={() => setActiveTab('roc')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'roc' ? 'bg-white text-brand shadow-xs border border-brand-light/40' : 'text-text-secondary'
                }`}
              >
                ROC Curve (AUC: {modelMetrics.roc_auc.toFixed(4)})
              </button>
              <button
                onClick={() => setActiveTab('pr')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'pr' ? 'bg-white text-brand shadow-xs border border-brand-light/40' : 'text-text-secondary'
                }`}
              >
                Precision-Recall Curve (PR-AUC: {modelMetrics.pr_auc.toFixed(4)})
              </button>
              <button
                onClick={() => setActiveTab('calibration')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'calibration' ? 'bg-white text-brand shadow-xs border border-brand-light/40' : 'text-text-secondary'
                }`}
              >
                Calibration Curve (Brier: {modelMetrics.brier_score.toFixed(4)})
              </button>
              <button
                onClick={() => setActiveTab('matrix')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'matrix' ? 'bg-white text-brand shadow-xs border border-brand-light/40' : 'text-text-secondary'
                }`}
              >
                Confusion Matrix
              </button>
            </div>
          </div>

          {/* Chart Content Area */}
          <div className="p-2">
            {activeTab === 'roc' && (
              <div className="space-y-2">
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={modelMetrics.roc_curve} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0E4E8" />
                      <XAxis dataKey="fpr" type="number" domain={[0, 1]} stroke="#77717A" fontSize={11} label={{ value: 'False Positive Rate (1 - Specificity)', position: 'insideBottom', offset: -10, fontSize: 11 }} />
                      <YAxis dataKey="tpr" type="number" domain={[0, 1]} stroke="#77717A" fontSize={11} label={{ value: 'True Positive Rate (Sensitivity)', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #F0E4E8', fontSize: '11px' }} />
                      <Line type="monotone" dataKey="tpr" stroke="#C84B65" strokeWidth={2.5} dot={false} name="Model ROC" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-center text-xs text-text-secondary">
                  ROC-AUC measures discrimination across all decision cutoffs. Diagonal represents no-skill random guessing.
                </p>
              </div>
            )}

            {activeTab === 'pr' && (
              <div className="space-y-2">
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={modelMetrics.pr_curve} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0E4E8" />
                      <XAxis dataKey="recall" type="number" domain={[0, 1]} stroke="#77717A" fontSize={11} label={{ value: 'Recall (Sensitivity)', position: 'insideBottom', offset: -10, fontSize: 11 }} />
                      <YAxis dataKey="precision" type="number" domain={[0, 1]} stroke="#77717A" fontSize={11} label={{ value: 'Precision (Positive Predictive Value)', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #F0E4E8', fontSize: '11px' }} />
                      <Line type="monotone" dataKey="precision" stroke="#C84B65" strokeWidth={2.5} dot={false} name="Precision-Recall" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-center text-xs text-text-secondary">
                  Precision-Recall curve illustrates clinical utility under class imbalance (13.9% population prevalence).
                </p>
              </div>
            )}

            {activeTab === 'calibration' && (
              <div className="space-y-2">
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={modelMetrics.calibration_curve} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0E4E8" />
                      <XAxis dataKey="pred_prob" type="number" domain={[0, 1]} stroke="#77717A" fontSize={11} label={{ value: 'Mean Predicted Probability', position: 'insideBottom', offset: -10, fontSize: 11 }} />
                      <YAxis dataKey="true_prob" type="number" domain={[0, 1]} stroke="#77717A" fontSize={11} label={{ value: 'Observed Fraction of Positives', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #F0E4E8', fontSize: '11px' }} />
                      <Legend />
                      <Line type="monotone" dataKey="true_prob" stroke="#C84B65" strokeWidth={2.5} name="Observed Calibration" />
                      <Line type="monotone" dataKey="perfect" stroke="#77717A" strokeDasharray="5 5" strokeWidth={1.5} dot={false} name="Perfect Calibration" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-center text-xs text-text-secondary">
                  Calibration curves assess whether model probability scores correspond to observed empirical prevalence.
                </p>
              </div>
            )}

            {activeTab === 'matrix' && (
              <div className="max-w-md mx-auto py-4 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-background-secondary border border-border p-5 rounded-2xl">
                    <p className="text-xs font-semibold text-text-secondary">True Negatives (TN)</p>
                    <p className="text-2xl font-extrabold text-status-success mt-1 font-mono">
                      {modelMetrics.confusion_matrix.tn.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-text-secondary mt-0.5">Correctly Classified Non-Diabetic</p>
                  </div>
                  <div className="bg-brand-surface border border-brand-light/30 p-5 rounded-2xl">
                    <p className="text-xs font-semibold text-brand">False Positives (FP)</p>
                    <p className="text-2xl font-extrabold text-brand mt-1 font-mono">
                      {modelMetrics.confusion_matrix.fp.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-text-secondary mt-0.5">Non-Diabetic Flagged as High-Risk</p>
                  </div>
                  <div className="bg-brand-surface border border-brand-light/30 p-5 rounded-2xl">
                    <p className="text-xs font-semibold text-brand">False Negatives (FN)</p>
                    <p className="text-2xl font-extrabold text-brand mt-1 font-mono">
                      {modelMetrics.confusion_matrix.fn.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-text-secondary mt-0.5">Missed Diabetic Cases</p>
                  </div>
                  <div className="bg-background-secondary border border-border p-5 rounded-2xl">
                    <p className="text-xs font-semibold text-text-secondary">True Positives (TP)</p>
                    <p className="text-2xl font-extrabold text-status-success mt-1 font-mono">
                      {modelMetrics.confusion_matrix.tp.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-text-secondary mt-0.5">Correctly Identified Diabetes</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                  <div className="flex justify-between border-b border-border py-1">
                    <span className="text-text-secondary">Sensitivity (TPR):</span>
                    <span className="font-bold text-text-primary">{(modelMetrics.sensitivity * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between border-b border-border py-1">
                    <span className="text-text-secondary">Specificity (TNR):</span>
                    <span className="font-bold text-text-primary">{(modelMetrics.specificity * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
