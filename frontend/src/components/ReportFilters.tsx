import React from 'react';
import { Filter, BarChart3 } from 'lucide-react';

interface Option { value: string; label: string; }

interface FilterConfig {
  key: string;
  label: string;
  options: Option[];
  value: string;
  onChange: (v: string) => void;
}

interface Props {
  filters: FilterConfig[];
  onGenerate: () => void;
  loading?: boolean;
  extraButtons?: React.ReactNode;
}

const ReportFilters: React.FC<Props> = ({ filters, onGenerate, loading, extraButtons }) => (
  <div className="card" style={{ marginBottom: 20 }}>
    <div className="card-header">
      <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Filter size={16} /> Report Filters
      </h2>
    </div>
    <div className="card-body">
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {filters.map(f => (
          <div key={f.key} style={{ flex: 1, minWidth: 140, marginBottom: 0 }}>
            <label className="form-label">{f.label}</label>
            <select className="form-control" value={f.value} onChange={e => f.onChange(e.target.value)}>
              {f.options.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, paddingBottom: 1 }}>
          <button className="btn btn-primary" onClick={onGenerate} disabled={loading}>
            <BarChart3 size={14} /> {loading ? 'Generating…' : 'Generate'}
          </button>
          {extraButtons}
        </div>
      </div>
    </div>
  </div>
);

export default ReportFilters;
