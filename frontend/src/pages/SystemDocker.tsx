import React, { useState, useEffect } from 'react';
import {
  Server,
  Activity,
  Cpu,
  HardDrive,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Box,
  Layers,
  Terminal,
  Database
} from 'lucide-react';
import { api } from '../services/api';
import { SystemObservability } from '../types';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

export const SystemDocker: React.FC = () => {
  const [systemData, setSystemData] = useState<SystemObservability | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadSystemData();
    const interval = setInterval(loadSystemData, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadSystemData = async () => {
    try {
      const data = await api.getSystemStatus();
      setSystemData(data);
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
            <Server className="w-3.5 h-3.5" />
            Infrastructure & Container Observability
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">System & Docker Observability</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Technical runtime inspection, memory profiling, directory storage footprint, active background jobs, and Docker service topology.
          </p>
        </div>

        <button
          onClick={loadSystemData}
          disabled={loading}
          className="bg-background-secondary border border-border text-text-primary hover:bg-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Operational Health KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-border rounded-xl p-4 shadow-xs">
          <p className="text-xs text-text-secondary font-medium">Backend API Engine</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-status-success animate-pulse" />
            <p className="text-lg font-bold text-status-success capitalize">{systemData?.service_status || 'Online'}</p>
          </div>
          <p className="text-[11px] text-text-secondary mt-0.5">Uptime: {systemData?.uptime_formatted || '—'}</p>
        </div>

        <div className="bg-white border border-border rounded-xl p-4 shadow-xs">
          <p className="text-xs text-text-secondary font-medium">Logical CPU Cores</p>
          <p className="text-lg font-bold text-text-primary mt-1 font-mono">{systemData?.hardware.cpu_cores_logical || 4} Cores</p>
          <p className="text-[11px] text-text-secondary mt-0.5">Load: {systemData?.hardware.cpu_percent || 0}% CPU utilization</p>
        </div>

        <div className="bg-white border border-border rounded-xl p-4 shadow-xs">
          <p className="text-xs text-text-secondary font-medium">Host RAM Consumption</p>
          <p className="text-lg font-bold text-brand mt-1 font-mono">{systemData?.hardware.ram_used_percent || 0}%</p>
          <p className="text-[11px] text-text-secondary mt-0.5">{systemData?.hardware.ram_available_gb || 0} GB Free of {systemData?.hardware.ram_total_gb || 0} GB</p>
        </div>

        <div className="bg-white border border-border rounded-xl p-4 shadow-xs">
          <p className="text-xs text-text-secondary font-medium">Spark JVM Status</p>
          <p className={`text-sm font-bold mt-1 ${systemData?.spark.spark_available ? 'text-status-success' : 'text-brand'}`}>
            {systemData?.spark.spark_available ? 'JVM Ready' : 'Host JVM Offline'}
          </p>
          <p className="text-[11px] text-text-secondary mt-0.5">PySpark 4.2.0 installed</p>
        </div>
      </div>

      {/* Two Column Layout: Runtime Libraries & Docker Containers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Runtime Stack & Libraries */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-xs space-y-4">
          <div className="border-b border-border pb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4 text-brand" />
              <span>Runtime Libraries & Framework Versions</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            {systemData?.libraries && Object.entries(systemData.libraries).map(([lib, ver]) => (
              <div key={lib} className="bg-background-secondary p-3 rounded-xl border border-border">
                <span className="text-[11px] text-text-secondary block capitalize">{lib.replace('_', ' ')}</span>
                <span className="font-mono font-bold text-text-primary mt-0.5 block">{ver}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Docker Daemon & Container Topology */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-xs space-y-4">
          <div className="border-b border-border pb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Box className="w-4 h-4 text-brand" />
              <span>Docker & Compose Container Topology</span>
            </h2>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              systemData?.docker.daemon_running ? 'bg-status-success/10 text-status-success' : 'bg-background-secondary text-text-secondary border border-border'
            }`}>
              {systemData?.docker.daemon_running ? 'Daemon Active' : 'Standalone Host'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-background-secondary border border-border text-xs text-text-secondary space-y-2">
            <p className="font-semibold text-text-primary">Daemon Status:</p>
            <p className="text-[11px]">{systemData?.docker.status_message}</p>
          </div>

          <div className="space-y-2 text-xs">
            <p className="font-bold text-text-primary">Defined Compose Services (docker-compose.yml):</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border border-border bg-white space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-text-primary">backend</span>
                  <span className="text-[10px] font-mono text-brand font-semibold">:8000</span>
                </div>
                <p className="text-[10px] text-text-secondary">Python 3.12 + OpenJDK 17 + PySpark 4.2.0</p>
              </div>

              <div className="p-3 rounded-xl border border-border bg-white space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-text-primary">frontend</span>
                  <span className="text-[10px] font-mono text-brand font-semibold">:3000</span>
                </div>
                <p className="text-[10px] text-text-secondary">Nginx Alpine + Production React 19 Bundle</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Directory Storage Footprint */}
      <div className="bg-white border border-border rounded-2xl p-6 shadow-xs space-y-4">
        <div className="border-b border-border pb-3">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-brand" />
            <span>Filesystem Storage Footprint</span>
          </h2>
          <p className="text-xs text-text-secondary">Auditing raw datasets, serialized model artifacts, Parquet partitions, and logs</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          {systemData?.storage && Object.entries(systemData.storage).map(([dirName, stat]) => (
            <div key={dirName} className="p-3.5 rounded-xl border border-border bg-background-secondary space-y-1">
              <span className="font-bold text-text-primary font-mono capitalize">{dirName}/</span>
              <p className="text-lg font-bold text-brand font-mono">{stat.size_mb} MB</p>
              <p className="text-[10px] text-text-secondary">{stat.file_count} file(s)</p>
            </div>
          ))}
        </div>
      </div>

      {/* Background Jobs & Audit Activity */}
      <div className="bg-white border border-border rounded-2xl p-6 shadow-xs space-y-4">
        <div className="border-b border-border pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand" />
              <span>Background Jobs & Research Audit Trail</span>
            </h2>
            <p className="text-xs text-text-secondary">Thread-safe background tasks with persistent disk logging</p>
          </div>
          <span className="text-xs text-text-secondary font-mono">
            {systemData?.recent_jobs?.length || 0} Jobs Recorded
          </span>
        </div>

        <div className="overflow-x-auto border border-border rounded-xl">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-text-secondary bg-background-secondary/60">
                <th className="py-2 px-3">Job ID</th>
                <th className="py-2 px-3">Type</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Duration</th>
                <th className="py-2 px-3">Created Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {systemData?.recent_jobs?.slice(0, 8).map((job: any) => (
                <tr key={job.id}>
                  <td className="py-2 px-3 font-mono text-brand font-medium">{job.id}</td>
                  <td className="py-2 px-3 font-semibold text-text-primary uppercase">{job.type}</td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      job.status === 'completed'
                        ? 'bg-status-success/10 text-status-success'
                        : job.status === 'running'
                        ? 'bg-brand-surface text-brand'
                        : 'bg-background-secondary text-text-secondary'
                    }`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-mono text-text-secondary">{job.duration_seconds || '—'}s</td>
                  <td className="py-2 px-3 text-text-secondary text-[11px]">{job.created_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
