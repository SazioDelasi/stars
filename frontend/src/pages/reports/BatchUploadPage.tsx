import React, { useState, useRef } from 'react';
import { reportsApi } from '../../api/client';
import { Upload, CheckCircle, XCircle, AlertTriangle, FileText, Download } from 'lucide-react';

interface UploadResult {
  success: number;
  duplicates: number;
  failed: number;
  total_rows: number;
  errors: { row: number; index_number: string; course_code: string; errors: string[] }[];
  preview: { row: number; index_number: string; course_code: string; ca: number; exam: number; status: string }[];
}

const BatchUploadPage: React.FC = () => {
  const [file, setFile]         = useState<File | null>(null);
  const [isDragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult]     = useState<UploadResult | null>(null);
  const [error, setError]       = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!f.name.match(/\.(csv|xlsx|xls)$/i)) {
      setError('Only CSV or Excel files (.csv, .xlsx, .xls) are accepted.');
      return;
    }
    setFile(f);
    setResult(null);
    setError('');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await reportsApi.batchUpload(fd);
      setResult(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Upload failed. Please try again.');
    } finally { setUploading(false); }
  };

  const downloadTemplate = () => {
    const csv = 'index_number,course_code,ca,exam,semester,academic_year,year_of_study\nUEB2100101,CSE101,35,52,1,2023/2024,1\nUEB2100102,CSE101,28,40,1,2023/2024,1\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'uenr_stars_batch_template.csv'; a.click();
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'var(--navy)' }}>Batch Result Upload</h1>
          <p style={{ color:'var(--gray-500)', fontSize:13 }}>
            Upload CSV or Excel files to enter results for multiple students at once
          </p>
        </div>
        <button className="btn btn-secondary" onClick={downloadTemplate}>
          <Download size={14} /> Download Template
        </button>
      </div>

      {/* Format guide */}
      <div className="alert alert-info" style={{ marginBottom:20 }}>
        <AlertTriangle size={16} />
        <div>
          <strong>Required columns:</strong>{' '}
          <span className="font-mono" style={{ fontSize:12 }}>
            index_number, course_code, ca (0–40), exam (0–60), semester (1 or 2), academic_year (e.g. 2023/2024), year_of_study
          </span>
          <br />
          <span style={{ fontSize:12 }}>Download the template above to get started quickly.</span>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        style={{
          border: `2px dashed ${isDragging ? 'var(--blue)' : file ? 'var(--green)' : 'var(--gray-300)'}`,
          borderRadius: 16, padding: '48px 24px', textAlign: 'center',
          background: isDragging ? 'var(--sky)' : file ? '#f0fdf4' : 'var(--gray-50)',
          cursor: 'pointer', transition: 'all 0.15s', marginBottom: 20,
        }}
      >
        <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls"
          style={{ display:'none' }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        {file ? (
          <>
            <FileText size={40} color="var(--green)" style={{ margin:'0 auto 12px' }} />
            <div style={{ fontWeight:700, fontSize:16, color:'var(--green)' }}>{file.name}</div>
            <div style={{ fontSize:12, color:'var(--gray-500)', marginTop:4 }}>
              {(file.size/1024).toFixed(1)} KB — click to change
            </div>
          </>
        ) : (
          <>
            <Upload size={40} color="var(--gray-400)" style={{ margin:'0 auto 12px' }} />
            <div style={{ fontWeight:700, fontSize:16, color:'var(--navy)' }}>
              Drop your CSV or Excel file here
            </div>
            <div style={{ fontSize:13, color:'var(--gray-500)', marginTop:4 }}>
              or click to browse
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom:16 }}>
          <XCircle size={16} /><span>{error}</span>
        </div>
      )}

      {file && !result && (
        <div style={{ display:'flex', justifyContent:'center', marginBottom:24 }}>
          <button className="btn btn-primary" style={{ padding:'12px 32px' }}
            onClick={handleUpload} disabled={uploading}>
            <Upload size={15} /> {uploading ? 'Uploading…' : `Upload "${file.name}"`}
          </button>
        </div>
      )}

      {/* Upload Result */}
      {result && (
        <>
          {/* Summary cards */}
          <div style={{
            display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20
          }}>
            {[
              { label:'Total Rows',  value:result.total_rows,  color:'var(--navy)' },
              { label:'Saved',       value:result.success,     color:'var(--green)' },
              { label:'Duplicates',  value:result.duplicates,  color:'var(--gold)' },
              { label:'Failed',      value:result.failed,      color:result.failed>0?'var(--red)':'var(--gray-500)' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div>
                  <div className="stat-value" style={{ color:s.color }}>{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {result.success > 0 && (
            <div className="alert alert-success" style={{ marginBottom:16 }}>
              <CheckCircle size={16} />
              <span><strong>{result.success} results saved successfully</strong> as drafts. Publish them from the Result Entry page.</span>
            </div>
          )}

          {result.duplicates > 0 && (
            <div className="alert alert-warning" style={{ marginBottom:16 }}>
              <AlertTriangle size={16} />
              <span><strong>{result.duplicates} duplicate rows</strong> were skipped (results already exist for these student-course combinations).</span>
            </div>
          )}

          {/* Errors */}
          {result.errors.length > 0 && (
            <div className="card" style={{ marginBottom:20 }}>
              <div className="card-header">
                <h2 style={{ color:'var(--red)' }}>
                  <XCircle size={16} style={{ marginRight:8 }} />
                  {result.errors.length} Validation Errors
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>Row</th><th>Index Number</th><th>Course Code</th><th>Errors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.errors.map((e, i) => (
                      <tr key={i} style={{ background:'#fff5f5' }}>
                        <td style={{ color:'var(--gray-500)' }}>{e.row}</td>
                        <td><span className="font-mono" style={{ fontSize:12 }}>{e.index_number || '—'}</span></td>
                        <td><span className="font-mono" style={{ fontSize:12 }}>{e.course_code || '—'}</span></td>
                        <td>
                          {e.errors.map((msg, mi) => (
                            <div key={mi} style={{ fontSize:12, color:'var(--red)', display:'flex', alignItems:'flex-start', gap:4 }}>
                              <span>•</span><span>{msg}</span>
                            </div>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Preview */}
          {result.preview.length > 0 && (
            <div className="card">
              <div className="card-header"><h2>Processed Rows Preview</h2></div>
              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>Row</th><th>Index Number</th><th>Course Code</th>
                      <th>CA</th><th>Exam</th><th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.preview.map((r, i) => (
                      <tr key={i}>
                        <td style={{ color:'var(--gray-500)' }}>{r.row}</td>
                        <td><span className="font-mono" style={{ fontSize:12 }}>{r.index_number}</span></td>
                        <td><span className="font-mono" style={{ fontSize:12 }}>{r.course_code}</span></td>
                        <td style={{ textAlign:'center' }}>{r.ca}</td>
                        <td style={{ textAlign:'center' }}>{r.exam}</td>
                        <td>
                          <span className={`badge ${r.status==='queued'?'badge-green':r.status==='duplicate'?'badge-gold':'badge-red'}`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div style={{ marginTop:16, display:'flex', justifyContent:'center' }}>
            <button className="btn btn-secondary" onClick={() => { setFile(null); setResult(null); }}>
              Upload Another File
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default BatchUploadPage;
