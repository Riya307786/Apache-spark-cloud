import React, { useState, useEffect } from 'react';
import {
  Filter,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Play,
  RotateCcw,
  Sliders,
  FileDown,
  Layers,
  Database
} from 'lucide-react';
import { api } from '../services/api';
import { DatasetSummary } from '../types';

export const DataPreparation: React.FC = () => {
  const [datasetId, setDatasetId] = useState<string>('binary');
  const [trainRatio, setTrainRatio] = useState<number>(0.70);
  const [valRatio, setValRatio] = useState<number>(0.15);
  const [testRatio, setTestRatio] = useState<number>(0.15);
  const [randomSeed, setRandomSeed] = useState<number>(42);
  const [removeDuplicates, setRemoveDuplicates] = useState<boolean>(false);
  const [scaleFeatures, setScaleFeatures] = useState<boolean>(true);
  const [summary, setSummary] = useState<DatasetSummary | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [resultMetadata, setResultMetadata] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    api.getDatasetSummary(datasetId).then(setSummary).catch(console.error);
  }, [datasetId]);

  const handleRatioChange = (train: number, val: number) => {
    setTrainRatio(train);
    setValRatio(val);
    setTestRatio(Number((1.0 - train - val).toFixed(2)));
  };

  const handleRunPreprocessing = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const res = await api.runPreprocessing({
        dataset_id: datasetId,
        train_ratio: trainRatio,
        val_ratio: valRatio,
        test_ratio: testRatio,
        random_state: randomSeed,
        remove_duplicates: removeDuplicates,
        scale_features: scaleFeatures
      });
      setResultMetadata(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Preprocessing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-border rounded-2xl p-6 shadow-xs">
        <div className="inline-flex items-center gap-2 bg-brand-surface border border-brand-light/30 px-3 py-1 rounded-full text-xs font-semibold text-brand mb-2">
          <Filter className="w-3.5 h-3.5" />
          Reproducible Split & Leakage-Free Preprocessing
        </div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Data Preparation Pipeline</h1>
        <p className="text-xs text-text-secondary mt-0.5">
          Configure partition splits, feature scaling, and data hygiene. Scalers and feature parameters are fit strictly on training data to prevent leakage.
        </p>
      </div>

      {/* Leakage Prevention Guarantees Banner */}
      <div className="bg-white border-2 border-brand-light/40 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-brand font-bold text-sm">
          <ShieldCheck className="w-5 h-5" />
          <span>Research Integrity & Data Leakage Prevention Protocol</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-text-secondary">
          <div className="bg-background-secondary p-3 rounded-xl border border-border">
            <p className="font-semibold text-text-primary mb-1">1. Isolated Feature Scaling</p>
            <p>StandardScaler is fitted strictly on the training partition (X_train). Validation and test sets are transformed without refitting.</p>
          </div>
          <div className="bg-background-secondary p-3 rounded-xl border border-border">
            <p className="font-semibold text-text-primary mb-1">2. Preserved Test Ground Truth</p>
            <p>Test evaluation partitions remain completely untouched during hyperparameter selection, threshold tuning, and model selection.</p>
          </div>
          <div className="bg-background-secondary p-3 rounded-xl border border-border">
            <p className="font-semibold text-text-primary mb-1">3. Honest Evaluation Protocol</p>
            <p>No synthetic resampling (SMOTE) is applied to validation or test sets. Out-of-fold performance reflects true population prevalence.</p>
          </div>
        </div>
      </div>

      {/* Interactive Controls & Splitting */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Split Parameters Form (2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-border rounded-2xl p-6 shadow-xs space-y-5">
          <h2 className="text-base font-bold text-text-primary border-b border-border pb-3">
            Pipeline Configuration Parameters
          </h2>

          <div className="space-y-4">
            {/* Dataset Selector */}
            <div>
              <label className="text-xs font-semibold text-text-primary block mb-1.5">
                Target Dataset Variant
              </label>
              <select
                value={datasetId}
                onChange={(e) => setDatasetId(e.target.value)}
                className="w-full text-xs bg-background-secondary border border-border rounded-xl px-3 py-2.5 font-medium text-text-primary focus:outline-none focus:border-brand"
              >
                <option value="binary">Primary Binary Classification (253,680 records)</option>
                <option value="multi_class">3-Class Dataset: 0=No, 1=Prediabetes, 2=Diabetes (253,680 records)</option>
                <option value="balanced_binary">Balanced 50/50 Binary Subset (70,692 records)</option>
              </select>
            </div>

            {/* Split Sliders */}
            <div className="space-y-3 bg-background-secondary/50 p-4 rounded-xl border border-border">
              <div className="flex items-center justify-between text-xs font-semibold text-text-primary">
                <span>Partition Split Ratios</span>
                <span className="text-brand font-mono font-bold">
                  {(trainRatio * 100).toFixed(0)}% Train / {(valRatio * 100).toFixed(0)}% Val / {(testRatio * 100).toFixed(0)}% Test
                </span>
              </div>

              {/* Visual Split Bar */}
              <div className="h-3 w-full rounded-full overflow-hidden flex bg-border">
                <div style={{ width: `${trainRatio * 100}%` }} className="bg-brand transition-all" title="Train Set" />
                <div style={{ width: `${valRatio * 100}%` }} className="bg-brand-light transition-all" title="Validation Set" />
                <div style={{ width: `${testRatio * 100}%` }} className="bg-text-secondary transition-all" title="Test Set" />
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="text-[11px] text-text-secondary block mb-1">Train: {(trainRatio * 100).toFixed(0)}%</label>
                  <input
                    type="range"
                    min="0.50"
                    max="0.80"
                    step="0.05"
                    value={trainRatio}
                    onChange={(e) => handleRatioChange(parseFloat(e.target.value), valRatio)}
                    className="w-full accent-brand"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-text-secondary block mb-1">Val: {(valRatio * 100).toFixed(0)}%</label>
                  <input
                    type="range"
                    min="0.10"
                    max="0.25"
                    step="0.05"
                    value={valRatio}
                    onChange={(e) => handleRatioChange(trainRatio, parseFloat(e.target.value))}
                    className="w-full accent-brand-light"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-text-secondary block mb-1">Test (Residual): {(testRatio * 100).toFixed(0)}%</label>
                  <input
                    type="text"
                    disabled
                    value={`${(testRatio * 100).toFixed(0)}%`}
                    className="w-full text-xs font-mono bg-white border border-border rounded-lg px-2 py-1 text-center font-bold text-text-primary"
                  />
                </div>
              </div>
            </div>

            {/* Random Seed & Checkboxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">
                  Random Seed (Reproducibility)
                </label>
                <input
                  type="number"
                  value={randomSeed}
                  onChange={(e) => setRandomSeed(parseInt(e.target.value) || 42)}
                  className="w-full text-xs bg-background-secondary border border-border rounded-xl px-3 py-2 font-mono text-text-primary focus:outline-none focus:border-brand"
                />
              </div>

              <div className="space-y-2 pt-4">
                <label className="flex items-center gap-2.5 text-xs text-text-primary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scaleFeatures}
                    onChange={(e) => setScaleFeatures(e.target.checked)}
                    className="rounded accent-brand w-4 h-4"
                  />
                  <span className="font-medium">Standardize Continuous & Ordinal Features</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-text-primary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={removeDuplicates}
                    onChange={(e) => setRemoveDuplicates(e.target.checked)}
                    className="rounded accent-brand w-4 h-4"
                  />
                  <span className="font-medium">Filter Identical Survey Answer Combinations</span>
                </label>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-status-error/10 border border-status-error/30 text-status-error text-xs">
                {errorMsg}
              </div>
            )}

            <button
              onClick={handleRunPreprocessing}
              disabled={isProcessing}
              className="w-full bg-brand text-white py-3 rounded-xl text-xs font-bold hover:bg-brand/90 transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Partitioning & Fitting Pipeline...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Execute Data Preparation Pipeline</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Partition Summary & Audit Details (1 Col) */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-base font-bold text-text-primary border-b border-border pb-3">
              Dataset Hygiene Status
            </h2>

            <div className="space-y-3 mt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">Missing Values:</span>
                <span className="font-semibold text-status-success flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  0 Nulls Found
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">Duplicate Feature Patterns:</span>
                <span className="font-semibold text-text-primary">
                  {summary?.duplicate_rows.toLocaleString()} rows ({summary?.duplicate_percentage}%)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">Duplicate Policy:</span>
                <span className="font-semibold text-brand">
                  {removeDuplicates ? 'Filtered' : 'Retained (Recommended)'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">Class Imbalance:</span>
                <span className="font-semibold text-text-primary">{summary?.imbalance_ratio}</span>
              </div>
            </div>

            {resultMetadata ? (
              <div className="mt-5 p-4 rounded-xl bg-brand-surface border border-brand-light/30 space-y-2">
                <p className="text-xs font-bold text-brand flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-status-success" />
                  Pipeline Executed Successfully
                </p>
                <div className="text-[11px] text-text-secondary space-y-1 font-mono pt-1">
                  <p>Pipeline ID: {resultMetadata.pipeline_id}</p>
                  <p>Train: {resultMetadata.train_records?.toLocaleString()} ({resultMetadata.train_prevalence}% Pos)</p>
                  <p>Val: {resultMetadata.val_records?.toLocaleString()} ({resultMetadata.val_prevalence}% Pos)</p>
                  <p>Test: {resultMetadata.test_records?.toLocaleString()} ({resultMetadata.test_prevalence}% Pos)</p>
                  <p>Format: Apache Parquet</p>
                </div>
              </div>
            ) : (
              <div className="mt-6 p-4 rounded-xl bg-background-secondary border border-border text-center text-xs text-text-secondary">
                Configure parameters and click "Execute Data Preparation Pipeline" to save parquet splits.
              </div>
            )}
          </div>

          <div className="text-[10px] text-text-secondary border-t border-border pt-3">
            Parquet partitions are saved in <span className="font-mono">/processed_data</span> and versioned with SHA timestamps.
          </div>
        </div>
      </div>
    </div>
  );
};
