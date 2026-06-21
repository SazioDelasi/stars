import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentsApi, resultsApi } from '../../api/client';
import { Student, Transcript } from '../../types';
import { ArrowLeft, AlertTriangle, Download, Award, BookOpen, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const gradeColor = (grade: string) => {
  if (['A+','A','A-'].includes(grade)) return '#16a34a';
  if (['B+','B','B-'].includes(grade)) return '#2563eb';
  if (['C+','C','C-'].includes(grade)) return '#d97706';
  if (['D+','D'].includes(grade)) return '#9a3412';
  return '#dc2626';
};

const StudentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, tRes] = await Promise.all([
          studentsApi.get(Number(id)),
          resultsApi.transcript(Number(id)),
        ]);
        setStudent(sRes.data);
        setTranscript(tRes.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  const downloadPDF = async () => {
    if (!student) return;
    try {
      const res = await resultsApi.transcriptPDF(student.index_number);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcript_${student.index_number}.pdf`;
      a.click();
    } catch (err) { alert('Failed to generate PDF.'); }
  };

  if (loading) return <div className="loading-spinner">Loading student profile...</div>;
  if (!student || !transcript) return <div className="empty-state"><h3>Student not found</h3></div>;

  const gpaData = transcript.semesters.map(s => ({
    name: `Y${s.year_of_study}S${s.semester}`,
    GPA: s.semester_gpa,
  }));

  const standingColorMap: Record<string, string> = {
    'First Class': '#92400e',
    'Second Class Upper': '#166534',
    'Second Class Lower': '#1e40af',
    'Third Class': '#374151',
    'Fail': '#991b1b',
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/students')}>
          <ArrowLeft size={14} /> Back
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy)' }}>Student Profile</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={downloadPDF}>
            <Download size={14} /> Download Transcript PDF
          </button>
        </div>
      </div>

      {transcript.in_academic_danger && (
        <div className="danger-banner">
          <AlertTriangle size={24} color="var(--red)" />
          <div>
            <strong>Academic Danger</strong>
            <span>CuGPA below threshold or {transcript.trail_count} trail course(s). Requires immediate academic intervention.</span>
          </div>
        </div>
      )}

      {/* Student Info Header */}
      <div className="transcript-header" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2>{transcript.student_info.full_name}</h2>
            <p style={{ opacity: 0.8, fontSize: 13 }}>{transcript.student_info.programme}</p>
            <div className="transcript-meta">
              <div className="transcript-meta-item">
                <span>Index Number</span>
                <strong style={{ fontFamily: 'monospace', fontSize: 16 }}>{transcript.student_info.index_number}</strong>
              </div>
              <div className="transcript-meta-item">
                <span>Department</span>
                <strong>{transcript.student_info.department}</strong>
              </div>
              <div className="transcript-meta-item">
                <span>Year / Semester</span>
                <strong>Year {transcript.student_info.current_year}</strong>
              </div>
              <div className="transcript-meta-item">
                <span>Status</span>
                <strong style={{ textTransform: 'capitalize' }}>{transcript.student_info.status}</strong>
              </div>
              <div className="transcript-meta-item">
                <span>Admission Year</span>
                <strong>{transcript.student_info.year_of_admission}</strong>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 16, padding: '16px 24px', backdropFilter: 'blur(10px)'
            }}>
              <div style={{ fontSize: 40, fontWeight: 900, fontFamily: 'DM Mono, monospace' }}>
                {transcript.cumulative_gpa.toFixed(2)}
              </div>
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>Cumulative GPA</div>
              <div style={{
                marginTop: 8, padding: '4px 12px', borderRadius: 20,
                background: 'rgba(255,255,255,0.2)', fontSize: 12, fontWeight: 700
              }}>
                {transcript.academic_standing}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon gold"><Award size={20} /></div>
          <div>
            <div className="stat-value" style={{ fontSize: 22 }}>{transcript.cumulative_gpa.toFixed(2)}</div>
            <div className="stat-label">CuGPA</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><BookOpen size={20} /></div>
          <div>
            <div className="stat-value">{transcript.total_credits_earned}</div>
            <div className="stat-label">Credits Earned</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><AlertTriangle size={20} /></div>
          <div>
            <div className="stat-value" style={{ color: transcript.trail_count > 0 ? 'var(--red)' : 'var(--navy)' }}>
              {transcript.trail_count}
            </div>
            <div className="stat-label">Trail Courses</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><TrendingUp size={20} /></div>
          <div>
            <div className="stat-value" style={{ fontSize: 14, lineHeight: 1.4, color: standingColorMap[transcript.academic_standing] || 'var(--navy)' }}>
              {transcript.academic_standing}
            </div>
            <div className="stat-label">Standing</div>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* GPA Chart */}
        {gpaData.length > 0 && (
          <div className="card">
            <div className="card-header"><h2>GPA Trend</h2></div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={gpaData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 4]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="GPA" stroke="var(--blue)" strokeWidth={2.5} dot={{ r: 5, fill: 'var(--blue)' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Semester Summary */}
        <div className="card">
          <div className="card-header"><h2>Semester Summary</h2></div>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Semester GPA</th>
                  <th>Credits</th>
                  <th>Courses</th>
                </tr>
              </thead>
              <tbody>
                {transcript.semesters.map((sem, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: 12 }}>Y{sem.year_of_study} S{sem.semester} <span style={{ color: 'var(--gray-500)' }}>({sem.academic_year})</span></td>
                    <td>
                      <span className="font-mono" style={{ fontWeight: 800, color: gpaData[i]?.GPA >= 3 ? 'var(--green)' : gpaData[i]?.GPA >= 2 ? 'var(--blue)' : 'var(--red)' }}>
                        {sem.semester_gpa.toFixed(2)}
                      </span>
                    </td>
                    <td>{sem.total_credits}</td>
                    <td>{sem.courses.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Full Transcript */}
      {transcript.semesters.map((sem, si) => (
        <div key={si} className="semester-block">
          <div className="semester-title">
            <span>Year {sem.year_of_study} — Semester {sem.semester} ({sem.academic_year})</span>
            <span className="font-mono" style={{ fontSize: 14, fontWeight: 800 }}>
              GPA: {sem.semester_gpa.toFixed(2)} | Credits: {sem.total_credits}
            </span>
          </div>
          <div className="card overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th>Course Title</th>
                  <th>Credit Hrs</th>
                  <th>CA (40)</th>
                  <th>Exam (60)</th>
                  <th>Total</th>
                  <th>Grade</th>
                  <th>Grade Point</th>
                  <th>Remark</th>
                </tr>
              </thead>
              <tbody>
                {sem.courses.map((c, ci) => (
                  <tr key={ci} style={{ background: c.grade === 'F' ? '#fff5f5' : undefined }}>
                    <td><span className="font-mono" style={{ fontSize: 12 }}>{c.code}</span></td>
                    <td style={{ maxWidth: 220 }}>{c.title}</td>
                    <td style={{ textAlign: 'center' }}>{c.credit_hours}</td>
                    <td style={{ textAlign: 'center' }}>{c.ca ?? '—'}</td>
                    <td style={{ textAlign: 'center' }}>{c.exam ?? '—'}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{c.total ?? '—'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        fontFamily: 'monospace', fontWeight: 900, fontSize: 15,
                        color: gradeColor(c.grade)
                      }}>{c.grade}</span>
                    </td>
                    <td style={{ textAlign: 'center', fontFamily: 'monospace' }}>{c.grade_point.toFixed(1)}</td>
                    <td>
                      {c.is_trail && <span className="badge badge-gold">Trail</span>}
                      {c.grade === 'F' && <span className="badge badge-red">Failed</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {transcript.semesters.length === 0 && (
        <div className="empty-state">
          <BookOpen size={48} color="var(--gray-300)" />
          <h3>No Results Published Yet</h3>
          <p>Results will appear here once they are published by the department.</p>
        </div>
      )}
    </div>
  );
};

export default StudentDetailPage;
