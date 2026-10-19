import {
  DatasetInfo,
  DatasetSummary,
  FeatureStat,
  ModelSummary,
  ModelMetrics,
  StratificationData,
  BenchmarkResult,
  SparkStatus,
  PipelineRunDetails,
  DataQualityReport,
  PandasSparkComparison,
  SystemObservability
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    let errorDetail = 'API Request failed';
    try {
      const err = await res.json();
      errorDetail = err.detail || JSON.stringify(err);
    } catch {
      errorDetail = `${res.status} ${res.statusText}`;
    }
    throw new Error(errorDetail);
  }
  return res.json();
}

export const api = {
  // Health
  checkHealth: () => fetchJson<{ status: string; project_root: string; datasets: DatasetInfo[]; disclaimer: string }>(`${API_BASE}/health`),

  // Datasets
  getDatasets: () => fetchJson<DatasetInfo[]>(`${API_BASE}/datasets`),
  getDatasetSummary: (id: string = 'binary') => fetchJson<DatasetSummary>(`${API_BASE}/datasets/${id}/summary`),
  getDatasetSchema: (id: string = 'binary') => fetchJson<{ dataset_id: string; features: FeatureStat[]; metadata: any }>(`${API_BASE}/datasets/${id}/schema`),
  getDatasetCorrelations: (id: string = 'binary', topN: number = 12) => fetchJson<any>(`${API_BASE}/datasets/${id}/correlations?top_n=${topN}`),
  getDatasetSamples: (id: string = 'binary', offset: number = 0, limit: number = 25) => fetchJson<any>(`${API_BASE}/datasets/${id}/samples?offset=${offset}&limit=${limit}`),
  getDatasetDistribution: (id: string = 'binary', column: string = 'BMI') => fetchJson<any>(`${API_BASE}/datasets/${id}/distribution?column=${column}`),

  // Preprocessing & Visual 12-Stage Pipeline
  runPreprocessing: (params: {
    dataset_id: string;
    train_ratio: number;
    val_ratio: number;
    test_ratio: number;
    random_state: number;
    remove_duplicates: boolean;
    scale_features: boolean;
  }) => fetchJson<{ job_id: string; status: string; message: string }>(`${API_BASE}/preprocessing/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  }),
  getProcessingRuns: () => fetchJson<Array<{
    run_id: string;
    dataset_id: string;
    total_records: number;
    train_records: number;
    val_records: number;
    test_records: number;
    duration_seconds: number;
    executed_date: string;
    status: string;
  }>>(`${API_BASE}/preprocessing/runs`),
  getProcessingRun: (runId: string) => fetchJson<PipelineRunDetails>(`${API_BASE}/preprocessing/runs/${runId}`),
  runQualityCheck: (datasetId: string = 'binary') => fetchJson<DataQualityReport>(`${API_BASE}/preprocessing/quality-check?dataset_id=${datasetId}`, {
    method: 'POST'
  }),
  getPandasSparkComparison: (workloadSize: number = 253680) => fetchJson<PandasSparkComparison>(`${API_BASE}/preprocessing/comparison?workload_size=${workloadSize}`),

  // Training & Models
  startTraining: (params: {
    model_type: string;
    dataset_id: string;
    pipeline_id?: string;
    hyperparameters?: Record<string, any>;
  }) => fetchJson<{ job_id: string; status: string; message: string }>(`${API_BASE}/training/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  }),
  getTrainingStatus: (jobId: string) => fetchJson<any>(`${API_BASE}/training/${jobId}`),
  getModels: () => fetchJson<ModelSummary[]>(`${API_BASE}/models`),
  getModelMetrics: (modelId: string) => fetchJson<{
    model_id: string;
    model_type: string;
    validation_metrics: ModelMetrics;
    test_metrics: ModelMetrics;
    hyperparameters: any;
    created_date: string;
  }>(`${API_BASE}/models/${modelId}/metrics`),
  activateModel: (modelId: string) => fetchJson<{ status: string; active_model_id: string }>(`${API_BASE}/models/${modelId}/activate`, {
    method: 'POST'
  }),

  // Predictions
  predictSingle: (params: {
    model_id?: string;
    features: Record<string, number>;
    lower_threshold?: number;
    upper_threshold?: number;
  }) => fetchJson<{
    model_id: string;
    model_type: string;
    estimated_probability: number;
    estimated_percentage: number;
    risk_stratification: any;
    disclaimer: string;
  }>(`${API_BASE}/predictions/single`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  }),
  predictBatch: (formData: FormData) => fetchJson<any>(`${API_BASE}/predictions/batch`, {
    method: 'POST',
    body: formData
  }),

  // Explainability
  getGlobalExplanations: (modelId?: string, sampleSize: number = 150) => {
    const q = modelId ? `?model_id=${modelId}&sample_size=${sampleSize}` : `?sample_size=${sampleSize}`;
    return fetchJson<any>(`${API_BASE}/explanations/global${q}`, { method: 'POST' });
  },
  getLocalExplanation: (params: { model_id?: string; features: Record<string, any> }) => fetchJson<any>(`${API_BASE}/explanations/local`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  }),

  // Stratification
  getStratificationSummary: (modelId?: string, lower: number = 0.20, upper: number = 0.50) => {
    const q = new URLSearchParams({
      lower_threshold: lower.toString(),
      upper_threshold: upper.toString()
    });
    if (modelId) q.append('model_id', modelId);
    return fetchJson<StratificationData>(`${API_BASE}/stratification/summary?${q.toString()}`);
  },

  // Big Data & Benchmarks
  getSparkStatus: () => fetchJson<SparkStatus>(`${API_BASE}/benchmarks/spark-status`),
  startBenchmark: (params: { workload_size: number; workers?: number }) => fetchJson<{ job_id: string; status: string; message: string }>(`${API_BASE}/benchmarks/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  }),
  startSparkBenchmark: (workloadSize: number = 253680) => fetchJson<{ job_id: string; status: string; message: string }>(`${API_BASE}/benchmarks/spark/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workload_size: workloadSize })
  }),
  getBenchmarkJob: (jobId: string) => fetchJson<any>(`${API_BASE}/benchmarks/${jobId}`),
  getBenchmarkHistory: () => fetchJson<{
    parallel_benchmarks: any[];
    spark_benchmarks: any[];
  }>(`${API_BASE}/benchmarks/history`),

  // System & Infrastructure
  getSystemStatus: () => fetchJson<SystemObservability>(`${API_BASE}/system/status`),

  // Reports
  getFullReport: (modelId?: string) => {
    const q = modelId ? `?model_id=${modelId}` : '';
    return fetchJson<any>(`${API_BASE}/reports/generate${q}`);
  },
  getRecentExperiments: () => fetchJson<any[]>(`${API_BASE}/reports/experiments`)
};
