import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  Copy,
  Check,
  ShieldCheck,
  Database,
  Layers,
  Sparkles,
  Cpu,
  BarChart2
} from 'lucide-react';
import { api } from '../services/api';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

export const ResearchReports: React.FC = () => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await api.getFullReport();
      setReport(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (!report) return;
    const md = `
# ${report.title}
*${report.tagline}*
Generated: ${report.generated_at}

## 1. Dataset Overview
- **Source**: ${report.dataset_overview.dataset_name}
- **Total Records**: ${report.dataset_overview.total_respondents.toLocaleString()}
- **Features**: ${report.dataset_overview.total_features} Indicators
- **Target**: ${report.dataset_overview.target_definition}
- **Prevalence**: ${report.dataset_overview.diabetes_prevalence}
- **Imbalance Ratio**: ${report.dataset_overview.imbalance_ratio}
- **Duplicate Policy**: ${report.dataset_overview.duplicate_policy}

## 2. Preprocessing & Leakage Prevention
- **Splitting**: ${report.preprocessing_methodology.splitting_strategy}
- **Scaling**: ${report.preprocessing_methodology.leakage_prevention}
- **Resampling**: ${report.preprocessing_methodology.resampling_policy}

## 3. Model Benchmark Leaderboard
${report.model_benchmarking.model_comparison.map((m: any) => `- **${m.type.toUpperCase()}** (${m.model_id}): ROC-AUC = ${m.test_roc_auc}, PR-AUC = ${m.test_pr_auc}, Recall = ${(m.test_recall * 100).toFixed(1)}%, Latency = ${m.inference_latency_ms} ms`).join('\n')}

## 4. Clinical Limitations & Ethics
- **Cross-Sectional Notice**: ${report.clinical_and_ethical_limitations.cross_sectional_nature}
- **XAI Disclosure**: ${report.clinical_and_ethical_limitations.shap_interpretation}
- **Disclaimer**: ${report.clinical_and_ethical_limitations.disclaimer}
    `.trim();

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DiaRisk_Research_Report_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <DisclaimerBanner />

      {/* Header & Export Actions */}
      <div className="bg-white border border-border rounded-2xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-brand-surface border border-brand-light/30 px-3 py-1 rounded-full text-xs font-semibold text-brand mb-2">
            <FileText className="w-3.5 h-3.5" />
            Empirical Evaluation & Technical Documentation
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Research Reports & Synthesis</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Auto-generated technical research report summarizing dataset epidemiology, model discrimination, calibration, and ethical boundaries.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyMarkdown}
            className="bg-background-secondary border border-border text-text-primary hover:bg-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Markdown'}</span>
          </button>

          <button
            onClick={handleDownloadJson}
            className="bg-background-secondary border border-border text-text-primary hover:bg-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handlePrint}
            className="bg-brand text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-brand/90 flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report (PDF)</span>
          </button>
        </div>
      </div>

      {/* Main Report Document View */}
      {report && (
        <div className="bg-white border border-border rounded-2xl p-8 shadow-xs space-y-8 max-w-4xl mx-auto">
          {/* Document Header */}
          <div className="border-b border-border pb-6 space-y-2 text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-brand">
              Scientific Technical Monograph
            </span>
            <h2 className="text-2xl font-extrabold text-text-primary tracking-tight">
              {report.title}
            </h2>
            <p className="text-xs text-text-secondary italic">
              {report.tagline} • Generated on {report.generated_at}
            </p>
          </div>

          {/* Section 1: Study Objective & Dataset */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider text-brand border-b border-border pb-1 flex items-center gap-2">
              <Database className="w-4 h-4" />
              <span>1. Dataset Architecture & Empirical Population</span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-background-secondary p-3 rounded-xl border border-border">
                <span className="text-text-secondary block">Survey Cohort:</span>
                <span className="font-semibold text-text-primary">{report.dataset_overview.dataset_name}</span>
              </div>
              <div className="bg-background-secondary p-3 rounded-xl border border-border">
                <span className="text-text-secondary block">Total Population:</span>
                <span className="font-semibold text-text-primary font-mono">{report.dataset_overview.total_respondents.toLocaleString()}</span>
              </div>
              <div className="bg-background-secondary p-3 rounded-xl border border-border">
                <span className="text-text-secondary block">Outcome Prevalence:</span>
                <span className="font-semibold text-text-primary font-mono">{report.dataset_overview.diabetes_prevalence}</span>
              </div>
              <div className="bg-background-secondary p-3 rounded-xl border border-border">
                <span className="text-text-secondary block">Class Imbalance:</span>
                <span className="font-semibold text-text-primary font-mono">{report.dataset_overview.imbalance_ratio}</span>
              </div>
              <div className="bg-background-secondary p-3 rounded-xl border border-border col-span-2">
                <span className="text-text-secondary block">Survey Response Pattern Structure:</span>
                <span className="font-semibold text-text-primary">{report.dataset_overview.duplicate_policy}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Preprocessing & Leakage Control */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider text-brand border-b border-border pb-1 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>2. Research Hygiene & Leakage Prevention Protocol</span>
            </h3>
            <ul className="text-xs text-text-secondary space-y-2 list-disc list-inside bg-background-secondary p-4 rounded-xl border border-border leading-relaxed">
              <li><strong>Splitting Strategy:</strong> {report.preprocessing_methodology.splitting_strategy}.</li>
              <li><strong>Transformations:</strong> {report.preprocessing_methodology.leakage_prevention}.</li>
              <li><strong>Sampling Protocol:</strong> {report.preprocessing_methodology.resampling_policy}.</li>
            </ul>
          </div>

          {/* Section 3: Algorithm Benchmark */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider text-brand border-b border-border pb-1 flex items-center gap-2">
              <BarChart2 className="w-4 h-4" />
              <span>3. Model Discrimination & Evaluation Benchmark</span>
            </h3>
            <div className="overflow-x-auto border border-border rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-text-secondary bg-background-secondary/60">
                    <th className="py-2.5 px-3">Algorithm</th>
                    <th className="py-2.5 px-3 text-right">Test ROC-AUC</th>
                    <th className="py-2.5 px-3 text-right">PR-AUC</th>
                    <th className="py-2.5 px-3 text-right">Sensitivity</th>
                    <th className="py-2.5 px-3 text-right">Precision</th>
                    <th className="py-2.5 px-3 text-right">Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {report.model_benchmarking.model_comparison.map((m: any) => (
                    <tr key={m.model_id}>
                      <td className="py-2 px-3 font-semibold text-text-primary uppercase">{m.type}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-brand">{m.test_roc_auc?.toFixed(4)}</td>
                      <td className="py-2 px-3 text-right font-mono">{m.test_pr_auc?.toFixed(4)}</td>
                      <td className="py-2 px-3 text-right font-mono">{m.test_recall ? `${(m.test_recall * 100).toFixed(1)}%` : '—'}</td>
                      <td className="py-2 px-3 text-right font-mono">{m.test_precision ? `${(m.test_precision * 100).toFixed(1)}%` : '—'}</td>
                      <td className="py-2 px-3 text-right font-mono text-text-secondary">{m.inference_latency_ms} ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Risk Stratification Findings */}
          {report.risk_stratification_findings && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider text-brand border-b border-border pb-1 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span>4. Risk Stratification & Empirical Prevalence</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {report.risk_stratification_findings.tiers.map((t: any) => (
                  <div key={t.id} className="p-3.5 rounded-xl border border-border bg-background-secondary space-y-1">
                    <p className="font-bold text-text-primary">{t.label}</p>
                    <p className="text-[11px] text-text-secondary">{t.threshold_range}</p>
                    <p className="text-lg font-bold text-brand font-mono mt-1">{t.observed_rate}% True Prevalence</p>
                    <p className="text-[10px] text-text-secondary">95% CI: [{t.ci_95.lower}% - {t.ci_95.upper}%]</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 5: Scalability & Big Data Infrastructure */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider text-brand border-b border-border pb-1 flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              <span>5. High-Performance Scalability Infrastructure</span>
            </h3>
            <div className="text-xs text-text-secondary bg-background-secondary p-4 rounded-xl border border-border space-y-1 leading-relaxed">
              <p>• <strong>PySpark Environment:</strong> {report.big_data_infrastructure.spark_status}.</p>
              <p>• <strong>Local High-Performance Engine:</strong> {report.big_data_infrastructure.parallel_engine}.</p>
              <p>• <strong>Cloud Architecture:</strong> {report.big_data_infrastructure.cluster_containerization}.</p>
            </div>
          </div>

          {/* Section 6: Limitations & Bioethics */}
          <div className="space-y-3 border-t border-border pt-4">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider text-brand flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>6. Ethical Scope & Epidemiological Limitations</span>
            </h3>
            <div className="text-xs text-text-secondary space-y-2 leading-relaxed bg-brand-surface/40 p-4 rounded-xl border border-brand-light/30">
              <p>
                <strong>Cross-Sectional Nature:</strong> {report.clinical_and_ethical_limitations.cross_sectional_nature}
              </p>
              <p>
                <strong>Attribution Boundaries:</strong> {report.clinical_and_ethical_limitations.shap_interpretation}
              </p>
              <p className="font-semibold text-brand">
                {report.clinical_and_ethical_limitations.disclaimer}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
