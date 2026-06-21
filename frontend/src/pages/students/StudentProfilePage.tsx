import React, { useEffect, useState } from 'react';
import { studentsApi, resultsApi, grievancesApi } from '../../api/client';
import { Student, Transcript, Grievance } from '../../types';
import { useNavigate } from 'react-router-dom';
import { Download, AlertTriangle, Award, BookOpen, TrendingUp, MessageSquare, Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const gradeColor = (g: string) => {
  if (['A+','A','A-'].includes(g)) return '#16a34a';
  if (['B+','B','B-'].includes(g)) return '#2563eb';
  if (['C+','C','C-'].includes(g)) return '#d97706';
  if (['D+','D'].includes(g))      return '#9a3412';
  return '#dc2626';
};

const StudentProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [student, setStudent]       = useState<Student | null>(null);
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [activeTab, setActiveTab]   = useState<'results'|'grievances'|'profile'>('results');
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, gRes] = await Promise.all([
          studentsApi.list(),
          grievancesApi.list(),
        ]);
        const students = sRes.data.results || sRes.data;
        if (students.length > 0) {
          const me = students[0];
          setStudent(me);
          const tRes = await resultsApi.transcript(me.id);
          setTranscript(tRes.data);
        }
        setGrievances(gRes.data.results || gRes.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const downloadPDF = async () => {
    if (!student) return;
    try {
      const res = await resultsApi.transcriptPDF(student.index_number);
      const url = URL.createObjectURL(new Blob([res.data], { type:'application/pdf' }));
      const a = document.createElement('a'); a.href=url; a.download=`my_transcript.pdf`; a.click();
    } catch { alert('Failed to generate PDF.'); }
  };

  if (loading) return <div className="loading-spinner">Loading your profile…</div>;
  if (!student) return <div className="empty-state"><h3>Profile not found</h3></div>;

  const gpaData = transcript?.semesters.map(s => ({
    name: `Y${s.year_of_study}S${s.semester}`,
    GPA: s.semester_gpa,
  })) || [];

  const tabs = [
    { key:'results',    label:'Results & Transcript' },
    { key:'grievances', label:`Grievances (${grievances.length})` },
    { key:'profile',    label:'Profile Details' },
  ] as const;

  return (
    <div>
      {/* Header banner */}
      <div style={{
        background:'linear-gradient(135deg, var(--navy), var(--navy-mid))',
        color:'white', padding:'28px', borderRadius:16, marginBottom:24
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:16 }}>
          <div>
            <div style={{ fontSize:22, fontWeight:900 }}>{student.full_name}</div>
            <div style={{ opacity:0.75, fontSize:13, marginTop:4 }}>
              {student.programme_name} · {student.department_name}
            </div>
            <div style={{ display:'flex', gap:16, marginTop:12, flexWrap:'wrap' }}>
              {[
                { l:'Index Number', v:student.index_number },
                { l:'Reference',    v:student.reference_number || '—' },
                { l:'Year',         v:`Year ${student.current_year}` },
                { l:'Status',       v:student.status },
              ].map(item => (
                <div key={item.l}>
                  <div style={{ fontSize:10, opacity:0.6, textTransform:'uppercase', letterSpacing:'0.6px' }}>{item.l}</div>
                  <div style={{ fontWeight:700, fontSize:13, fontFamily: item.l==='Index Number'?'DM Mono,monospace':undefined, textTransform:'capitalize' }}>{item.v}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:10 }}>
            <div style={{ background:'rgba(255,255,255,0.15)', borderRadius:12, padding:'14px 20px', textAlign:'center', backdropFilter:'blur(10px)' }}>
              <div style={{ fontSize:36, fontWeight:900, fontFamily:'DM Mono,monospace' }}>
                {transcript?.cumulative_gpa.toFixed(2) || '—'}
              </div>
              <div style={{ fontSize:11, opacity:0.8 }}>Cumulative GPA</div>
              <div style={{ marginTop:6, padding:'3px 10px', borderRadius:20, background:'rgba(255,255,255,0.2)', fontSize:11, fontWeight:700 }}>
                {transcript?.academic_standing || '—'}
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={downloadPDF}>
              <Download size={13} /> Download Transcript
            </button>
          </div>
        </div>
      </div>

      {transcript?.in_academic_danger && (
        <div className="danger-banner" style={{ marginBottom:20 }}>
          <AlertTriangle size={24} color="var(--red)" />
          <div>
            <strong>Academic Danger Alert</strong>
            <span>GPA: {transcript.cumulative_gpa.toFixed(2)} — Trail courses: {transcript.trail_count}. Please contact your academic advisor urgently.</span>
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[
          { icon:<Award size={18}/>,      label:'CuGPA',         value:transcript?.cumulative_gpa.toFixed(2)||'—', cls:'gold' },
          { icon:<BookOpen size={18}/>,   label:'Credits',        value:transcript?.total_credits_earned||0,         cls:'blue' },
          { icon:<AlertTriangle size={18}/>,label:'Trails',       value:transcript?.trail_count||0,                 cls:'red' },
          { icon:<TrendingUp size={18}/>, label:'Semesters Done', value:transcript?.semesters.length||0,            cls:'navy' },
        ].map((s,i) => (
          <div key={i} className="stat-card">
            <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
            <div><div className="stat-value" style={{ fontSize:22 }}>{s.value}</div><div className="stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, marginBottom:20, background:'var(--gray-100)', borderRadius:10, padding:4, width:'fit-content' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            padding:'9px 18px', borderRadius:8, border:'none', cursor:'pointer',
            fontFamily:'Sora,sans-serif', fontWeight:600, fontSize:13, transition:'all 0.15s',
            background: activeTab===t.key ? 'white' : 'transparent',
            color: activeTab===t.key ? 'var(--navy)' : 'var(--gray-500)',
            boxShadow: activeTab===t.key ? 'var(--shadow-sm)' : 'none',
          }}>{t.label}</button>
        ))}
      </div>

      {/* RESULTS TAB */}
      {activeTab === 'results' && (
        <>
          {gpaData.length > 0 && (
            <div className="card" style={{ marginBottom:20 }}>
              <div className="card-header"><h2>GPA Trend</h2></div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={gpaData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
                    <XAxis dataKey="name" tick={{ fontSize:12 }} />
                    <YAxis domain={[0,4]} tick={{ fontSize:12 }} />
                    <Tooltip formatter={(v:any) => [Number(v).toFixed(2),'GPA']} />
                    <Line type="monotone" dataKey="GPA" stroke="var(--blue)" strokeWidth={2.5} dot={{ r:5,fill:'var(--blue)' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {transcript?.semesters.map((sem, si) => (
            <div key={si} className="semester-block">
              <div className="semester-title">
                <span>Year {sem.year_of_study} — Semester {sem.semester} ({sem.academic_year})</span>
                <span className="font-mono" style={{ fontWeight:800 }}>SGPA: {sem.semester_gpa.toFixed(2)} | Credits: {sem.total_credits}</span>
              </div>
              <div className="card overflow-x-auto">
                <table>
                  <thead>
                    <tr><th>Code</th><th>Course</th><th>Cr</th><th>CA</th><th>Exam</th><th>Total</th><th>Grade</th><th>GP</th></tr>
                  </thead>
                  <tbody>
                    {sem.courses.map((c,ci) => (
                      <tr key={ci} style={{ background:c.grade==='F'?'#fff5f5':undefined }}>
                        <td><span className="font-mono" style={{ fontSize:12 }}>{c.code}</span></td>
                        <td>{c.title} {c.is_trail && <span className="badge badge-gold" style={{ marginLeft:4 }}>Trail</span>}</td>
                        <td style={{ textAlign:'center' }}>{c.credit_hours}</td>
                        <td style={{ textAlign:'center' }}>{c.ca ?? '—'}</td>
                        <td style={{ textAlign:'center' }}>{c.exam ?? '—'}</td>
                        <td style={{ textAlign:'center', fontWeight:700 }}>{c.total ?? '—'}</td>
                        <td style={{ textAlign:'center' }}>
                          <span style={{ fontFamily:'monospace', fontWeight:900, fontSize:15, color:gradeColor(c.grade) }}>{c.grade}</span>
                        </td>
                        <td style={{ textAlign:'center', fontFamily:'monospace' }}>{c.grade_point.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {!transcript?.semesters.length && (
            <div className="empty-state">
              <BookOpen size={48} color="var(--gray-300)" />
              <h3>No published results yet</h3>
            </div>
          )}
        </>
      )}

      {/* GRIEVANCES TAB */}
      {activeTab === 'grievances' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h3 style={{ fontSize:16, fontWeight:700, color:'var(--navy)' }}>My Grievances</h3>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/grievances')}>
              <Plus size={13} /> Raise a Concern
            </button>
          </div>
          {grievances.length === 0 ? (
            <div className="empty-state" style={{ padding:'40px 20px' }}>
              <MessageSquare size={40} color="var(--gray-300)" />
              <h3>No grievances yet</h3>
              <p>Use the Grievances page to raise any concerns about your results or registration.</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {grievances.map(g => (
                <div key={g.id} className="card" style={{ cursor:'pointer', padding:'14px 20px' }}
                  onClick={() => navigate(`/grievances/${g.id}`)}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ fontWeight:700, color:'var(--navy)', marginBottom:4 }}>{g.subject}</div>
                      <div style={{ fontSize:12, color:'var(--gray-500)' }}>
                        {new Date(g.created_at).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                      <span className={`badge ${g.status==='open'?'badge-gold':g.status==='in_review'?'badge-blue':g.status==='resolved'?'badge-green':'badge-gray'}`}>
                        {g.status.replace('_',' ')}
                      </span>
                      <span className={`badge ${g.priority==='high'?'badge-red':g.priority==='medium'?'badge-gold':'badge-gray'}`}>
                        {g.priority}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PROFILE TAB */}
      {activeTab === 'profile' && (
        <div className="card">
          <div className="card-header"><h2>Personal Information</h2></div>
          <div className="card-body">
            <div className="grid-2" style={{ gap:16 }}>
              {[
                { label:'Full Name',       value: student.full_name },
                { label:'Index Number',    value: student.index_number },
                { label:'Reference No.',   value: student.reference_number || '—' },
                { label:'Email',           value: student.email || '—' },
                { label:'Phone',           value: student.phone || '—' },
                { label:'Department',      value: student.department_name },
                { label:'Programme',       value: student.programme_name },
                { label:'Current Year',    value: `Year ${student.current_year}` },
                { label:'Current Semester',value: `Semester ${student.current_semester}` },
                { label:'Year of Admission',value: String(student.year_of_admission) },
                { label:'Status',          value: student.status },
                { label:'Academic Standing',value: transcript?.academic_standing || '—' },
              ].map(item => (
                <div key={item.label} style={{ padding:'12px 16px', background:'var(--gray-50)', borderRadius:8, border:'1px solid var(--gray-200)' }}>
                  <div style={{ fontSize:11, color:'var(--gray-500)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:4 }}>
                    {item.label}
                  </div>
                  <div style={{ fontWeight:600, color:'var(--navy)', textTransform:'capitalize' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfilePage;
