import React, { useState } from 'react';
import { Download, FileText, Table2, FileDown } from 'lucide-react';

interface ExportOption {
  label: string;
  icon: React.ReactNode;
  fetch: () => Promise<any>;
  filename: string;
  mime: string;
}

interface Props {
  exports: ExportOption[];
  disabled?: boolean;
}

const ExportButtons: React.FC<Props> = ({ exports, disabled }) => {
  const [loading, setLoading] = useState<string | null>(null);

  const handleExport = async (opt: ExportOption) => {
    setLoading(opt.label);
    try {
      const res = await opt.fetch();
      const url = URL.createObjectURL(new Blob([res.data], { type: opt.mime }));
      const a = document.createElement('a');
      a.href = url; a.download = opt.filename; a.click();
      URL.revokeObjectURL(url);
    } catch { alert(`Failed to export ${opt.label}`); }
    finally { setLoading(null); }
  };

  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {exports.map(opt => (
        <button
          key={opt.label}
          className="btn btn-secondary btn-sm"
          onClick={() => handleExport(opt)}
          disabled={disabled || loading === opt.label}
          title={`Download ${opt.label}`}
        >
          {loading === opt.label ? '…' : opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  );
};

export default ExportButtons;
