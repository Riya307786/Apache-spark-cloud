export interface DatasetInfo {
  id: string;
  filename: string;
  exists: boolean;
  path: string;
  size_mb: number;
  description: string;
  role: string;
}

export interface DatasetSummary {
  dataset_id: string;
  filename: string;
  total_rows: number;
  total_cols: number;
  feature_count: number;
  target_column: string;
  target_distribution: Record<string, number>;
  imbalance_ratio: string;
  prevalence_percent: number;
  missing_values: number;
  duplicate_rows: number;
  duplicate_percentage: number;
  duplicate_policy_note: string;
  features: string[];
}

export interface FeatureStat {
  column: string;
  label: string;
  is_target: boolean;
  data_type: string;
  unique_values: number;
  missing: number;
  mean: number;
  std: number;
  min: number;
  q25: number;
  median: number;
  q75: number;
  max: number;
  top_values: Array<{ value: number; percentage: number }>;
  description: string;
}

export interface ModelMetrics {
  threshold: number;
  roc_auc: number;
  pr_auc: number;
  precision: number;
  recall: number;
  sensitivity: number;
  specificity: number;
  f1_score: number;
  brier_score: number;
  confusion_matrix: {
    tn: number;
    fp: number;
    fn: number;
    tp: number;
    total: number;
  };
  calibration_curve: Array<{
    bin: number;
    pred_prob: number;
    true_prob: number;
    perfect: number;
  }>;
  roc_curve: Array<{ fpr: number; tpr: number }>;
  pr_curve: Array<{ recall: number; precision: number }>;
  inference_latency_ms: number;
}

export interface ModelSummary {
  model_id: string;
  model_type: string;
  pipeline_id: string;
  dataset_id: string;
  artifact_file: string;
  training_time: number;
  test_roc_auc: number;
  test_pr_auc: number;
  test_f1: number;
  test_recall: number;
  test_precision: number;
  test_brier: number;
  inference_latency_ms: number;
  created_at: number;
  created_date: string;
  is_active?: boolean;
}

export interface StratificationTier {
  id: string;
  label: string;
  threshold_range: string;
  count: number;
  proportion: number;
  positives: number;
  observed_rate: number;
  ci_95: { lower: number; upper: number };
}

export interface SubgroupResult {
  category: string;
  group: string;
  count: number;
  high_risk_share: number;
  observed_prevalence: number;
  high_risk_observed_rate: number;
}

export interface StratificationData {
  model_id: string;
  threshold_policy: {
    method: string;
    lower_threshold: number;
    upper_threshold: number;
    justification: string;
  };
  tiers: StratificationTier[];
  high_risk_tier_metrics: {
    sensitivity: number;
    precision: number;
    f1_score: number;
  };
  subgroup_analysis: SubgroupResult[];
  sensitivity_sweep: Array<{
    threshold: number;
    proportion_flagged: number;
    sensitivity: number;
    precision: number;
    f1: number;
  }>;
  disclaimer: string;
}

export interface SparkStatus {
  spark_available: boolean;
  status: string;
  java_detected: boolean;
  java_version: string | null;
  java_home?: string;
  pyspark_installed: boolean;
  pyspark_version: string | null;
  session_details?: {
    session_active: boolean;
    master_url: string;
    execution_mode: string;
    cluster_type: string;
    app_name: string;
    app_id: string | null;
    default_parallelism: number;
    executor_count: number;
    executor_cores: number;
    driver_memory: string;
    spark_ui_url: string;
    spark_ui_reachable: boolean;
  };
  setup_instructions: string[];
  docker_alternative: string;
}

export interface BenchmarkResult {
  workload_size: number;
  data_label: string;
  is_synthetic: boolean;
  system_cores: number;
  workers_used: number;
  spark_diagnostics: SparkStatus;
  sequential_baseline: {
    name: string;
    cores: number;
    runtime_seconds: number;
    throughput_records_sec: number;
    peak_memory_mb: number;
    estimated_cloud_cost_usd: number;
  };
  parallel_pipeline: {
    name: string;
    cores: number;
    runtime_seconds: number;
    throughput_records_sec: number;
    peak_memory_mb: number;
    estimated_cloud_cost_usd: number;
  };
  scaling_metrics: {
    speedup_factor: string;
    speedup_numeric: number;
    parallel_efficiency_percent: string;
    parallel_efficiency_numeric: number;
    time_saved_percent: number;
  };
  multi_workload_comparison: Array<{
    workload: number;
    label: string;
    sequential_sec: number;
    parallel_sec: number;
    speedup: number;
  }>;
}

export interface PipelineStage {
  stage_num: number;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'succeeded' | 'failed' | 'warning';
  duration_seconds: number;
  input_count: number;
  output_count: number;
  details: Record<string, any>;
  logs: string[];
}

export interface PipelineRunDetails {
  run_id: string;
  dataset_id: string;
  filename: string;
  status: string;
  total_records: number;
  train_records: number;
  val_records: number;
  test_records: number;
  feature_count: number;
  features: string[];
  target_column: string;
  train_prevalence: number;
  val_prevalence: number;
  test_prevalence: number;
  total_duration_seconds: number;
  parquet_size_mb: number;
  executed_date: string;
  stages: PipelineStage[];
}

export interface DataQualityReport {
  dataset_id: string;
  total_records: number;
  total_columns: number;
  overall_health: string;
  checks: Array<{
    check: string;
    passed: boolean;
    metric: string;
    status: string;
    details: string;
  }>;
}

export interface PandasSparkComparison {
  workload_size: number;
  operation: string;
  pandas_runtime_seconds: number;
  spark_runtime_seconds: number | null;
  spark_startup_overhead_seconds: number | null;
  speedup: number | null;
  spark_status: string;
  spark_diagnostics: SparkStatus;
  execution_note: string;
}

export interface SystemObservability {
  service_status: string;
  uptime_seconds: number;
  uptime_formatted: string;
  libraries: Record<string, string>;
  spark: SparkStatus;
  hardware: {
    cpu_cores_logical: number;
    cpu_percent: number;
    ram_total_gb: number;
    ram_available_gb: number;
    ram_used_percent: number;
  };
  storage: Record<string, {
    exists: boolean;
    file_count: number;
    size_mb: number;
    relative_path?: string;
  }>;
  docker: {
    docker_installed: boolean;
    daemon_running: boolean;
    status_message: string;
    containers: Array<{
      name: string;
      image: string;
      status: string;
      ports: string;
    }>;
  };
  active_jobs: any[];
  recent_jobs: any[];
  recent_audit_events: any[];
}
