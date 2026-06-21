import React, { useEffect, useState } from 'react';
import { studentsApi, resultsApi, reportsApi } from '../../api/client';
import { Student, AcademicYear, Course, CourseResult } from '../../types';
import { Save, CheckCircle, AlertCircle, Lock, Unlock, History, Edit2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ResultRow {
  student_id: number;
  result_id?: number;
  student_name: string;
  index_number: string;
  ca: string;
  exam: string;
  total?: number;
  grade?: string;
  gradeColor?: string;
  is_published?: boolean;
  is_locked?: boolean;
}

const computeGrade = (total: number): { grade: string; color: string } => {
  if (total >= 80) return { grade: 'A+', color: '#16a34a' };
  if (total >= 75) return { grade: 'A',  color: '#16a34a' };
  if (total >= 70) return { grade: 'A-', color: '#22c55e' };
  if (total >= 67) return { grade: 'B+', color: '#2563eb' };
  if (total >= 63) return { grade: 'B',  color: '#2563eb' };
  if (total >= 60) return { grade: 'B-', color: '#3b82f6' };
  if (total >= 57) return { grade: 'C+', color: '#d97706' };
  if (total >= 53) return { grade: 'C',  color: '#d97706' };
  if (total >= 50) return { grade: 'C-', color: '#f59e0b' };
  if (total >= 47) return { grade: 'D+', color: '#9a3412' };
  if (total >= 40) return { grade: 'D',  color: '#9a3412' };
  return { grade: 'F', color: '#dc2626' };
};

/* ── Edit Modal ── */
interface EditModalProps {
  row: ResultRow;
  onClose: () => void;
  onSave: (resultId: number, ca: number, exam: number, reason: string) => Promise<void>;
  isUniCoord: boolean;
}

const EditModal: React.FC<EditModalProps> = ({ row, onClose, onSave, isUniCoord }) => {
  const [ca, setCa]         = useState(row.ca);
  const [exam, setExam]     = useState(row.exam);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!row.result_id) return;
    if (!reason.trim()) { alert('Please provide a reason for this edit.'); return; }
    setSaving(true);
    try { await onSave(row.result_id, parseFloat(ca), parseFloat(exam), reason); onClose(); }
    catch (e: any) { alert(e?.response?.data?.error || 'Save failed.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Result — {row.student_name}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={15} /></button>
        </div>
        <div className="modal-body">
          {row.is_locked && !isUniCoord && (
            <div className="alert alert-danger"><Lock size={14} /><span>This result is locked. Only the University Coordinator can edit it.</span></div>
          )}
          {row.is_locked && isUniCoord && (
            <div className="alert alert-warning"><Lock size={14} /><span>This result is locked. Your edit will be logged as an override.</span></div>
          )}
          <div className="grid-2" style={{ gap: 12 }}>
            <div className="form-group">
              <label className="form-label">CA Score (0 – 40)</label>
              <input type="number" min={0} max={40} className="form-control"
                value={ca} onChange={e => setCa(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Exam Score (0 – 60)</label>
              <input type="number" min={0} max={60} className="form-control"
                value={exam} onChange={e => setExam(e.target.value)} />
            </div>
          </div>
          {ca && exam && (
            <div style={{ background: 'var(--sky)', borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
              Preview: <strong>{(parseFloat(ca) + parseFloat(exam)).toFixed(1)}</strong> →{' '}
              <strong style={{ color: computeGrade(parseFloat(ca) + parseFloat(exam)).color, fontSize: 16 }}>
                {computeGrade(parseFloat(ca) + parseFloat(exam)).grade}
              </strong>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Reason for Edit *</label>
            <textarea className="form-control" style={{ minHeight: 80 }}
              placeholder="e.g. Marking error identified, script re-marked by HOD..."
              value={reason} onChange={e => setReason(e.target.value)} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}
            disabled={saving || (row.is_locked && !isUniCoord)}>
            <Save size={14} /> {saving ? 'Saving…' : 'Save Edit'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Audit Log Modal ── */
const AuditModal: React.FC<{ resultId: number; onClose: () => void }> = ({ resultId, onClose }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsApi.resultLogs(resultId)
      .then(res => setLogs(res.data))
      .finally(() => setLoading(false));
  }, [resultId]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Audit Log</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={15} /></button>
        </div>
        <div className="modal-body">
          {loading ? <div className="loading-spinner" style={{ height: 120 }}>Loading…</div>
            : logs.length === 0
              ? <div className="empty-state" style={{ padding: '24px 0' }}><p>No edits recorded.</p></div>
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {logs.map((l, i) => (
                    <div key={i} style={{ padding: '12px 16px', background: l.is_override ? '#fef9c3' : 'var(--gray-50)', borderRadius: 8, border: `1px solid ${l.is_override ? '#fde047' : 'var(--gray-200)'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: 13 }}>{l.edited_by}</span>
                        <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                          {new Date(l.timestamp).toLocaleString('en-GB')}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <span>CA: <del style={{ color: 'var(--red)' }}>{l.old_ca}</del> → <strong>{l.new_ca}</strong></span>
                        <span>Exam: <del style={{ color: 'var(--red)' }}>{l.old_exam}</del> → <strong>{l.new_exam}</strong></span>
                        <span>Grade: <del style={{ color: 'var(--red)' }}>{l.old_grade}</del> → <strong style={{ color: 'var(--green)' }}>{l.new_grade}</strong></span>
                        {l.is_override && <span className="badge badge-gold">Override</span>}
                      </div>
                      {l.reason && <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 4 }}>Reason: {l.reason}</div>}
                    </div>
                  ))}
                </div>
              )
          }
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
const ResultEntryPage: React.FC = () => {
  const { user } = useAuth();
  const isUniCoord = user?.role === 'university_coordinator';

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [courses, setCourses]             = useState<Course[]>([]);
  const [students, setStudents]           = useState<Student[]>([]);

  const [selYear, setSelYear]       = useState('');
  const [selSem, setSelSem]         = useState('1');
  const [selYOS, setSelYOS]         = useState('1');
  const [selCourse, setSelCourse]   = useState('');

  const [rows, setRows]     = useState<ResultRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('success');
  const [publishing, setPublishing] = useState(false);

  const [editRow, setEditRow]     = useState<ResultRow | null>(null);
  const [auditId, setAuditId]     = useState<number | null>(null);

  /* load lookups */
  useEffect(() => {
    Promise.all([resultsApi.academicYears(), studentsApi.list()]).then(([ay, s]) => {
      const years: AcademicYear[] = ay.data.results || ay.data;
      setAcademicYears(years);
      setStudents(s.data.results || s.data);
      const curr = years.find(y => y.is_current);
      if (curr) setSelYear(String(curr.id));
    });
  }, []);

  /* reload courses when year-of-study/semester changes */
  useEffect(() => {
    if (!selYOS || !selSem) return;
    resultsApi.courses({ year: selYOS, semester: selSem }).then(res =>
      setCourses(res.data.results || res.data));
  }, [selYOS, selSem]);

  /* load existing results when course selected */
  useEffect(() => {
    if (!selCourse || students.length === 0) { setRows([]); return; }
    const filtered = students.filter(s => String(s.current_year) === selYOS);

    resultsApi.courseResults({
      course: selCourse,
      academic_year: selYear,
      semester: selSem,
    }).then(res => {
      const existing: CourseResult[] = res.data.results || res.data;
      const existingMap = new Map(existing.map(r => [r.student, r]));

      setRows(filtered.map(s => {
        const ex = existingMap.get(s.id);
        const ca   = ex?.continuous_assessment != null ? String(ex.continuous_assessment) : '';
        const exam = ex?.exam_score != null              ? String(ex.exam_score) : '';
        const total = ex?.total_score ?? undefined;
        const gradeInfo = total !== undefined ? computeGrade(total) : undefined;
        return {
          student_id:   s.id,
          result_id:    ex?.id,
          student_name: s.full_name,
          index_number: s.index_number,
          ca, exam,
          total,
          grade:       gradeInfo?.grade,
          gradeColor:  gradeInfo?.color,
          is_published: ex?.is_published,
          is_locked:    ex?.is_locked,
        };
      }));
    }).catch(() => {
      setRows(filtered.map(s => ({
        student_id: s.id, student_name: s.full_name,
        index_number: s.index_number, ca: '', exam: '',
      })));
    });
  }, [selCourse, students, selYear, selSem, selYOS]);

  const updateRow = (idx: number, field: 'ca' | 'exam', val: string) => {
    setRows(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: val };
      const ca   = parseFloat(field === 'ca'   ? val : updated[idx].ca);
      const exam = parseFloat(field === 'exam' ? val : updated[idx].exam);
      if (!isNaN(ca) && !isNaN(exam)) {
        const total = ca + exam;
        const { grade, color } = computeGrade(total);
        updated[idx] = { ...updated[idx], total, grade, gradeColor: color };
      } else {
        updated[idx] = { ...updated[idx], total: undefined, grade: undefined };
      }
      return updated;
    });
  };

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setMsg(text); setMsgType(type);
    setTimeout(() => setMsg(''), 4000);
  };

  const handleSave = async () => {
    if (!selCourse || !selYear) return;
    setSaving(true);
    let ok = 0, fail = 0;
    for (const row of rows) {
      if (!row.ca && !row.exam) continue;
      try {
        await resultsApi.createResult({
          student: row.student_id,
          course: Number(selCourse),
          academic_year: Number(selYear),
          semester: Number(selSem),
          year_of_study: Number(selYOS),
          continuous_assessment: row.ca ? parseFloat(row.ca) : null,
          exam_score: row.exam ? parseFloat(row.exam) : null,
          is_published: false,
        });
        ok++;
      } catch { fail++; }
    }
    setSaving(false);
    showMsg(`${ok} saved${fail > 0 ? `, ${fail} failed` : ''}.`, fail > 0 ? 'error' : 'success');
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const res = await resultsApi.publishResults({
        department_id: students[0]?.department,
        academic_year_id: Number(selYear),
        semester: Number(selSem),
        year_of_study: Number(selYOS),
      });
      showMsg(`✅ ${res.data.message}`);
    } catch { showMsg('Publish failed.', 'error'); }
    finally { setPublishing(false); }
  };

  const handleEditSave = async (resultId: number, ca: number, exam: number, reason: string) => {
    await reportsApi.editResult(resultId, { ca, exam, reason });
    showMsg('Result updated and audit log saved.');
    // refresh rows
    setRows(prev => prev.map(r => {
      if (r.result_id !== resultId) return r;
      const total = ca + exam;
      const { grade, color } = computeGrade(total);
      return { ...r, ca: String(ca), exam: String(exam), total, grade, gradeColor: color };
    }));
  };

  const handleLock = async (row: ResultRow) => {
    if (!row.result_id) return;
    const newLock = !row.is_locked;
    if (!newLock && !isUniCoord) {
      alert('Only the University Coordinator can unlock results.');
      return;
    }
    await reportsApi.lockResult(row.result_id, newLock);
    setRows(prev => prev.map(r =>
      r.result_id === row.result_id ? { ...r, is_locked: newLock } : r));
    showMsg(`Result ${newLock ? 'locked' : 'unlocked'}.`);
  };

  const filledRows = rows.filter(r => r.ca || r.exam);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)' }}>Result Entry</h1>
        <p style={{ color: 'var(--gray-500)', fontSize: 13 }}>
          Enter, edit, publish and lock student results
        </p>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><h2>Select Parameters</h2></div>
        <div className="card-body">
          <div className="grid-2" style={{ gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Academic Year</label>
              <select className="form-control" value={selYear} onChange={e => setSelYear(e.target.value)}>
                <option value="">Select…</option>
                {academicYears.map(y => (
                  <option key={y.id} value={y.id}>{y.label}{y.is_current ? ' (Current)' : ''}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Year of Study</label>
              <select className="form-control" value={selYOS} onChange={e => setSelYOS(e.target.value)}>
                {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Semester</label>
              <select className="form-control" value={selSem} onChange={e => setSelSem(e.target.value)}>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Course</label>
              <select className="form-control" value={selCourse} onChange={e => setSelCourse(e.target.value)}>
                <option value="">Select course…</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.code} — {c.title} ({c.credit_hours} cr)</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {msg && (
        <div className={`alert ${msgType === 'success' ? 'alert-success' : 'alert-danger'}`}
          style={{ marginBottom: 16 }}>
          <CheckCircle size={15} /><span>{msg}</span>
        </div>
      )}

      {rows.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2>
              {courses.find(c => String(c.id) === selCourse)?.title ?? 'Results'}
              <span style={{ fontSize: 12, color: 'var(--gray-500)', fontWeight: 400, marginLeft: 8 }}>
                ({rows.length} students)
              </span>
            </h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={handleSave} disabled={saving}>
                <Save size={13} /> {saving ? 'Saving…' : 'Save Draft'}
              </button>
              <button className="btn btn-success btn-sm" onClick={handlePublish}
                disabled={publishing || filledRows.length === 0}>
                <CheckCircle size={13} /> {publishing ? 'Publishing…' : 'Publish All'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Index No.</th><th>Name</th>
                  <th>CA (0–40)</th><th>Exam (0–60)</th>
                  <th>Total</th><th>Grade</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={row.student_id}
                    style={{ background: row.grade === 'F' ? '#fff5f5' : row.is_locked ? '#f0fdf4' : undefined }}>
                    <td style={{ color: 'var(--gray-500)', fontSize: 12 }}>{idx + 1}</td>
                    <td><span className="font-mono" style={{ fontSize: 12 }}>{row.index_number}</span></td>
                    <td style={{ fontWeight: 600 }}>{row.student_name}</td>
                    <td>
                      {row.is_locked ? (
                        <span className="font-mono">{row.ca || '—'}</span>
                      ) : (
                        <input type="number" min={0} max={40} className="form-control"
                          style={{ width: 88 }} value={row.ca}
                          onChange={e => updateRow(idx, 'ca', e.target.value)}
                          placeholder="0–40" />
                      )}
                    </td>
                    <td>
                      {row.is_locked ? (
                        <span className="font-mono">{row.exam || '—'}</span>
                      ) : (
                        <input type="number" min={0} max={60} className="form-control"
                          style={{ width: 88 }} value={row.exam}
                          onChange={e => updateRow(idx, 'exam', e.target.value)}
                          placeholder="0–60" />
                      )}
                    </td>
                    <td style={{ fontWeight: 700, fontFamily: 'monospace', textAlign: 'center' }}>
                      {row.total !== undefined ? row.total.toFixed(1) : '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {row.grade && (
                        <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 16, color: row.gradeColor }}>
                          {row.grade}
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {row.is_published && <span className="badge badge-green">Published</span>}
                        {row.is_locked   && <span className="badge badge-navy"><Lock size={9} /> Locked</span>}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {row.result_id && (
                          <>
                            <button className="btn btn-ghost btn-sm"
                              title="Edit result"
                              onClick={() => setEditRow(row)}
                              disabled={row.is_locked && !isUniCoord}>
                              <Edit2 size={13} />
                            </button>
                            <button className="btn btn-ghost btn-sm"
                              title={row.is_locked ? 'Unlock' : 'Lock'}
                              onClick={() => handleLock(row)}>
                              {row.is_locked ? <Unlock size={13} /> : <Lock size={13} />}
                            </button>
                            <button className="btn btn-ghost btn-sm"
                              title="Audit log"
                              onClick={() => setAuditId(row.result_id!)}>
                              <History size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ padding: '14px 24px', borderTop: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>
              {filledRows.length} of {rows.length} rows filled
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={handleSave} disabled={saving}>
                <Save size={13} /> Save Draft
              </button>
              <button className="btn btn-success btn-sm" onClick={handlePublish}
                disabled={publishing || filledRows.length === 0}>
                <CheckCircle size={13} /> Publish All
              </button>
            </div>
          </div>
        </div>
      )}

      {rows.length === 0 && selCourse && (
        <div className="empty-state">
          <AlertCircle size={48} color="var(--gray-300)" />
          <h3>No students found for Year {selYOS}</h3>
        </div>
      )}

      {!selCourse && (
        <div className="empty-state" style={{ padding: '40px 20px' }}>
          <h3>Select a course above to begin</h3>
        </div>
      )}

      {editRow  && <EditModal  row={editRow}  onClose={() => setEditRow(null)}
                               onSave={handleEditSave} isUniCoord={isUniCoord} />}
      {auditId  && <AuditModal resultId={auditId} onClose={() => setAuditId(null)} />}
    </div>
  );
};

export default ResultEntryPage;
