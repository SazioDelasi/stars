import React, { useEffect, useState } from 'react';
import { registrationApi, studentsApi, resultsApi } from '../../api/client';
import { CourseRegistration, Programme, AcademicYear } from '../../types';
import { CheckCircle, XCircle, Eye, RefreshCw, Users } from 'lucide-react';

const statusColor: Record<string, string> = {
  submitted: 'badge-gold', approved: 'badge-green', rejected: 'badge-red',
};

const StaffRegistrationPage: React.FC = () => {
  const [registrations, setRegistrations] = useState<CourseRegistration[]>([]);
  const [summary, setSummary]     = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);

  // Filters
  const [statusFilter, setStatusFilter]   = useState('submitted');
  const [yearFilter, setYearFilter]       = useState('');
  const [progFilter, setProgFilter]       = useState('');
  const [semFilter, setSemFilter]         = useState('');
  const [ayFilter, setAyFilter]           = useState('');

  const [activeReg, setActiveReg]   = useState<CourseRegistration | null>(null);
  const [notes, setNotes]           = useState('');
  const [acting, setActing]         = useState(false);
  const [msg, setMsg]               = useState('');
  const [msgType, setMsgType]       = useState<'success'|'error'>('success');

  const flash = (text: string, type: 'success'|'error' = 'success') => {
    setMsg(text); setMsgType(type); setTimeout(() => setMsg(''), 3500);
  };

  useEffect(() => {
    Promise.all([studentsApi.programmes(), resultsApi.academicYears()]).then(([p, ay]) => {
      setProgrammes(p.data.results || p.data);
      const years: AcademicYear[] = ay.data.results || ay.data;
      setAcademicYears(years);
      const curr = years.find(y => y.is_current);
      if (curr) setAyFilter(String(curr.id));
    });
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const params: Record<string,string> = {};
      // Never show drafts
      if (statusFilter) params.status = statusFilter;
      if (yearFilter)   params.year_of_study = yearFilter;
      if (semFilter)    params.semester = semFilter;
      if (ayFilter)     params.academic_year = ayFilter;
      const [rRes, sRes] = await Promise.all([
        registrationApi.staffList(params),
        registrationApi.summary(),
      ]);
      let regs: CourseRegistration[] = rRes.data.results || rRes.data;
      // Filter by programme client-side (registration model doesn't have programme directly)
      if (progFilter) {
        regs = regs.filter(r =>
          (r as any).student_programme_id === Number(progFilter) ||
          (r as any).student_programme === progFilter
        );
      }
      setRegistrations(regs);
      setSummary(sRes.data);
    } catch { flash('Failed to load.', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [statusFilter, yearFilter, semFilter, ayFilter]);

  const handleSelect = async (reg: CourseRegistration) => {
    setActiveReg(reg); setNotes('');
    try {
      const res = await fetch(`/api/registration/all/${reg.id}/`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      if (res.ok) setActiveReg(await res.json());
    } catch {}
  };

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!activeReg) return;
    if (action === 'reject' && !notes.trim()) {
      flash('Enter a reason for rejection.', 'error'); return;
    }
    setActing(true);
    try {
      await registrationApi.staffAction(activeReg.id, action, notes);
      flash(`Registration ${action}d.`);
      setActiveReg(null); setNotes('');
      await load();
    } catch (e: any) {
      flash(e?.response?.data?.error || `Failed to ${action}.`, 'error');
    } finally { setActing(false); }
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'});

  // Summary counts excluding drafts
  const pendingCount  = summary?.submitted ?? 0;
  const approvedCount = summary?.approved  ?? 0;
  const rejectedCount = summary?.rejected  ?? 0;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)' }}>
          Registration Management
        </h1>
        <p style={{ color: 'var(--gray-500)', fontSize: 13 }}>
          Review and approve student course registrations
        </p>
      </div>

      {/* Summary — no draft */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {[
          { label: 'Pending Approval', value: pendingCount,  cls: 'gold' },
          { label: 'Approved',         value: approvedCount, cls: 'green' },
          { label: 'Rejected',         value: rejectedCount, cls: 'red' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className={`stat-icon ${s.cls}`}><Users size={18}/></div>
            <div>
              <div className="stat-value" style={{ fontSize: 22 }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {msg && (
        <div className={`alert ${msgType==='success'?'alert-success':'alert-danger'}`}
          style={{ marginBottom: 16 }}>
          <CheckCircle size={14}/><span>{msg}</span>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label className="form-label">Academic Year</label>
              <select className="form-control" value={ayFilter}
                onChange={e => setAyFilter(e.target.value)}>
                <option value="">All Years</option>
                {academicYears.map(y => (
                  <option key={y.id} value={y.id}>{y.label}{y.is_current?' (Current)':''}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 130 }}>
              <label className="form-label">Semester</label>
              <select className="form-control" value={semFilter}
                onChange={e => setSemFilter(e.target.value)}>
                <option value="">Both Semesters</option>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 130 }}>
              <label className="form-label">Year of Study</label>
              <select className="form-control" value={yearFilter}
                onChange={e => setYearFilter(e.target.value)}>
                <option value="">All Years</option>
                {[1,2,3,4].map(y=><option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label className="form-label">Programme</label>
              <select className="form-control" value={progFilter}
                onChange={e => setProgFilter(e.target.value)}>
                <option value="">All Programmes</option>
                {programmes.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label className="form-label">Status</label>
              <select className="form-control" value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}>
                <option value="submitted">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="">All</option>
              </select>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={load} title="Refresh">
              <RefreshCw size={13}/>
            </button>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 20, alignItems: 'flex-start' }}>
        {/* List */}
        <div>
          {loading ? (
            <div className="loading-spinner" style={{ height: 120 }}>Loading…</div>
          ) : registrations.length === 0 ? (
            <div className="card">
              <div className="empty-state" style={{ padding: '32px' }}>
                <Users size={40} color="var(--gray-300)"/>
                <h3>No {statusFilter || ''} registrations</h3>
                <p>Adjust your filters above.</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {registrations.map(reg => (
                <div key={reg.id} className="card" style={{
                  cursor: 'pointer', padding: '14px 18px',
                  border: activeReg?.id===reg.id ? '2px solid var(--blue)' : '1px solid var(--gray-200)',
                }} onClick={() => handleSelect(reg)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 14 }}>
                        {reg.student_name}
                      </div>
                      <div style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--gray-500)' }}>
                        {reg.student_index}
                        {(reg as any).student_dept && (
                          <span style={{ marginLeft: 8, fontFamily: 'Sora, sans-serif' }}>
                            · {(reg as any).student_dept}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>
                        {reg.academic_year_label} · S{reg.semester} · Y{reg.year_of_study}
                        · {reg.course_count ?? 0} courses · {reg.total_credits} cr
                      </div>
                      {reg.submitted_at && (
                        <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>
                          Submitted: {fmt(reg.submitted_at)}
                        </div>
                      )}
                    </div>
                    <span className={`badge ${statusColor[reg.status] || 'badge-gray'}`}>
                      {reg.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {activeReg ? (
          <div className="card">
            <div className="card-header">
              <div>
                <h2>{activeReg.student_name}</h2>
                <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--gray-500)' }}>
                  {activeReg.student_index}
                </div>
              </div>
              <span className={`badge ${statusColor[activeReg.status] || 'badge-gray'}`}>
                {activeReg.status}
              </span>
            </div>
            <div className="card-body">
              {/* Course list */}
              {activeReg.registered_courses && activeReg.registered_courses.length > 0 ? (
                <div className="overflow-x-auto" style={{ marginBottom: 16 }}>
                  <table>
                    <thead>
                      <tr><th>Code</th><th>Course</th><th>Credits</th><th>Type</th></tr>
                    </thead>
                    <tbody>
                      {activeReg.registered_courses.map(rc => (
                        <tr key={rc.id}>
                          <td><span className="font-mono" style={{ fontSize: 12 }}>{rc.course_code}</span></td>
                          <td>{rc.course_title}</td>
                          <td style={{ textAlign: 'center' }}>{rc.credit_hours}</td>
                          <td>
                            <span className={`badge ${rc.is_core ? 'badge-blue' : 'badge-green'}`}>
                              {rc.is_core ? 'Core' : 'Elective'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 16,
                  padding: '12px', background: 'var(--gray-50)', borderRadius: 8 }}>
                  {activeReg.course_count ?? 0} courses · {activeReg.total_credits} credits total
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between',
                padding: '10px 0', marginBottom: 16,
                borderTop: '1px solid var(--gray-100)', borderBottom: '1px solid var(--gray-100)' }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Total Credits</span>
                <strong className="font-mono">{activeReg.total_credits}</strong>
              </div>

              {activeReg.status === 'submitted' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Notes (required for rejection)</label>
                    <textarea className="form-control" style={{ minHeight: 72, resize: 'vertical' }}
                      placeholder="Add notes or rejection reason…"
                      value={notes} onChange={e => setNotes(e.target.value)}/>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-success" style={{ flex: 1, justifyContent: 'center' }}
                      onClick={() => handleAction('approve')} disabled={acting}>
                      <CheckCircle size={14}/> Approve
                    </button>
                    <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }}
                      onClick={() => handleAction('reject')} disabled={acting}>
                      <XCircle size={14}/> Reject
                    </button>
                  </div>
                </>
              )}
              {activeReg.status === 'approved' && (
                <div className="alert alert-success">
                  <CheckCircle size={14}/>
                  <span>Approved{activeReg.approved_by_name ? ` by ${activeReg.approved_by_name}` : ''}</span>
                </div>
              )}
              {activeReg.status === 'rejected' && (
                <div className="alert alert-danger">
                  <XCircle size={14}/>
                  <span>Rejected{activeReg.notes ? ` — ${activeReg.notes}` : ''}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="empty-state" style={{ padding: '48px 20px' }}>
              <Eye size={40} color="var(--gray-300)"/>
              <h3>Select a registration to review</h3>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffRegistrationPage;