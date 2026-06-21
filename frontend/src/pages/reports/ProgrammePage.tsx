import React, { useEffect, useState } from 'react';
import { reportsApi, studentsApi } from '../../api/client';
import { ProgrammeReport, Programme, Department } from '../../types';
import { useAuth } from '../../context/AuthContext';
import ReportFilters from '../../components/ReportFilters';
import SummaryCards from '../../components/SummaryCards';
import ExportButtons from '../../components/ExportButtons';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { GraduationCap, AlertTriangle } from 'lucide-react';

const STANDING_COLORS: Record<string, string> = {
  'First Class': '#f59e0b', 'Second Class Upper': '#16a34a',
  'Second Class Lower': '#2563eb', 'Third Class': '#64748b', 'Fail': '#dc2626',
};

const ProgrammePage: React.FC = () => {
  const { user } = useAuth();
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selProg, setSelProg]  = useState('');
  const [selYear, setSelYear]  = useState('');
  const [selDept, setSelDept]  = useState('');
  const [minGpa, setMinGpa]    = useState('');
  const [maxGpa, setMaxGpa]    = useState('');
  const [report, setReport]    = useState<ProgrammeReport | null>(null);
  const [loading, setLoading]  = useState(false);

  useEffect(() => {
    Promise.all([studentsApi.programmes(), studentsApi.departments()]).then(([p, d]) => {
      setProgrammes(p.data.results || p.data);
      setDepartments(d.data.results || d.data);
    });
  }, []);

  const generate = async () => {
    if (!selProg) return alert('Please select a programme.');
    setLoading(true);
    try {
      const params: Record<string,string> = { programme_id: selProg };
      if (selYear) params.year = selYear;
      if (minGpa)  params.min_gpa = minGpa;
      if (maxGpa)  params.max_gpa = maxGpa;
      if (selDept && user?.role === 'university_coordinator') params.department_id = selDept;
      const res = await reportsApi.programme(params);
      setReport(res.data);
    } catch { alert('Failed to generate.'); }
    finally { setLoading(false); }
  };

  const isUni = user?.role === 'university_coordinator';

  const standingPie = report
    ? Object.entries(report.summary.standing_dist)
        .filter(([,v]) => v > 0)
        .map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)' }}>Programme Report</h1>
        <p style={{ color: 'var(--gray-500)', fontSize: 13 }}>
          GPA rankings, standings, and danger analysis per programme
        </p>
      </div>

      <ReportFilters loading={loading} onGenerate={generate} filters={[
        ...(isUni ? [{
          key:'dept', label:'Department', value: selDept, onChange: setSelDept,
          options:[{value:'',label:'All'}, ...departments.map(d=>({value:String(d.id),label:d.name}))],
        }] : []),
        {
          key:'prog', label:'Programme *', value: selProg, onChange: setSelProg,
          options:[{value:'',label:'Select programme…'}, ...programmes.map(p=>({value:String(p.id),label:p.name}))],
        },
        {
          key:'year', label:'Year of Study', value: selYear, onChange: setSelYear,
          options:[{value:'',label:'All Years'}, ...[1,2,3,4].map(y=>({value:String(y),label:`Year ${y}`}))],
        },
        {
          key:'minGpa', label:'Min GPA', value: minGpa, onChange: setMinGpa,
          options:[{value:'',label:'No min'},{value:'1.0',label:'1.0'},{value:'1.5',label:'1.5'},{value:'2.0',label:'2.0'},{value:'2.5',label:'2.5'},{value:'3.0',label:'3.0'}],
        },
        {
          key:'maxGpa', label:'Max GPA', value: maxGpa, onChange: setMaxGpa,
          options:[{value:'',label:'No max'},{value:'2.0',label:'2.0'},{value:'2.5',label:'2.5'},{value:'3.0',label:'3.0'},{value:'3.5',label:'3.5'},{value:'4.0',label:'4.0'}],
        },
      ]}
      extraButtons={report && (
        <ExportButtons exports={[{
          label:'Excel', icon:'📊',
          fetch:()=>reportsApi.programmeExcel({programme_id:selProg,year:selYear,min_gpa:minGpa,max_gpa:maxGpa}),
          filename:'programme_report.xlsx',
          mime:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }]} />
      )}
      />

      {report && (
        <>
          <div style={{ background:'linear-gradient(135deg,var(--navy),var(--navy-mid))', color:'white', padding:'16px 24px', borderRadius:12, marginBottom:20 }}>
            <div style={{ fontSize:18, fontWeight:800 }}>{report.programme.name}</div>
            <div style={{ fontSize:12, opacity:0.75, marginTop:4 }}>Programme Code: {report.programme.code}</div>
          </div>

          <SummaryCards stats={[
            { label:'Total Students',   value: report.summary.total },
            { label:'Average GPA',      value: report.summary.avg_gpa.toFixed(2), color:'var(--blue)' },
            { label:'In Danger',        value: report.summary.in_danger, color: report.summary.in_danger > 0 ? 'var(--red)' : 'var(--green)' },
            { label:'Top Student GPA',  value: report.summary.top_student?.cumulative_gpa.toFixed(2) ?? '—', color:'var(--gold)' },
          ]} />

          {report.summary.top_student && (
            <div className="grid-2" style={{ marginBottom:20 }}>
              <div className="card">
                <div className="card-header"><h2>🏆 Top Performer</h2></div>
                <div className="card-body">
                  <div style={{ fontWeight:800, fontSize:16, color:'var(--navy)' }}>{report.summary.top_student.full_name}</div>
                  <div style={{ fontSize:13, color:'var(--gray-500)', marginTop:4 }}>{report.summary.top_student.index_number}</div>
                  <div style={{ marginTop:12, fontSize:28, fontWeight:900, fontFamily:'DM Mono,monospace', color:'var(--gold)' }}>
                    {report.summary.top_student.cumulative_gpa.toFixed(2)}
                  </div>
                  <div style={{ fontSize:12, color:'var(--gray-500)' }}>Cumulative GPA · {report.summary.top_student.academic_standing}</div>
                </div>
              </div>
              {standingPie.length > 0 && (
                <div className="card">
                  <div className="card-header"><h2>Standing Distribution</h2></div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={standingPie} cx="50%" cy="50%" outerRadius={70} dataKey="value">
                          {standingPie.map((entry,i) => <Cell key={i} fill={STANDING_COLORS[entry.name] || '#64748b'} />)}
                        </Pie>
                        <Legend iconSize={10} />
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="card">
            <div className="card-header"><h2>Students ({report.rows.length})</h2></div>
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>#</th><th>Index No.</th><th>Name</th>
                    {isUni && <th>Department</th>}
                    <th>Yr</th><th>Status</th><th>CuGPA</th><th>Standing</th><th>Trails</th><th>Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {report.rows.map((r,i) => (
                    <tr key={r.student_id} style={{ background: r.in_danger ? '#fff5f5' : undefined }}>
                      <td style={{ color:'var(--gray-500)' }}>{i+1}</td>
                      <td><span className="font-mono" style={{ fontSize:12 }}>{r.index_number}</span></td>
                      <td style={{ fontWeight:600 }}>{r.full_name}</td>
                      {isUni && <td style={{ fontSize:12 }}>{r.department}</td>}
                      <td style={{ textAlign:'center' }}>{r.current_year}</td>
                      <td><span className={`badge ${r.status==='active'?'badge-green':r.status==='repeating'?'badge-gold':'badge-gray'}`}>{r.status}</span></td>
                      <td>
                        <span className="font-mono" style={{ fontWeight:800, color: r.cumulative_gpa>=3?'var(--green)':r.cumulative_gpa>=2?'var(--blue)':'var(--red)' }}>
                          {r.cumulative_gpa.toFixed(2)}
                        </span>
                      </td>
                      <td style={{ fontSize:12 }}>{r.academic_standing}</td>
                      <td style={{ textAlign:'center', color: r.trail_count>0?'var(--red)':undefined, fontWeight: r.trail_count>0?700:400 }}>{r.trail_count}</td>
                      <td>{r.in_danger ? <span className="badge badge-red"><AlertTriangle size={10} /> Danger</span> : <span className="badge badge-green">OK</span>}</td>
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
          <GraduationCap size={48} color="var(--gray-300)" />
          <h3>Select a programme and generate</h3>
        </div>
      )}
    </div>
  );
};

export default ProgrammePage;
