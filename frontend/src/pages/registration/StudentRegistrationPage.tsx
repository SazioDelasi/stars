import React, { useEffect, useState } from 'react';
import { registrationApi, resultsApi } from '../../api/client';
import { CourseRegistration, AcademicYear, AvailableCourses } from '../../types';
import {
  Plus, Trash2, Send, CheckCircle, Clock, X,
  BookOpen, AlertCircle, Lock, User, ChevronDown, ChevronUp
} from 'lucide-react';

const statusColor: Record<string, string> = {
  draft: 'badge-gray', submitted: 'badge-gold',
  approved: 'badge-green', rejected: 'badge-red',
};

const StudentRegistrationPage: React.FC = () => {
  const [registrations, setRegistrations] = useState<CourseRegistration[]>([]);
  const [academicYears, setAcademicYears]   = useState<AcademicYear[]>([]);
  const [activeReg, setActiveReg]           = useState<CourseRegistration | null>(null);
  const [available, setAvailable]           = useState<AvailableCourses | null>(null);
  const [loading, setLoading]               = useState(true);
  const [availLoading, setAvailLoading]     = useState(false);
  const [msg, setMsg]                       = useState('');
  const [msgType, setMsgType]               = useState<'success'|'error'|'info'>('success');
  const [showNewForm, setShowNewForm]       = useState(false);
  const [newYear, setNewYear]               = useState('');
  const [newSem, setNewSem]                 = useState('1');
  const [newYOS, setNewYOS]                 = useState('1');
  const [creating, setCreating]             = useState(false);
  const [submitting, setSubmitting]         = useState(false);
  const [showElectives, setShowElectives]   = useState(false);

  const flash = (text: string, type: 'success'|'error'|'info' = 'success') => {
    setMsg(text); setMsgType(type); setTimeout(() => setMsg(''), 4000);
  };

  const loadAll = async () => {
    try {
      const [rRes, ayRes] = await Promise.all([
        registrationApi.myList(), resultsApi.academicYears(),
      ]);
      const regs: CourseRegistration[] = rRes.data.results || rRes.data;
      setRegistrations(regs);
      const years: AcademicYear[] = ayRes.data.results || ayRes.data;
      setAcademicYears(years);
      const curr = years.find(y => y.is_current);
      if (curr) setNewYear(String(curr.id));
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, []);

  const openReg = async (reg: CourseRegistration) => {
    const detail = await registrationApi.myGet(reg.id);
    setActiveReg(detail.data);
    setAvailLoading(true);
    setAvailable(null);
    setShowElectives(false);
    try {
      const avRes = await registrationApi.available(reg.id);
      setAvailable(avRes.data);
    } catch { /* no available data */ }
    finally { setAvailLoading(false); }
  };

  const handleCreate = async () => {
    if (!newYear) return flash('Select an academic year.', 'error');
    setCreating(true);
    try {
      const res = await registrationApi.myCreate({
        academic_year: Number(newYear), semester: Number(newSem), year_of_study: Number(newYOS),
      });
      flash('Registration created. Core courses have been auto-added.');
      setShowNewForm(false);
      await loadAll();
      openReg(res.data);
    } catch (e: any) { flash(e?.response?.data?.error || 'Failed.', 'error'); }
    finally { setCreating(false); }
  };

  const handleAddElective = async (courseId: number, courseCode: string) => {
    if (!activeReg) return;
    try {
      await registrationApi.addElective(activeReg.id, courseId);
      flash(`${courseCode} added.`);
      const [detail, avail] = await Promise.all([
        registrationApi.myGet(activeReg.id),
        registrationApi.available(activeReg.id),
      ]);
      setActiveReg(detail.data); setAvailable(avail.data);
      await loadAll();
    } catch (e: any) { flash(e?.response?.data?.error || 'Could not add.', 'error'); }
  };

  const handleRemoveElective = async (courseId: number, courseCode: string) => {
    if (!activeReg) return;
    if (!window.confirm(`Remove elective ${courseCode}?`)) return;
    try {
      await registrationApi.removeElective(activeReg.id, courseId);
      flash(`${courseCode} removed.`);
      const [detail, avail] = await Promise.all([
        registrationApi.myGet(activeReg.id),
        registrationApi.available(activeReg.id),
      ]);
      setActiveReg(detail.data); setAvailable(avail.data);
      await loadAll();
    } catch (e: any) { flash(e?.response?.data?.error || 'Could not remove.', 'error'); }
  };

  const handleSubmit = async () => {
    if (!activeReg) return;
    if (!window.confirm('Submit registration for approval? You cannot edit it after this.')) return;
    setSubmitting(true);
    try {
      const res = await registrationApi.submit(activeReg.id);
      setActiveReg(res.data);
      flash('Submitted for approval.');
      await loadAll();
    } catch (e: any) { flash(e?.response?.data?.error || 'Submit failed.', 'error'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="loading-spinner">Loading…</div>;

  const coreCourses    = activeReg?.registered_courses?.filter(rc => rc.is_core)  || [];
  const electiveCourses= activeReg?.registered_courses?.filter(rc => !rc.is_core) || [];

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'var(--navy)' }}>Course Registration</h1>
          <p style={{ color:'var(--gray-500)', fontSize:13 }}>
            Core courses are automatically assigned. Add electives from the available list.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNewForm(!showNewForm)}>
          <Plus size={14} /> New Registration
        </button>
      </div>

      {msg && (
        <div className={`alert ${msgType==='success'?'alert-success':msgType==='error'?'alert-danger':'alert-info'}`}
          style={{ marginBottom:16 }}>
          <CheckCircle size={14} /><span>{msg}</span>
        </div>
      )}

      {showNewForm && (
        <div className="card" style={{ marginBottom:20 }}>
          <div className="card-header">
            <h2>Start New Registration</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowNewForm(false)}><X size={14}/></button>
          </div>
          <div className="card-body">
            <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'flex-end' }}>
              {[
                { label:'Academic Year', el: (
                  <select className="form-control" value={newYear} onChange={e=>setNewYear(e.target.value)}>
                    <option value="">Select…</option>
                    {academicYears.map(y=><option key={y.id} value={y.id}>{y.label}{y.is_current?' (Current)':''}</option>)}
                  </select>)},
                { label:'Year of Study', el: (
                  <select className="form-control" value={newYOS} onChange={e=>setNewYOS(e.target.value)}>
                    {[1,2,3,4].map(y=><option key={y} value={y}>Year {y}</option>)}
                  </select>)},
                { label:'Semester', el: (
                  <select className="form-control" value={newSem} onChange={e=>setNewSem(e.target.value)}>
                    <option value="1">Semester 1</option><option value="2">Semester 2</option>
                  </select>)},
              ].map(({label, el}) => (
                <div key={label} style={{ flex:1, minWidth:150, marginBottom:0 }}>
                  <label className="form-label">{label}</label>{el}
                </div>
              ))}
              <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
                {creating ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid-2" style={{ gap:20, alignItems:'flex-start' }}>
        {/* Registration list */}
        <div>
          <h3 style={{ fontSize:14, fontWeight:700, color:'var(--navy)', marginBottom:12 }}>My Registrations</h3>
          {registrations.length === 0 ? (
            <div className="card">
              <div className="empty-state" style={{ padding:'32px' }}>
                <BookOpen size={40} color="var(--gray-300)" />
                <h3>No registrations yet</h3>
              </div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {registrations.map(reg => (
                <div key={reg.id} className="card" style={{
                  cursor:'pointer', padding:'14px 18px',
                  border: activeReg?.id===reg.id ? '2px solid var(--blue)' : '1px solid var(--gray-200)',
                }} onClick={() => openReg(reg)}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ fontWeight:700, color:'var(--navy)' }}>
                        {reg.academic_year_label} — Semester {reg.semester}
                      </div>
                      <div style={{ fontSize:12, color:'var(--gray-500)', marginTop:2 }}>
                        Year {reg.year_of_study} · {reg.course_count ?? 0} courses · {reg.total_credits} cr
                      </div>
                    </div>
                    <span className={`badge ${statusColor[reg.status]}`}>{reg.status}</span>
                  </div>
                  {reg.status==='rejected' && (reg as any).notes && (
                    <div style={{ marginTop:8, fontSize:12, color:'var(--red)', fontStyle:'italic' }}>
                      Reason: {(reg as any).notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active registration detail */}
        {activeReg && (
          <div>
            <h3 style={{ fontSize:14, fontWeight:700, color:'var(--navy)', marginBottom:12 }}>
              {activeReg.academic_year_label} · S{activeReg.semester} · Year {activeReg.year_of_study}
              <span className={`badge ${statusColor[activeReg.status]}`} style={{ marginLeft:8 }}>{activeReg.status}</span>
            </h3>

            {/* Credit bar */}
            {available && (
              <div className="card" style={{ marginBottom:12, padding:'14px 18px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:13, fontWeight:600 }}>Credit Load</span>
                  <span className="font-mono" style={{
                    fontWeight:800,

                    color: available.current_total_credits >= 3 ? 'var(--green)' : 'var(--red)'
                  }}>
                    {available.current_total_credits} / {available.max_total_credits} cr
                  </span>
                </div>
                <div style={{ background:'var(--gray-200)', borderRadius:4, height:10, overflow:'hidden' }}>
                  <div style={{
                    width:`${Math.min(available.current_total_credits/available.max_total_credits*100,100)}%`,
                    background: available.current_total_credits > available.max_total_credits*0.85 ? 'var(--red)' : 'var(--green)',
                    height:10, transition:'width 0.3s'
                  }} />
                </div>
                <div style={{ fontSize:11, color:'var(--gray-500)', marginTop:4, display:'flex', justifyContent:'space-between' }}>
                  <span>Min 3 credits to submit</span>
                  <span>Electives: {available.current_elective_credits}/{available.max_elective_credits} cr</span>
                </div>
              </div>
            )}

            {/* Core courses */}
            <div className="card" style={{ marginBottom:12 }}>
              <div className="card-header">
                <h2 style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <Lock size={14} color="var(--blue)" /> Core Courses ({coreCourses.length})
                </h2>
                <span className="badge badge-blue">Auto-assigned</span>
              </div>
              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr><th>Code</th><th>Course</th><th>Credits</th><th>Lecturer</th></tr>
                  </thead>
                  <tbody>
                    {coreCourses.length === 0 ? (
                      <tr><td colSpan={4} style={{ textAlign:'center', color:'var(--gray-500)', padding:'20px' }}>
                        No core courses yet — create registration to auto-populate
                      </td></tr>
                    ) : coreCourses.map(rc => (
                      <tr key={rc.id}>
                        <td><span className="font-mono" style={{ fontSize:12 }}>{rc.course_code}</span></td>
                        <td style={{ fontWeight:500 }}>{rc.course_title}</td>
                        <td style={{ textAlign:'center' }}>{rc.credit_hours}</td>
                        <td style={{ fontSize:12, color:'var(--gray-500)' }}>
                          <User size={11} style={{ marginRight:4 }} />{rc.lecturer_name}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Elective courses */}
            <div className="card" style={{ marginBottom:12 }}>
              <div className="card-header">
                <h2>Elective Courses ({electiveCourses.length})</h2>
              </div>
              {electiveCourses.length === 0 ? (
                <div style={{ padding:'16px 20px', fontSize:13, color:'var(--gray-500)' }}>
                  No electives added yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table>
                    <thead>
                      <tr><th>Code</th><th>Course</th><th>Credits</th><th>Lecturer</th><th></th></tr>
                    </thead>
                    <tbody>
                      {electiveCourses.map(rc => (
                        <tr key={rc.id}>
                          <td><span className="font-mono" style={{ fontSize:12 }}>{rc.course_code}</span></td>
                          <td>{rc.course_title}</td>
                          <td style={{ textAlign:'center' }}>{rc.credit_hours}</td>
                          <td style={{ fontSize:12, color:'var(--gray-500)' }}>{rc.lecturer_name}</td>
                          <td>
                            {activeReg.status === 'draft' && (
                              <button className="btn btn-ghost btn-sm" style={{ color:'var(--red)' }}
                                onClick={() => handleRemoveElective(rc.course, rc.course_code)}>
                                <Trash2 size={13} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Add elective (draft only) */}
            {activeReg.status === 'draft' && available && available.elective_courses.length > 0 && (
              <div className="card" style={{ marginBottom:12 }}>
                <div
                  className="card-header"
                  style={{ cursor:'pointer' }}
                  onClick={() => setShowElectives(!showElectives)}
                >
                  <h2>Available Electives ({available.elective_courses.length})</h2>
                  {showElectives ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                </div>
                {showElectives && (
                  <div className="overflow-x-auto">
                    <table>
                      <thead>
                        <tr><th>Code</th><th>Course</th><th>Credits</th><th>Lecturer</th><th></th></tr>
                      </thead>
                      <tbody>
                        {available.elective_courses.map(c => (
                          <tr key={c.id}>
                            <td><span className="font-mono" style={{ fontSize:12 }}>{c.code}</span></td>
                            <td>{c.title}</td>
                            <td style={{ textAlign:'center' }}>{c.credit_hours}</td>
                            <td style={{ fontSize:12, color:'var(--gray-500)' }}>
                              <User size={11} style={{ marginRight:4 }} />{c.lecturer_name}
                            </td>
                            <td>
                              <button className="btn btn-primary btn-sm"
                                onClick={() => handleAddElective(c.id, c.code)}>
                                <Plus size={12} /> Add
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Submit */}
            {activeReg.status === 'draft' && (
              <button className="btn btn-success" style={{ width:'100%', justifyContent:'center', padding:'12px' }}
                onClick={handleSubmit} disabled={submitting || (activeReg.total_credits < 3)}>
                <Send size={14} /> {submitting ? 'Submitting…' : 'Submit for Approval'}
              </button>
            )}
            {activeReg.status === 'submitted' && (
              <div className="alert alert-info"><Clock size={14}/><span>Awaiting Head of Department approval.</span></div>
            )}
            {activeReg.status === 'approved' && (
              <div className="alert alert-success"><CheckCircle size={14}/><span>Registration approved.</span></div>
            )}
            {activeReg.status === 'rejected' && (
              <div className="alert alert-danger"><AlertCircle size={14}/>
                <div><strong>Rejected.</strong> {activeReg.notes && <span> {activeReg.notes}</span>}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentRegistrationPage;
