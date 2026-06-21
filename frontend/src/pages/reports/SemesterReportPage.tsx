import React, { useEffect, useState } from 'react';
import { reportsApi, resultsApi, studentsApi } from '../../api/client';
import { SemesterReportData, AcademicYear, Department, Programme } from '../../types';
import { useAuth } from '../../context/AuthContext';
import ReportFilters from '../../components/ReportFilters';
import SummaryCards from '../../components/SummaryCards';
import ExportButtons from '../../components/ExportButtons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

const SemesterReportPage: React.FC = () => {
  const { user } = useAuth();
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);

  const [selYear, setSelYear] = useState('');
  const [selSem, setSelSem]   = useState('1');
  const [selDept, setSelDept] = useState('');
  const [selProg, setSelProg] = useState('');
  const [selYOS, setSelYOS]   = useState('');

  const [report, setReport]   = useState<SemesterReportData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      resultsApi.academicYears(),
      studentsApi.departments(),
      studentsApi.programmes(),
    ]).then(([ay, d, p]) => {
      const years: AcademicYear[] = ay.data.results || ay.data;
      setAcademicYears(years);
      setDepartments(d.data.results || d.data);
      setProgrammes(p.data.results || p.data);
      const curr = years.find(y => y.is_current);
      if (curr) setSelYear(String(curr.id));
    });
  }, []);

  const isUni = user?.role === 'university_coordinator';

  const generate = async () => {
    if (!selYear || !selSem) return alert('Academic year and semester are required.');
    setLoading(true);
    try {
      const params: Record<string,string> = { academic_year_id: selYear, semester: selSem };
      if (selDept && isUni) params.department_id = selDept;
      if (selProg) params.programme_id = selProg;
      if (selYOS)  params.year_of_study = selYOS;
      const res = await reportsApi.semester(params);
      setReport(res.data);
    } catch { alert('Failed to generate.'); }
    finally { setLoading(false); }
  };

  const barData = report?.rows.slice(0,20).map(r => ({
    name: r.index_number.slice(-6),
    GPA: r.semester_gpa,
  })) || [];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)' }}>Semester Performance Report</h1>
        <p style={{ color: 'var(--gray-500)', fontSize: 13 }}>
          Per-semester GPA analytics, best/worst performers, pass rate
        </p>
      </div>

      <ReportFilters loading={loading} onGenerate={generate} filters={[
        ...(isUni ? [{
          key:'dept', label:'Department', value:selDept, onChange:setSelDept,
          options:[{value:'',label:'All Departments'},...departments.map(d=>({value:String(d.id),label:d.name}))],
        }] : []),
        {
          key:'year', label:'Academic Year *', value:selYear, onChange:setSelYear,
          options:[{value:'',label:'Select year…'},...academicYears.map(y=>({value:String(y.id),label:y.label+(y.is_current?' (Current)':'')}))],
        },
        {
          key:'sem', label:'Semester *', value:selSem, onChange:setSelSem,
          options:[{value:'1',label:'Semester 1'},{value:'2',label:'Semester 2'}],
        },
        {
          key:'prog', label:'Programme', value:selProg, onChange:setSelProg,
          options:[{value:'',label:'All Programmes'},...programmes.map(p=>({value:String(p.id),label:p.name}))],
        },
        {
          key:'yos', label:'Year of Study', value:selYOS, onChange:setSelYOS,
          options:[{value:'',label:'All Years'},...[1,2,3,4].map(y=>({value:String(y),label:`Year ${y}`}))],
        },
      ]}
      extraButtons={report && (
        <ExportButtons exports={[{
          label:'Excel', icon:'📊',
          fetch:()=>reportsApi.semesterExcel({academic_year_id:selYear,semester:selSem,...(selDept&&isUni?{department_id:selDept}:{})}),
          filename:'semester_report.xlsx',
          mime:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }]} />
      )}
      />

      {report && (
        <>
          <SummaryCards stats={[
            { label:'Total Students', value: report.summary.total },
            { label:'Average GPA',    value: report.summary.avg_gpa.toFixed(2),  color:'var(--blue)' },
            { label:'Best GPA',       value: report.summary.best_gpa.toFixed(2), color:'var(--green)' },
            { label:'Worst GPA',      value: report.summary.worst_gpa.toFixed(2),color:'var(--red)' },
            { label:'Pass Rate',      value: `${report.summary.pass_rate}%`,      color:'var(--green)' },
          ]} />

          {barData.length > 0 && (
            <div className="card" style={{ marginBottom:20 }}>
              <div className="card-header"><h2>GPA Distribution (Top 20)</h2></div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
                    <XAxis dataKey="name" tick={{ fontSize:10 }} />
                    <YAxis domain={[0,4]} tick={{ fontSize:11 }} />
                    <Tooltip formatter={(v:any) => [Number(v).toFixed(2),'Semester GPA']} />
                    <Bar dataKey="GPA" fill="var(--blue)" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header"><h2>All Students ({report.rows.length})</h2></div>
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>#</th><th>Index No.</th><th>Name</th>
                    {isUni && <th>Department</th>}
                    <th>Programme</th><th>Yr</th>
                    <th>Sem GPA</th><th>Credits</th><th>CuGPA</th><th>Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {report.rows.map((r,i) => (
                    <tr key={r.student_id} style={{ background:r.in_danger?'#fff5f5':undefined }}>
                      <td style={{ color:'var(--gray-500)' }}>{i+1}</td>
                      <td><span className="font-mono" style={{ fontSize:12 }}>{r.index_number}</span></td>
                      <td style={{ fontWeight:600 }}>{r.full_name}</td>
                      {isUni && <td style={{ fontSize:12 }}>{r.department}</td>}
                      <td style={{ fontSize:12 }}>{r.programme}</td>
                      <td style={{ textAlign:'center' }}>{r.year_of_study}</td>
                      <td>
                        <span className="font-mono" style={{ fontWeight:800, color:r.semester_gpa>=3?'var(--green)':r.semester_gpa>=2?'var(--blue)':'var(--red)' }}>
                          {r.semester_gpa.toFixed(2)}
                        </span>
                      </td>
                      <td style={{ textAlign:'center' }}>{r.total_credits}</td>
                      <td>
                        <span className="font-mono" style={{ fontWeight:700 }}>
                          {r.cumulative_gpa.toFixed(2)}
                        </span>
                      </td>
                      <td>
                        {r.in_danger
                          ? <span className="badge badge-red">Danger</span>
                          : <span className="badge badge-green">OK</span>}
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
          <TrendingUp size={48} color="var(--gray-300)" />
          <h3>Select academic year and semester to generate report</h3>
        </div>
      )}
    </div>
  );
};

export default SemesterReportPage;
