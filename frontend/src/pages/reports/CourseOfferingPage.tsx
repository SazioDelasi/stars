import React, { useEffect, useState } from 'react';
import { reportsApi, resultsApi, studentsApi } from '../../api/client';
import { CourseOfferingReport, AcademicYear, Course, Department } from '../../types';
import { useAuth } from '../../context/AuthContext';
import ReportFilters from '../../components/ReportFilters';
import SummaryCards from '../../components/SummaryCards';
import ExportButtons from '../../components/ExportButtons';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Legend
} from 'recharts';
import { AlertTriangle, BookOpen } from 'lucide-react';

const GRADE_COLORS: Record<string, string> = {
  'A+':'#16a34a','A':'#16a34a','A-':'#22c55e',
  'B+':'#2563eb','B':'#3b82f6','B-':'#60a5fa',
  'C+':'#d97706','C':'#f59e0b','C-':'#fbbf24',
  'D+':'#9a3412','D':'#b45309','F':'#dc2626',
};

const CourseOfferingPage: React.FC = () => {
  const { user } = useAuth();
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [selCourse, setSelCourse]   = useState('');
  const [selYear, setSelYear]       = useState('');
  const [selSem, setSelSem]         = useState('');
  const [selYOS, setSelYOS]         = useState('');
  const [selDept, setSelDept]       = useState('');

  const [orderBy, setOrderBy] = useState('index');
  const [descending, setDescending] = useState(false);
  const [report, setReport]   = useState<CourseOfferingReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      resultsApi.academicYears(),
      resultsApi.courses(),
      studentsApi.departments(),
    ]).then(([ay, c, d]) => {
      const years: AcademicYear[] = ay.data.results || ay.data;
      setAcademicYears(years);
      setCourses(c.data.results || c.data);
      setDepartments(d.data.results || d.data);
      const curr = years.find(y => y.is_current);
      if (curr) setSelYear(String(curr.id));
    });
  }, []);

  const generate = async () => {
    if (!selCourse) return alert('Please select a course.');
    setLoading(true);
    try {
      const params: Record<string, string> = { course_id: selCourse };
      if (selYear) params.academic_year_id = selYear;
      if (selSem) params.semester = selSem;
      if (selYOS) params.year_of_study = selYOS;
      if (selDept && user?.is_university_coordinator) params.department_id = selDept;
      params.order_by = orderBy;
      params.desc = String(descending);
      const res = await reportsApi.courseOffering(params);
      setReport(res.data);
    } catch (e: any) { alert(e?.response?.data?.error || 'Failed to generate.'); }
    finally { setLoading(false); }
  };

  const params = () => {
    const p: Record<string,string> = { course_id: selCourse };
    if (selYear) p.academic_year_id = selYear;
    if (selSem)  p.semester = selSem;
    if (selDept && user?.is_university_coordinator) p.department_id = selDept;
    return p;
  };

  const gradeDistData = report
    ? Object.entries(report.analytics.grade_distribution)
        .map(([grade, count]) => ({ grade, count, color: GRADE_COLORS[grade] || '#64748b' }))
        .sort((a,b) => Object.keys(GRADE_COLORS).indexOf(a.grade) - Object.keys(GRADE_COLORS).indexOf(b.grade))
    : [];

  const isUni = user?.role === 'university_coordinator';

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)' }}>Course Offering Report</h1>
        <p style={{ color: 'var(--gray-500)', fontSize: 13 }}>
          All students offering a specific course — analytics, grade distribution, exports
        </p>
      </div>

      <ReportFilters
        loading={loading}
        onGenerate={generate}
        filters={[
          ...(isUni ? [{
            key: 'dept', label: 'Department', value: selDept,
            onChange: setSelDept,
            options: [{ value:'', label:'All Departments' }, ...departments.map(d => ({ value: String(d.id), label: d.name }))],
          }] : []),
          {
            key: 'course', label: 'Course *', value: selCourse, onChange: setSelCourse,
            options: [{ value:'', label:'Select course…' }, ...courses.map(c => ({ value: String(c.id), label: `${c.code} — ${c.title}` }))],
          },
          {
            key: 'year', label: 'Academic Year', value: selYear, onChange: setSelYear,
            options: [{ value:'', label:'All Years' }, ...academicYears.map(y => ({ value: String(y.id), label: y.label + (y.is_current?' (Current)':'') }))],
          },
          {
            key: 'sem', label: 'Semester', value: selSem, onChange: setSelSem,
            options: [{ value:'', label:'All Semesters' }, { value:'1', label:'Semester 1' }, { value:'2', label:'Semester 2' }],
          },
          {
            key: 'yos', label: 'Year of Study', value: selYOS, onChange: setSelYOS,
            options: [{ value:'', label:'All Years' }, ...([1,2,3,4].map(y => ({ value: String(y), label: `Year ${y}` })))],
          },
        ]}
        extraButtons={report && (
          <ExportButtons
            exports={[
              { label: 'PDF', icon: '📄', fetch: () => reportsApi.courseOfferingPDF(params()), filename: `course_${selCourse}.pdf`, mime: 'application/pdf' },
              { label: 'Excel', icon: '📊', fetch: () => reportsApi.courseOfferingExcel(params()), filename: `course_${selCourse}.xlsx`, mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
              { label: 'CSV', icon: '📋', fetch: () => reportsApi.courseOfferingCSV(params()), filename: `course_${selCourse}.csv`, mime: 'text/csv' },
            ]}
          />
        )}
      />

      {report && (
        <>
          {/* Course info */}
          <div style={{
            background: 'linear-gradient(135deg, var(--navy), var(--navy-mid))',
            color: 'white', padding: '16px 24px', borderRadius: 12, marginBottom: 20
          }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>
              {report.course.code} — {report.course.title}
            </div>
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
              Department: {report.course.department} · {report.course.credit_hours} credit hours
            </div>
          </div>

          {/* Analytics cards */}
          <SummaryCards stats={[
            { label: 'Total Students',   value: report.analytics.total_students },
            { label: 'Passed',           value: report.analytics.pass_count,    color: 'var(--green)' },
            { label: 'Failed',           value: report.analytics.fail_count,    color: 'var(--red)' },
            { label: 'Pass Rate',        value: `${report.analytics.pass_rate}%`, color: 'var(--green)' },
            { label: 'Avg Score',        value: report.analytics.avg_score },
            { label: 'Highest Score',    value: report.analytics.highest_score  },
            { label: 'Lowest Score',     value: report.analytics.lowest_score,  color: 'var(--gray-500)' },
          ]} />

          {/* Charts */}
          {gradeDistData.length > 0 && (
            <div className="grid-2" style={{ marginBottom: 20 }}>
              <div className="card">
                <div className="card-header"><h2>Grade Distribution</h2></div>
                <div className="card-body">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={gradeDistData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
                      <XAxis dataKey="grade" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[4,4,0,0]}>
                        {gradeDistData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="card">
                <div className="card-header"><h2>Pass vs Fail</h2></div>
                <div className="card-body">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: `Pass (${report.analytics.pass_rate}%)`, value: report.analytics.pass_count },
                          { name: `Fail (${report.analytics.fail_rate}%)`, value: report.analytics.fail_count },
                        ]}
                        cx="50%" cy="50%" outerRadius={80} dataKey="value"
                      >
                        <Cell fill="var(--green)" />
                        <Cell fill="var(--red)" />
                      </Pie>
                      <Legend />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Ordering controls */}
          <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:12, flexWrap:'wrap' }}>
            <span style={{ fontSize:12, color:'var(--gray-500)', fontWeight:600 }}>Sort by:</span>
            {[
              {key:'index', label:'Index No.'},
              {key:'name',  label:'Name'},
              {key:'gpa',   label:'GPA'},
              {key:'year',  label:'Year'},
            ].map(opt => (
              <button
                key={opt.key}
                className={`btn btn-sm ${orderBy===opt.key ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => { if(orderBy===opt.key) setDescending(!descending); else { setOrderBy(opt.key); setDescending(false); } }}
              >
                {opt.label} {orderBy===opt.key ? (descending ? '↓' : '↑') : ''}
              </button>
            ))}
          </div>

          {/* Results table */}
          <div className="card">
            <div className="card-header">
              <h2>Student Results ({report.rows.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>#</th><th>Index No.</th><th>Name</th>
                    {isUni && <th>Department</th>}
                    <th>Programme</th><th>Yr</th>
                    <th>CA</th><th>Exam</th><th>Total</th>
                    <th>Grade</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {report.rows.map((r, i) => (
                    <tr key={r.student_id} style={{ background: !r.pass ? '#fff5f5' : undefined }}>
                      <td style={{ color: 'var(--gray-500)' }}>{i+1}</td>
                      <td><span className="font-mono" style={{ fontSize: 12 }}>{r.index_number}</span></td>
                      <td style={{ fontWeight: 600 }}>{r.full_name}</td>
                      {isUni && <td style={{ fontSize: 12 }}>{r.department}</td>}
                      <td style={{ fontSize: 12 }}>{r.programme}</td>
                      <td style={{ textAlign: 'center' }}>{r.year_of_study}</td>
                      <td style={{ textAlign: 'center' }}>{r.ca ?? '—'}</td>
                      <td style={{ textAlign: 'center' }}>{r.exam ?? '—'}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>{r.total ?? '—'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          fontFamily: 'monospace', fontWeight: 900, fontSize: 15,
                          color: GRADE_COLORS[r.grade] || 'var(--gray-700)'
                        }}>{r.grade}</span>
                      </td>
                      <td>
                        <span className={`badge ${r.pass ? 'badge-green' : 'badge-red'}`}>
                          {r.pass ? 'Pass' : 'Fail'}
                        </span>
                        {r.is_trail && <span className="badge badge-gold" style={{ marginLeft: 4 }}>Trail</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!report && !loading && (
        <div className="empty-state">
          <BookOpen size={48} color="var(--gray-300)" />
          <h3>Select a course and generate the report</h3>
          <p>Choose filters above and click Generate.</p>
        </div>
      )}
    </div>
  );
};

export default CourseOfferingPage;
