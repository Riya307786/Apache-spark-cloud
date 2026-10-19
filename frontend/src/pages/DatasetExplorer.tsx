import React, { useEffect, useState } from 'react';
import {
  Database,
  Search,
  Filter,
  BarChart2,
  Table as TableIcon,
  Info,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
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
import { DatasetSummary, FeatureStat } from '../types';

export const DatasetExplorer: React.FC = () => {
  const [datasetId, setDatasetId] = useState<string>('binary');
  const [summary, setSummary] = useState<DatasetSummary | null>(null);
  const [features, setFeatures] = useState<FeatureStat[]>([]);
  const [correlations, setCorrelations] = useState<any>(null);
  const [selectedFeature, setSelectedFeature] = useState<string>('GenHlth');
  const [distributionData, setDistributionData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sampleRows, setSampleRows] = useState<any[]>([]);
  const [totalSampleRows, setTotalSampleRows] = useState<number>(0);
  const [sampleOffset, setSampleOffset] = useState<number>(0);
  const [sampleLimit] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadDatasetData(datasetId);
  }, [datasetId]);

  useEffect(() => {
    loadFeatureDistribution(datasetId, selectedFeature);
  }, [datasetId, selectedFeature]);

  useEffect(() => {
    loadSampleData(datasetId, sampleOffset);
  }, [datasetId, sampleOffset]);

  const loadDatasetData = async (id: string) => {
    setLoading(true);
    try {
      const [sum, schema, corr] = await Promise.all([
        api.getDatasetSummary(id),
        api.getDatasetSchema(id),
        api.getDatasetCorrelations(id, 12)
      ]);
      setSummary(sum);
      setFeatures(schema.features);
      setCorrelations(corr);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadFeatureDistribution = async (id: string, col: string) => {
    try {
      const dist = await api.getDatasetDistribution(id, col);
      setDistributionData(dist);
    } catch (err) {
      console.error(err);
    }
  };

  const loadSampleData = async (id: string, offset: number) => {
    try {
      const samples = await api.getDatasetSamples(id, offset, sampleLimit);
      setSampleRows(samples.rows);
      setTotalSampleRows(samples.total_rows);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredFeatures = features.filter(
    (f) =>
      f.column.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Dataset selector */}
      <div className="bg-white border border-border rounded-2xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-brand-surface border border-brand-light/30 px-3 py-1 rounded-full text-xs font-semibold text-brand mb-2">
            <Database className="w-3.5 h-3.5" />
            Empirical BRFSS 2015 Health Indicators
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Dataset Explorer</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Real dataset schema inspection, target distribution, feature correlations, and data integrity verification.
          </p>
        </div>

        {/* Dataset selector tabs */}
        <div className="flex bg-background-secondary p-1 rounded-xl border border-border">
          <button
            onClick={() => { setDatasetId('binary'); setSampleOffset(0); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              datasetId === 'binary' ? 'bg-white text-brand shadow-xs border border-brand-light/40' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Primary Binary (253,680)
          </button>
          <button
            onClick={() => { setDatasetId('multi_class'); setSampleOffset(0); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              datasetId === 'multi_class' ? 'bg-white text-brand shadow-xs border border-brand-light/40' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            3-Class (253,680)
          </button>
          <button
            onClick={() => { setDatasetId('balanced_binary'); setSampleOffset(0); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              datasetId === 'balanced_binary' ? 'bg-white text-brand shadow-xs border border-brand-light/40' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Balanced 50/50 (70,692)
          </button>
        </div>
      </div>

      {/* Dataset Health & Dimension KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-border rounded-xl p-4 shadow-xs">
          <p className="text-xs text-text-secondary font-medium">Record Count</p>
          <p className="text-xl font-bold text-text-primary mt-1">{summary ? summary.total_rows.toLocaleString() : '—'}</p>
          <p className="text-[11px] text-text-secondary mt-0.5">Full survey observations</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-4 shadow-xs">
          <p className="text-xs text-text-secondary font-medium">Features</p>
          <p className="text-xl font-bold text-text-primary mt-1">{summary ? summary.feature_count : '—'} Columns</p>
          <p className="text-[11px] text-text-secondary mt-0.5">Target: {summary?.target_column}</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-4 shadow-xs">
          <p className="text-xs text-text-secondary font-medium">Missing Values</p>
          <p className="text-xl font-bold text-status-success mt-1">{summary?.missing_values ?? 0} Nulls</p>
          <p className="text-[11px] text-text-secondary mt-0.5">100% complete data</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-4 shadow-xs">
          <p className="text-xs text-text-secondary font-medium">Identical Survey Patterns</p>
          <p className="text-xl font-bold text-text-primary mt-1">{summary ? summary.duplicate_rows.toLocaleString() : '—'}</p>
          <p className="text-[11px] text-text-secondary mt-0.5">{summary?.duplicate_percentage}% retained distinct records</p>
        </div>
      </div>

      {/* Duplicate Handling Note */}
      <div className="bg-background-secondary border border-border rounded-xl p-4 flex items-start gap-3 text-xs text-text-secondary">
        <Info className="w-4 h-4 text-brand shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-text-primary mr-1">Population Survey Structure:</span>
          {summary?.duplicate_policy_note}
        </div>
      </div>

      {/* Two Columns: Feature Distribution vs Target Correlation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature Distribution Explorer */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-bold text-text-primary">Feature Distribution & Diabetes Prevalence</h2>
              <p className="text-xs text-text-secondary">Stratified outcome rate across indicator categories</p>
            </div>
            <select
              value={selectedFeature}
              onChange={(e) => setSelectedFeature(e.target.value)}
              className="text-xs bg-background-secondary border border-border rounded-lg px-2.5 py-1.5 font-medium text-text-primary focus:outline-none focus:border-brand"
            >
              {features.map((f) => (
                <option key={f.column} value={f.column}>
                  {f.label} ({f.column})
                </option>
              ))}
            </select>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={
                  distributionData?.type === 'binned'
                    ? distributionData.bins
                    : distributionData?.categories || []
                }
                margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F0E4E8" vertical={false} />
                <XAxis
                  dataKey={distributionData?.type === 'binned' ? 'range' : 'category'}
                  stroke="#77717A"
                  fontSize={10}
                  angle={-20}
                  textAnchor="end"
                />
                <YAxis stroke="#77717A" fontSize={10} tickFormatter={(val) => `${val}%`} />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    name === 'diabetes_rate' ? `${value}% Diabetes` : Number(value).toLocaleString(),
                    name === 'diabetes_rate' ? 'Observed Prevalence' : 'Respondents'
                  ]}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #F0E4E8', fontSize: '11px' }}
                />
                <Bar dataKey="diabetes_rate" fill="#C84B65" radius={[4, 4, 0, 0]} name="diabetes_rate" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-text-secondary text-center">
            Bars indicate percentage of participants in each bracket diagnosed with diabetes.
          </p>
        </div>

        {/* Target Correlations */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-xs space-y-4">
          <div className="border-b border-border pb-3">
            <h2 className="text-sm font-bold text-text-primary">Correlation with Diabetes Outcome</h2>
            <p className="text-xs text-text-secondary">Linear Pearson correlation coefficients with target</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={correlations?.target_correlations || []}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F0E4E8" horizontal={false} />
                <XAxis type="number" stroke="#77717A" fontSize={10} domain={[-0.15, 0.35]} />
                <YAxis
                  dataKey="feature"
                  type="category"
                  stroke="#77717A"
                  fontSize={10}
                  width={90}
                />
                <Tooltip
                  formatter={(val: any) => [val, 'Correlation']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #F0E4E8', fontSize: '11px' }}
                />
                <Bar dataKey="correlation" radius={[0, 4, 4, 0]}>
                  {(correlations?.target_correlations || []).map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.correlation > 0 ? '#C84B65' : '#47866C'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 text-[11px] text-text-secondary">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-brand" />
              <span>Positive association (Increases probability)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-status-success" />
              <span>Negative association (Protective)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Schema Table with Search */}
      <div className="bg-white border border-border rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <h2 className="text-base font-bold text-text-primary">BRFSS Feature Dictionary & Summary Statistics</h2>
            <p className="text-xs text-text-secondary">Detailed empirical parameters computed from real CSV records</p>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-text-secondary" />
            <input
              type="text"
              placeholder="Search features..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs pl-9 pr-4 py-2 rounded-xl bg-background-secondary border border-border focus:outline-none focus:border-brand w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-text-secondary bg-background-secondary/50">
                <th className="py-2.5 px-3 font-semibold">Column Name</th>
                <th className="py-2.5 px-3 font-semibold">Label & Description</th>
                <th className="py-2.5 px-3 font-semibold">Data Type</th>
                <th className="py-2.5 px-3 font-semibold text-right">Mean</th>
                <th className="py-2.5 px-3 font-semibold text-right">Std Dev</th>
                <th className="py-2.5 px-3 font-semibold text-right">Min</th>
                <th className="py-2.5 px-3 font-semibold text-right">Median</th>
                <th className="py-2.5 px-3 font-semibold text-right">Max</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredFeatures.map((f) => (
                <tr key={f.column} className="hover:bg-background-secondary/40 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-medium text-brand">
                    {f.column}
                    {f.is_target && (
                      <span className="ml-2 text-[10px] bg-brand text-white px-1.5 py-0.5 rounded font-sans">
                        TARGET
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 max-w-xs">
                    <p className="font-semibold text-text-primary">{f.label}</p>
                    <p className="text-[11px] text-text-secondary truncate">{f.description}</p>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-text-secondary">{f.data_type}</td>
                  <td className="py-2.5 px-3 text-right font-mono">{f.mean}</td>
                  <td className="py-2.5 px-3 text-right font-mono">{f.std}</td>
                  <td className="py-2.5 px-3 text-right font-mono">{f.min}</td>
                  <td className="py-2.5 px-3 text-right font-mono">{f.median}</td>
                  <td className="py-2.5 px-3 text-right font-mono">{f.max}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginated Real CSV Sample Rows Preview */}
      <div className="bg-white border border-border rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-base font-bold text-text-primary">Live Dataset Observation Records</h2>
            <p className="text-xs text-text-secondary">
              Viewing records {sampleOffset + 1} to {Math.min(sampleOffset + sampleLimit, totalSampleRows)} of {totalSampleRows.toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSampleOffset(Math.max(0, sampleOffset - sampleLimit))}
              disabled={sampleOffset === 0}
              className="p-1.5 rounded-lg border border-border hover:bg-background-secondary disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-text-secondary px-2">
              Page {Math.floor(sampleOffset / sampleLimit) + 1}
            </span>
            <button
              onClick={() => setSampleOffset(sampleOffset + sampleLimit)}
              disabled={sampleOffset + sampleLimit >= totalSampleRows}
              className="p-1.5 rounded-lg border border-border hover:bg-background-secondary disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-border text-text-secondary bg-background-secondary/50">
                {features.slice(0, 10).map((f) => (
                  <th key={f.column} className="py-2 px-3 font-semibold whitespace-nowrap">
                    {f.column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sampleRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-background-secondary/40">
                  {features.slice(0, 10).map((f) => (
                    <td key={f.column} className="py-2 px-3 whitespace-nowrap text-text-primary">
                      {row[f.column]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
