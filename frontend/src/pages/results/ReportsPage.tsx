import React, { useEffect, useState } from 'react';
import { reportsApi, studentsApi, resultsApi } from '../../api/client';
// Added Programme to the imports below
import { DepartmentReportData, AcademicYear, Department, Programme } from '../../types'; 
import { useAuth } from '../../context/AuthContext';
import { Download, AlertTriangle, BarChart3, Filter } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import SummaryCards from '../../components/SummaryCards';

const COLORS = ['#f59e0b','#16a34a','#2563eb','#64748b','#dc2626'];

const ReportsPage: React.FC = () => {
  // --- MISSING VARIABLES ADDED HERE ---
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  // ------------------------------------

  const [programmes, setProgrammes]       = useState<Programme[]>([]);
  const [selectedProgramme, setSelectedProgramme] = useState('');
  const [selectedYear, setSelectedYear]   = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedYearOfStudy, setSelectedYearOfStudy] = useState('');
  const [standingFilter, setStandingFilter] = useState('');
  const [minGpa, setMinGpa]               = useState('');
  const [report, setReport]               = useState<DepartmentReportData | null>(null);
  
  const isUniCoord = user?.role === 'university_coordinator';

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
      const curr = years.find((y: AcademicYear) => y.is_current);
      if (curr) setSelectedYear(String(curr.id));
    });
  }, []);

  const buildParams = (): Record<string, string> => {
    const params: Record<string, string> = {};
    if (selectedYear)        params.academic_year_id = selectedYear;
    if (selectedProgramme)   params.programme_id     = selectedProgramme;
    if (selectedSemester)    params.semester          = selectedSemester;
    if (selectedYearOfStudy) params.year_of_study     = selectedYearOfStudy;
    if (standingFilter)      params.standing          = standingFilter;
    if (minGpa)              params.min_gpa           = minGpa;
    return params;
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const res = await reportsApi.department(buildParams());
      setReport(res.data);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to generate report.');
    } finally { setLoading(false); }
  };

  const downloadPDF = async () => {
    setDownloading(true);
    try {
      const res = await reportsApi.departmentPDF(buildParams());
      const url = URL.createObjectURL(new Blob([res.data], { type:'application/pdf' }));
      const a = document.createElement('a');
      a.href = url; a.download = 'department_report.pdf'; a.click();
    } catch { alert('Failed to generate PDF.'); }
    finally { setDownloading(false); }
  };

  const standingPieData = report
    ? Object.entries(report.summary.standing_dist || {})
        .filter(([,v]) => (v as number) > 0)
        .map(([name, value]) => ({ name, value: value as number }))
    : [];

  const gpaBarData = report?.rows.slice(0, 20).map(s => ({
    name: s.index_number.slice(-6), GPA: s.cumulative_gpa,
  })) || [];

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'var(--navy)' }}>Department Report</h1>
          <p style={{ color:'var(--gray-500)', fontSize:13 }}>
            Generate and analyse departmental academic results
          </p>
        </div>
        {report && (
          <button className="btn btn-primary" onClick={downloadPDF} disabled={downloading}>
            <Download size={14}/> {downloading ? 'Generating…' : 'Download PDF'}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom:24 }}>
        <div className="card-header">
          <h2><Filter size={15} style={{ marginRight:8 }}/>Report Filters</h2>
        </div>
        <div className="card-body">
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'flex-end' }}>
            {[
              { label:'Academic Year', el:(
                <select className="form-control" value={selectedYear} onChange={e=>setSelectedYear(e.target.value)}>
                  <option value="">All Years</option>
                  {academicYears.map(y=><option key={y.id} value={y.id}>{y.label}{y.is_current?' (Current)':''}</option>)}
                </select>)},
              { label:'Year of Study', el:(
                <select className="form-control" value={selectedYearOfStudy} onChange={e=>setSelectedYearOfStudy(e.target.value)}>
                  <option value="">All Years</option>
                  {[1,2,3,4].map(y=><option key={y} value={y}>Year {y}</option>)}
                </select>)},
              { label:'Semester', el:(
                <select className="form-control" value={selectedSemester} onChange={e=>setSelectedSemester(e.target.value)}>
                  <option value="">All Semesters</option>
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                </select>)},
              { label:'Standing', el:(
                <select className="form-control" value={standingFilter} onChange={e=>setStandingFilter(e.target.value)}>
                  <option value="">All Standings</option>
                  {['First Class','Second Class Upper','Second Class Lower','Third Class','Fail']
                    .map(s=><option key={s} value={s}>{s}</option>)}
                </select>)},
              { label:'Programme', el:(
                <select className="form-control" value={selectedProgramme}
                  onChange={e=>setSelectedProgramme(e.target.value)}>
                  <option value="">All Programmes</option>
                  {programmes.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                </select>)},
              { label:'Min GPA', el:(
                <input type="number" step="0.1" min="0" max="4" className="form-control"
                  placeholder="e.g. 1.5" value={minGpa} onChange={e=>setMinGpa(e.target.value)} />)},
            ].map(({label,el}) => (
              <div key={label} style={{ flex:1, minWidth:150, marginBottom:0 }}>
                <label className="form-label">{label}</label>{el}
              </div>
            ))}
            <div>
              <button className="btn btn-primary" onClick={generateReport} disabled={loading}>
                <BarChart3 size={14}/> {loading ? 'Generating…' : 'Generate Report'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {report && (
        <>
          {/* Dept info header */}
          <div style={{
            background:'linear-gradient(135deg,var(--navy),var(--navy-mid))',
            color:'white', padding:'16px 24px', borderRadius:12, marginBottom:20
          }}>
            <div style={{ fontSize:18, fontWeight:800 }}>
              {report.department?.name || 'Department Report'}
            </div>
            <div style={{ fontSize:12, opacity:0.75, marginTop:4 }}>
              Code: {report.department?.code} · {report.summary.total} students
            </div>
          </div>

          <SummaryCards stats={[
            { label:'Total Students',    value: report.summary.total },
            { label:'Average GPA',       value: report.summary.avg_gpa.toFixed(2), color:'var(--blue)' },
            { label:'First Class',       value: report.summary.first_class,         color:'#92400e' },
            { label:'Second Upper',      value: report.summary.second_upper,        color:'var(--green)' },
            { label:'In Danger',         value: report.summary.in_danger,           color: report.summary.in_danger>0?'var(--red)':undefined },
            { label:'Fail',              value: report.summary.fail,                color: report.summary.fail>0?'var(--red)':'var(--gray-500)' },
          ]} />

          {/* Charts */}
          <div className="grid-2" style={{ marginBottom:24, gap:20 }}>
            {standingPieData.length > 0 && (
              <div className="card">
                <div className="card-header"><h2>Standing Distribution</h2></div>
                <div className="card-body">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={standingPieData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                        label={({name,percent}:any) => `${name.split(' ')[0]} ${((percent||0)*100).toFixed(0)}%`}
                        labelLine={false}>
                        {standingPieData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                      </Pie>
                      <Tooltip/><Legend/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            <div className="card">
              <div className="card-header"><h2>GPA Distribution (Top 20)</h2></div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={gpaBarData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)"/>
                    <XAxis dataKey="name" tick={{ fontSize:10 }}/>
                    <YAxis domain={[0,4]} tick={{ fontSize:11 }}/>
                    <Tooltip formatter={(v:any)=>[Number(v).toFixed(2),'GPA']}/>
                    <Bar dataKey="GPA" fill="var(--blue)" radius={[3,3,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Student table */}
          <div className="card">
            <div className="card-header">
              <h2>Students ({report.rows.length})</h2>
              <button className="btn btn-secondary btn-sm" onClick={downloadPDF} disabled={downloading}>
                <Download size={13}/> PDF
              </button>
            </div>
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>#</th><th>Index No.</th><th>Name</th><th>Programme</th><th>Year</th>
                    <th>Status</th><th>CuGPA</th><th>Standing</th><th>Trails</th><th>Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {report.rows.map((s,i) => (
                    <tr key={i} style={{ background:s.in_danger?'#fff5f5':undefined }}>
                      <td style={{ color:'var(--gray-500)' }}>{i+1}</td>
                      <td><span className="font-mono" style={{ fontSize:12 }}>{s.index_number}</span></td>
                      <td style={{ fontWeight:600 }}>{s.full_name}</td>
                      <td style={{ fontSize:12, color:'var(--gray-500)' }}>{s.programme}</td>
                      <td style={{ textAlign:'center' }}>{s.current_year}</td>
                      <td>
                        <span className={`badge ${s.status==='active'?'badge-green':s.status==='repeating'?'badge-gold':'badge-gray'}`}>
                          {s.status}
                        </span>
                      </td>
                      <td>
                        <span className="font-mono" style={{ fontWeight:800,
                          color: s.cumulative_gpa>=3?'var(--green)':s.cumulative_gpa>=2?'var(--blue)':'var(--red)' }}>
                          {s.cumulative_gpa.toFixed(2)}
                        </span>
                      </td>
                      <td style={{ fontSize:12 }}>{s.academic_standing}</td>
                      <td style={{ textAlign:'center', color:s.trail_count>0?'var(--red)':undefined, fontWeight:s.trail_count>0?700:400 }}>
                        {s.trail_count}
                      </td>
                      <td>
                        {s.in_danger
                          ? <span className="badge badge-red"><AlertTriangle size={10}/> Danger</span>
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
          <BarChart3 size={48} color="var(--gray-300)"/>
          <h3>No report generated yet</h3>
          <p>Select your filters above and click "Generate Report".</p>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;