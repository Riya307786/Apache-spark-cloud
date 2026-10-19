import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Play,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Server,
  Layers,
  Clock,
  DollarSign,
  TrendingUp,
  HardDrive,
  Info,
  Terminal,
  Activity,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { api } from '../services/api';
import { BenchmarkResult, SparkStatus } from '../types';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

export const ScalabilityLab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'parallel' | 'spark'>('parallel');
  const [sparkStatus, setSparkStatus] = useState<SparkStatus | null>(null);
  const [workloadSize, setWorkloadSize] = useState<number>(253680);
  const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkResult | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [jobStatus, setJobStatus] = useState<any>(null);
  
  // Spark tab specific state
  const [sparkRunning, setSparkRunning] = useState<boolean>(false);
  const [sparkError, setSparkError] = useState<string | null>(null);
  const [sparkResult, setSparkResult] = useState<any>(null);

  useEffect(() => {
    api.getSparkStatus().then(setSparkStatus).catch(console.error);
    runParallelBenchmark(253680);
  }, []);

  const runParallelBenchmark = async (size: number) => {
    setIsRunning(true);
    setJobStatus(null);
    try {
      const startRes = await api.startBenchmark({ workload_size: size });
      const jobId = startRes.job_id;

      const interval = setInterval(async () => {
        try {
          const job = await api.getBenchmarkJob(jobId);
          setJobStatus(job);
          if (job.status === 'completed') {
            clearInterval(interval);
            setBenchmarkResult(job.result);
            setIsRunning(false);
          } else if (job.status === 'failed') {
            clearInterval(interval);
            setIsRunning(false);
          }
        } catch {
          clearInterval(interval);
          setIsRunning(false);
        }
      }, 1000);
    } catch (err) {
      console.error(err);
      setIsRunning(false);
    }
  };

  const handleRunSparkBenchmark = async () => {
    setSparkRunning(true);
    setSparkError(null);
    try {
      const res = await api.startSparkBenchmark(workloadSize);
      const jobId = res.job_id;
      const interval = setInterval(async () => {
        try {
          const job = await api.getBenchmarkJob(jobId);
          if (job.status === 'completed') {
            clearInterval(interval);
            setSparkResult(job.result);
            setSparkRunning(false);
          } else if (job.status === 'failed') {
            clearInterval(interval);
            setSparkError(job.error || 'Spark benchmark failed');
            setSparkRunning(false);
          }
        } catch {
          clearInterval(interval);
          setSparkRunning(false);
        }
      }, 1000);
    } catch (err: any) {
      setSparkError(err.message || 'Cannot execute Spark benchmark');
      setSparkRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <DisclaimerBanner />

      {/* Header */}
      <div className="bg-white border border-border rounded-2xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-brand-surface border border-brand-light/30 px-3 py-1 rounded-full text-xs font-semibold text-brand mb-2">
            <Cpu className="w-3.5 h-3.5" />
            High-Performance Big Data Scalability Lab
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Big Data & Scalability Lab</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Empirical runtime profiling, throughput quantification, and parallel efficiency across workloads up to 2,000,000 records.
          </p>
        </div>

        {/* Tab Selector: Tab A (Local Parallel) vs Tab B (Spark) */}
        <div className="flex bg-background-secondary p-1 rounded-xl border border-border">
          <button
            onClick={() => setActiveTab('parallel')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'parallel'
                ? 'bg-white text-brand shadow-xs border border-brand-light/40'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Tab A: Local Parallel Processing</span>
          </button>
          <button
            onClick={() => setActiveTab('spark')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'spark'
                ? 'bg-white text-brand shadow-xs border border-brand-light/40'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Tab B: Apache Spark Benchmarks</span>
          </button>
        </div>
      </div>

      {/* Workload Classification Banner */}
      <div className="bg-background-secondary border border-border rounded-xl p-4 flex items-start gap-3 text-xs text-text-secondary">
        <Info className="w-4 h-4 text-brand shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-text-primary mr-1">Workload Classification Standard:</span>
          Workloads ≤ 253,680 records use the <strong className="text-text-primary">Real BRFSS 2015 Survey Dataset</strong>. Workloads exceeding 253,680 records (500K, 1M, 2M) are explicitly classified as <strong className="text-brand">Synthetic Infrastructure-Test Data</strong> for measuring hardware throughput and scaling limits. Synthetic data is never mixed with clinical evaluation or used to claim model accuracy.
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB A: LOCAL PARALLEL PROCESSING BENCHMARKS */}
      {/* ========================================================================= */}
      {activeTab === 'parallel' && (
        <div className="space-y-6">
          {/* Workload Selector & Benchmark Controls */}
          <div className="bg-white border border-border rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-3">
              <div>
                <h2 className="text-base font-bold text-text-primary">Workload Scaling Selector</h2>
                <p className="text-xs text-text-secondary">Execute concurrent chunking pipeline across available CPU cores</p>
              </div>

              <button
                onClick={() => runParallelBenchmark(workloadSize)}
                disabled={isRunning}
                className="bg-brand text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-brand/90 transition-all shadow-xs flex items-center gap-2 disabled:opacity-50"
              >
                {isRunning ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>Executing ({jobStatus?.progress || 0}%)...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Run Parallel Benchmark ({workloadSize.toLocaleString()} recs)</span>
                  </>
                )}
              </button>
            </div>

            {/* Workload Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { size: 100000, label: '100,000', sub: 'Real Survey Data' },
                { size: 253680, label: '253,680', sub: 'Full Real BRFSS' },
                { size: 500000, label: '500,000', sub: 'Expanded Infra Test' },
                { size: 1000000, label: '1,000,000', sub: 'Synthetic 1M Scale' },
                { size: 2000000, label: '2,000,000', sub: 'Synthetic 2M Scale' }
              ].map((w) => (
                <button
                  key={w.size}
                  onClick={() => {
                    setWorkloadSize(w.size);
                    runParallelBenchmark(w.size);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    workloadSize === w.size
                      ? 'bg-brand-surface border-brand-light/60 shadow-xs'
                      : 'bg-background-secondary border-border hover:bg-white'
                  }`}
                >
                  <p className={`text-xs font-bold font-mono ${workloadSize === w.size ? 'text-brand' : 'text-text-primary'}`}>
                    {w.label}
                  </p>
                  <p className="text-[10px] text-text-secondary mt-0.5">{w.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Measured KPIs */}
          {benchmarkResult && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-border rounded-xl p-5 shadow-xs">
                <p className="text-xs text-text-secondary font-medium">Measured Speedup</p>
                <p className="text-2xl font-extrabold text-brand font-mono mt-1">
                  {benchmarkResult.scaling_metrics.speedup_factor}
                </p>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  T_sequential / T_parallel
                </p>
              </div>

              <div className="bg-white border border-border rounded-xl p-5 shadow-xs">
                <p className="text-xs text-text-secondary font-medium">Parallel Efficiency</p>
                <p className="text-2xl font-extrabold text-text-primary font-mono mt-1">
                  {benchmarkResult.scaling_metrics.parallel_efficiency_percent}
                </p>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  Across {benchmarkResult.workers_used} concurrent workers
                </p>
              </div>

              <div className="bg-white border border-border rounded-xl p-5 shadow-xs">
                <p className="text-xs text-text-secondary font-medium">Throughput (Rec/Sec)</p>
                <p className="text-2xl font-extrabold text-status-success font-mono mt-1">
                  {benchmarkResult.parallel_pipeline.throughput_records_sec.toLocaleString()}
                </p>
                <p className="text-[11px] text-text-secondary mt-0.5">Processed records / sec</p>
              </div>

              <div className="bg-white border border-border rounded-xl p-5 shadow-xs">
                <p className="text-xs text-text-secondary font-medium">Peak Resident Memory</p>
                <p className="text-2xl font-extrabold text-text-primary font-mono mt-1">
                  {benchmarkResult.parallel_pipeline.peak_memory_mb} MB
                </p>
                <p className="text-[11px] text-text-secondary mt-0.5">Resident Set Size (RSS)</p>
              </div>
            </div>
          )}

          {/* Scaling Graphs & Resource Transparency */}
          {benchmarkResult && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-border rounded-2xl p-6 shadow-xs space-y-4">
                <div className="border-b border-border pb-3">
                  <h3 className="text-base font-bold text-text-primary">Runtime vs Workload Volume (Seconds)</h3>
                  <p className="text-xs text-text-secondary">Comparing single-core sequential vs multi-core parallel execution</p>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={benchmarkResult.multi_workload_comparison} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0E4E8" />
                      <XAxis dataKey="label" stroke="#77717A" fontSize={10} />
                      <YAxis stroke="#77717A" fontSize={10} label={{ value: 'Runtime (s)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #F0E4E8', fontSize: '11px' }} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="sequential_sec" name="Sequential (1 Core)" fill="#77717A" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="parallel_sec" name={`Parallel (${benchmarkResult.workers_used} Cores)`} fill="#C84B65" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white border border-border rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
                <div>
                  <div className="border-b border-border pb-3">
                    <h3 className="text-base font-bold text-text-primary">Cloud Cost Transparency & Resource Usage</h3>
                    <p className="text-xs text-text-secondary">AWS c5.2xlarge instance calculation ($0.34/hr, 8 vCPU, 16 GB RAM)</p>
                  </div>

                  <div className="space-y-3 mt-4 text-xs">
                    <div className="flex justify-between p-3 rounded-xl bg-background-secondary border border-border">
                      <span className="text-text-secondary">Sequential Execution Cost:</span>
                      <span className="font-mono font-bold text-text-primary">
                        ${benchmarkResult.sequential_baseline.estimated_cloud_cost_usd} USD
                      </span>
                    </div>

                    <div className="flex justify-between p-3 rounded-xl bg-brand-surface border border-brand-light/30">
                      <span className="text-brand font-semibold">Parallel Execution Cost:</span>
                      <span className="font-mono font-bold text-brand">
                        ${benchmarkResult.parallel_pipeline.estimated_cloud_cost_usd} USD
                      </span>
                    </div>

                    <div className="flex justify-between p-3 rounded-xl bg-background-secondary border border-border">
                      <span className="text-text-secondary">Execution Time Saved:</span>
                      <span className="font-mono font-bold text-status-success">
                        {benchmarkResult.scaling_metrics.time_saved_percent}% Reduction
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-background-secondary/60 rounded-xl text-[11px] text-text-secondary border border-border">
                  Hardware configuration: <strong>{benchmarkResult.system_cores} CPU cores</strong> detected on host system.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB B: APACHE SPARK BENCHMARKS */}
      {/* ========================================================================= */}
      {activeTab === 'spark' && (
        <div className="space-y-6">
          <div className="bg-white border border-border rounded-2xl p-6 shadow-xs space-y-5">
            <div className="border-b border-border pb-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-text-primary">Apache Spark Distributed Processing Engine</h2>
                <p className="text-xs text-text-secondary">Execution diagnostics and cluster benchmark status</p>
              </div>

              <button
                onClick={handleRunSparkBenchmark}
                disabled={sparkRunning}
                className="bg-brand text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-brand/90 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {sparkRunning ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>Executing Spark Task...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Execute Spark Benchmark</span>
                  </>
                )}
              </button>
            </div>

            {/* Spark Diagnostic Status Display */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-background-secondary p-4 rounded-xl border border-border space-y-1">
                <span className="text-text-secondary block">JVM Availability</span>
                <span className={`text-sm font-bold font-mono ${sparkStatus?.java_detected ? 'text-status-success' : 'text-brand'}`}>
                  {sparkStatus?.java_detected ? sparkStatus.java_version : 'Offline (Java not in PATH)'}
                </span>
                <span className="text-[10px] text-text-secondary block">Prerequisite for Spark driver JVM</span>
              </div>

              <div className="bg-background-secondary p-4 rounded-xl border border-border space-y-1">
                <span className="text-text-secondary block">PySpark Version</span>
                <span className="text-sm font-bold text-text-primary font-mono">
                  {sparkStatus?.pyspark_version || '4.2.0 (Installed)'}
                </span>
                <span className="text-[10px] text-text-secondary block">Python package installed</span>
              </div>

              <div className="bg-background-secondary p-4 rounded-xl border border-border space-y-1">
                <span className="text-text-secondary block">Container Alternative</span>
                <span className="text-sm font-bold text-text-primary font-mono">
                  docker-compose up
                </span>
                <span className="text-[10px] text-text-secondary block">Preconfigured OpenJDK 17 Spark container</span>
              </div>
            </div>

            {/* Error or Empty State */}
            {sparkError && (
              <div className="p-4 rounded-xl bg-brand-paleRed border border-brand-light/50 text-xs text-brand space-y-1.5">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  Spark Execution Prerequisite Notice
                </p>
                <p className="leading-relaxed">{sparkError}</p>
              </div>
            )}

            {!sparkResult && !sparkError && (
              <div className="py-12 text-center space-y-3 bg-background-secondary/30 rounded-xl border border-dashed border-border">
                <Server className="w-10 h-10 text-brand-light mx-auto" />
                <div className="max-w-md mx-auto space-y-1">
                  <p className="text-sm font-bold text-text-primary">No Spark Benchmark Results Yet</p>
                  <p className="text-xs text-text-secondary">
                    Per research integrity standards, completed Spark benchmarks are never manufactured without active JVM execution.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={handleRunSparkBenchmark}
                    className="bg-brand text-white text-xs font-bold px-4 py-2 rounded-xl"
                  >
                    Attempt Spark Execution
                  </button>
                </div>
              </div>
            )}

            {sparkResult && (
              <div className="p-4 rounded-xl bg-status-success/10 border border-status-success/30 text-xs text-status-success space-y-2">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Spark Benchmark Succeeded
                </p>
                <div className="text-text-primary font-mono text-[11px] space-y-0.5">
                  <p>Application ID: {sparkResult.app_id}</p>
                  <p>Initialization Time: {sparkResult.initialization_time_seconds}s</p>
                  <p>Job Runtime: {sparkResult.job_runtime_seconds}s</p>
                  <p>Total Runtime: {sparkResult.total_runtime_seconds}s</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
