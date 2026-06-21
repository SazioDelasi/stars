import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { studentsApi, resultsApi } from '../../api/client';
import { Transcript } from '../../types';
import { Download, AlertTriangle, Award, BookOpen, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const gradeColor = (grade: string) => {
  if (['A+','A','A-'].includes(grade)) return '#16a34a';
  if (['B+','B','B-'].includes(grade)) return '#2563eb';
  if (['C+','C','C-'].includes(grade)) return '#d97706';
  if (['D+','D'].includes(grade)) return '#9a3412';
  return '#dc2626';
};

const ResultsPage: React.FC = () => {
  const { user } = useAuth();
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [studentId, setStudentId] = useState<number | null>(null);
  const [indexNumber, setIndexNumber] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const sRes = await studentsApi.list();
        const students = sRes.data.results || sRes.data;
        if (students.length > 0) {
          const me = students[0];
          setStudentId(me.id);
          setIndexNumber(me.index_number);
          const tRes = await resultsApi.transcript(me.id);
          setTranscript(tRes.data);
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const downloadPDF = async () => {
    if (!indexNumber) return;
    try {
      const res = await resultsApi.transcriptPDF(indexNumber);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `my_transcript.pdf`;
      a.click();
    } catch { alert('Failed to generate PDF.'); }
  };

  if (loading) return <div className="loading-spinner">Loading your results...</div>;

  if (!transcript) return (
    <div className="empty-state">
      <BookOpen size={48} color="var(--gray-300)" />
      <h3>No results available</h3>
      <p>Your results will appear here once published by your department.</p>
    </div>
  );

  const gpaData = transcript.semesters.map(s => ({
    name: `Y${s.year_of_study}S${s.semester}`,
    GPA: s.semester_gpa,
  }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)' }}>My Academic Transcript</h1>
          <p style={{ color: 'var(--gray-500)', fontSize: 13 }}>{transcript.student_info.programme} · {transcript.student_info.department}</p>
        </div>
        <button className="btn btn-primary" onClick={downloadPDF}>
          <Download size={14} /> Download PDF
        </button>
      </div>

      {transcript.in_academic_danger && (
        <div className="danger-banner">
          <AlertTriangle size={24} color="var(--red)" />
          <div>
            <strong>You are in Academic Danger</strong>
            <span>Your CuGPA ({transcript.cumulative_gpa.toFixed(2)}) is critically low or you have {transcript.trail_count} trail course(s). Please contact your academic advisor urgently.</span>
          </div>
        </div>
      )}

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon gold"><Award size={20} /></div>
          <div>
            <div className="stat-value" style={{ fontSize: 24 }}>{transcript.cumulative_gpa.toFixed(2)}</div>
            <div className="stat-label">Cumulative GPA</div>
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
            <div className="stat-value" style={{ color: transcript.trail_count > 0 ? 'var(--red)' : undefined }}>{transcript.trail_count}</div>
            <div className="stat-label">Trail Courses</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><TrendingUp size={20} /></div>
          <div>
            <div className="stat-value" style={{ fontSize: 14, lineHeight: 1.4 }}>{transcript.academic_standing}</div>
            <div className="stat-label">Academic Standing</div>
          </div>
        </div>
      </div>

      {gpaData.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header"><h2>GPA Trend Across Semesters</h2></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={gpaData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 4]} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: any) => [Number(v).toFixed(2), 'Semester GPA']} />
                <Line type="monotone" dataKey="GPA" stroke="var(--blue)" strokeWidth={2.5}
                  dot={{ r: 5, fill: 'var(--blue)' }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {transcript.semesters.map((sem, si) => (
        <div key={si} className="semester-block">
          <div className="semester-title">
            <span>Year {sem.year_of_study} — Semester {sem.semester} ({sem.academic_year})</span>
            <span className="font-mono" style={{ fontSize: 14, fontWeight: 800 }}>
              SGPA: {sem.semester_gpa.toFixed(2)} | Credits: {sem.total_credits}
            </span>
          </div>
          <div className="card overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Course Title</th>
                  <th>Cr. Hrs</th>
                  <th>CA (40)</th>
                  <th>Exam (60)</th>
                  <th>Total</th>
                  <th>Grade</th>
                  <th>GP</th>
                </tr>
              </thead>
              <tbody>
                {sem.courses.map((c, ci) => (
                  <tr key={ci} style={{ background: c.grade === 'F' ? '#fff5f5' : undefined }}>
                    <td><span className="font-mono" style={{ fontSize: 12 }}>{c.code}</span></td>
                    <td>{c.title} {c.is_trail && <span className="badge badge-gold" style={{ marginLeft: 4 }}>Trail</span>}</td>
                    <td style={{ textAlign: 'center' }}>{c.credit_hours}</td>
                    <td style={{ textAlign: 'center' }}>{c.ca ?? '—'}</td>
                    <td style={{ textAlign: 'center' }}>{c.exam ?? '—'}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{c.total ?? '—'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 15, color: gradeColor(c.grade) }}>{c.grade}</span>
                    </td>
                    <td style={{ textAlign: 'center', fontFamily: 'monospace', fontWeight: 600 }}>{c.grade_point.toFixed(1)}</td>
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
          <h3>No Published Results</h3>
          <p>Your results will appear here once your department publishes them.</p>
        </div>
      )}
    </div>
  );
};

export default ResultsPage;
