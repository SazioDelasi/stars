import React, { useEffect, useState } from 'react';
import { reportsApi, studentsApi } from '../../api/client';
import { DangerReportData, GraduationReportData, Department, Programme } from '../../types';
import { useAuth } from '../../context/AuthContext';
import ReportFilters from '../../components/ReportFilters';
import SummaryCards from '../../components/SummaryCards';
import ExportButtons from '../../components/ExportButtons';
import { AlertTriangle, GraduationCap, CheckCircle, XCircle, Clock } from 'lucide-react';

const DangerAndGraduationPage: React.FC = () => {
  const { user } = useAuth();
  const [departments, setDepartments]  = useState<Department[]>([]);
  const [programmes, setProgrammes]    = useState<Programme[]>([]);

  // shared filters
  const [selDept, setSelDept]     = useState('');
  const [selProg, setSelProg]     = useState('');
  const [selYear, setSelYear]     = useState('');
  const [activeTab, setActiveTab] = useState<'danger' | 'graduation'>('danger');

  // danger specific
  const [gpaThreshold, setGpaThreshold] = useState('1.5');
  const [minTrails, setMinTrails]       = useState('3');
  const [dangerReport, setDangerReport] = useState<DangerReportData | null>(null);

  // graduation specific
  const [minCredits, setMinCredits]         = useState('120');
  const [graduationReport, setGraduationReport] = useState<GraduationReportData | null>(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([studentsApi.departments(), studentsApi.programmes()]).then(([d, p]) => {
      setDepartments(d.data.results || d.data);
      setProgrammes(p.data.results || p.data);
    });
  }, []);

  const isUni = user?.role === 'university_coordinator';

  const sharedParams = () => {
    const p: Record<string,string> = {};
    if (selProg) p.programme_id = selProg;
    if (selYear) p.year = selYear;
    if (selDept && isUni) p.department_id = selDept;
    return p;
  };

  const generate = async () => {
    setLoading(true);
    try {
      if (activeTab === 'danger') {
        const res = await reportsApi.danger({
          ...sharedParams(),
          gpa_threshold: gpaThreshold,
          min_trails: minTrails,
        });
        setDangerReport(res.data);
      } else {
        const res = await reportsApi.graduation({
          ...sharedParams(),
          min_credits: minCredits,
        });
        setGraduationReport(res.data);
      }
    } catch { alert('Failed to generate.'); }
    finally { setLoading(false); }
  };

  const eligibilityColor = (e: string) => {
    if (e === 'Eligible')    return 'var(--green)';
    if (e === 'Conditional') return 'var(--gold)';
    return 'var(--red)';
  };

  const eligibilityBadge = (e: string) => {
    if (e === 'Eligible')    return 'badge-green';
    if (e === 'Conditional') return 'badge-gold';
    return 'badge-red';
  };

  return (
    <div>
      {/* Tab Toggle */}
      <div style={{ display:'flex', gap:0, marginBottom:20, background:'var(--gray-100)', borderRadius:10, padding:4, width:'fit-content' }}>
        {(['danger','graduation'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding:'9px 20px', borderRadius:8, border:'none', cursor:'pointer', fontFamily:'Sora,sans-serif',
              fontWeight:600, fontSize:13, transition:'all 0.15s',
              background: activeTab===tab ? 'white' : 'transparent',
              color: activeTab===tab ? 'var(--navy)' : 'var(--gray-500)',
              boxShadow: activeTab===tab ? 'var(--shadow-sm)' : 'none',
            }}
          >
            {tab === 'danger' ? <><AlertTriangle size={14} style={{marginRight:6}} />Academic Danger</> : <><GraduationCap size={14} style={{marginRight:6}} />Graduation Eligibility</>}
          </button>
        ))}
      </div>

      <div style={{ marginBottom:16 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:'var(--navy)' }}>
          {activeTab === 'danger' ? '⚠ Academic Danger Report' : '🎓 Graduation Eligibility Report'}
        </h1>
        <p style={{ color:'var(--gray-500)', fontSize:13 }}>
          {activeTab === 'danger'
            ? 'Students below GPA threshold or with multiple trail courses'
            : 'Final year student graduation eligibility assessment'}
        </p>
      </div>

      <ReportFilters loading={loading} onGenerate={generate} filters={[
        ...(isUni ? [{ key:'dept', label:'Department', value:selDept, onChange:setSelDept,
          options:[{value:'',label:'All Departments'}, ...departments.map(d=>({value:String(d.id),label:d.name}))] }] : []),
        { key:'prog', label:'Programme', value:selProg, onChange:setSelProg,
          options:[{value:'',label:'All Programmes'}, ...programmes.map(p=>({value:String(p.id),label:p.name}))] },
        ...(activeTab==='danger' ? [
          { key:'year', label:'Year', value:selYear, onChange:setSelYear,
            options:[{value:'',label:'All Years'}, ...[1,2,3,4].map(y=>({value:String(y),label:`Year ${y}`}))] },
          { key:'gpa', label:'GPA Threshold', value:gpaThreshold, onChange:setGpaThreshold,
            options:[{value:'1.0',label:'1.0'},{value:'1.5',label:'1.5'},{value:'2.0',label:'2.0'}] },
          { key:'trails', label:'Min Trails', value:minTrails, onChange:setMinTrails,
            options:[{value:'2',label:'2+'},{value:'3',label:'3+'},{value:'4',label:'4+'}] },
        ] : [
          { key:'credits', label:'Min Credits', value:minCredits, onChange:setMinCredits,
            options:[{value:'90',label:'90'},{value:'100',label:'100'},{value:'120',label:'120'},{value:'130',label:'130'}] },
        ]),
      ]}
      extraButtons={
        <ExportButtons exports={activeTab==='danger' ? [{
          label:'Excel', icon:'📊',
          fetch:()=>reportsApi.dangerExcel({...sharedParams(),gpa_threshold:gpaThreshold,min_trails:minTrails}),
          filename:'danger_report.xlsx',
          mime:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }] : [{
          label:'Excel', icon:'📊',
          fetch:()=>reportsApi.graduationExcel({...sharedParams(),min_credits:minCredits}),
          filename:'graduation_report.xlsx',
          mime:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }]} />
      }
      />

      {/* DANGER REPORT */}
      {activeTab === 'danger' && dangerReport && (
        <>
          <SummaryCards stats={[
            { label:'Total At Risk',       value: dangerReport.summary.total_in_danger, color:'var(--red)' },
            { label:'GPA Below Threshold', value: dangerReport.summary.gpa_below_threshold, color:'var(--red)' },
            { label:'Trails Exceeded',     value: dangerReport.summary.trails_exceeded, color:'var(--gold)' },
            { label:'GPA Threshold',       value: dangerReport.thresholds.gpa, color:'var(--gray-700)' },
            { label:'Min Trails',          value: dangerReport.thresholds.trails, color:'var(--gray-700)' },
          ]} />

          <div className="card">
            <div className="card-header"><h2>Students In Academic Danger ({dangerReport.rows.length})</h2></div>
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>#</th><th>Index No.</th><th>Name</th><th>Department</th>
                    <th>Programme</th><th>Yr</th><th>CuGPA</th><th>Standing</th>
                    <th>Trails</th><th>GPA Risk</th><th>Trail Risk</th><th>Failed Courses</th>
                  </tr>
                </thead>
                <tbody>
                  {dangerReport.rows.map((r,i) => (
                    <tr key={r.student_id} style={{ background:'#fff5f5' }}>
                      <td style={{ color:'var(--gray-500)' }}>{i+1}</td>
                      <td><span className="font-mono" style={{ fontSize:12 }}>{r.index_number}</span></td>
                      <td style={{ fontWeight:700, color:'var(--navy)' }}>{r.full_name}</td>
                      <td style={{ fontSize:12 }}>{r.department}</td>
                      <td style={{ fontSize:12 }}>{r.programme}</td>
                      <td style={{ textAlign:'center' }}>{r.current_year}</td>
                      <td>
                        <span className="font-mono" style={{ fontWeight:800, color:'var(--red)' }}>
                          {r.cumulative_gpa.toFixed(2)}
                        </span>
                      </td>
                      <td style={{ fontSize:12 }}>{r.academic_standing}</td>
                      <td style={{ textAlign:'center', color:'var(--red)', fontWeight:700 }}>{r.trail_count}</td>
                      <td style={{ textAlign:'center' }}>
                        {r.gpa_below_threshold ? <span className="badge badge-red">Yes</span> : <span className="badge badge-gray">No</span>}
                      </td>
                      <td style={{ textAlign:'center' }}>
                        {r.trails_exceeded ? <span className="badge badge-gold">Yes</span> : <span className="badge badge-gray">No</span>}
                      </td>
                      <td style={{ fontSize:11 }}>
                        {r.failed_courses.map(c => (
                          <span key={c.code} className="font-mono" style={{ display:'block', color:'var(--red)' }}>{c.code}</span>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* GRADUATION REPORT */}
      {activeTab === 'graduation' && graduationReport && (
        <>
          <SummaryCards stats={[
            { label:'Total Final Year', value: graduationReport.summary.total },
            { label:'Eligible',         value: graduationReport.summary.eligible,    color:'var(--green)' },
            { label:'Conditional',      value: graduationReport.summary.conditional, color:'var(--gold)' },
            { label:'Ineligible',       value: graduationReport.summary.ineligible,  color:'var(--red)' },
          ]} />

          <div className="card">
            <div className="card-header"><h2>Graduation Eligibility ({graduationReport.rows.length})</h2></div>
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>#</th><th>Index No.</th><th>Name</th><th>Programme</th>
                    <th>CuGPA</th><th>Standing</th><th>Credits</th><th>Trails</th><th>Eligibility</th>
                  </tr>
                </thead>
                <tbody>
                  {graduationReport.rows.map((r,i) => (
                    <tr key={r.student_id} style={{ background: r.eligibility==='Ineligible'?'#fff5f5': r.eligibility==='Conditional'?'#fffbeb':undefined }}>
                      <td style={{ color:'var(--gray-500)' }}>{i+1}</td>
                      <td><span className="font-mono" style={{ fontSize:12 }}>{r.index_number}</span></td>
                      <td style={{ fontWeight:600 }}>{r.full_name}</td>
                      <td style={{ fontSize:12 }}>{r.programme}</td>
                      <td>
                        <span className="font-mono" style={{ fontWeight:800, color: r.cumulative_gpa>=3?'var(--green)':r.cumulative_gpa>=2?'var(--blue)':'var(--red)' }}>
                          {r.cumulative_gpa.toFixed(2)}
                        </span>
                      </td>
                      <td style={{ fontSize:12 }}>{r.academic_standing}</td>
                      <td style={{ textAlign:'center' }}>
                        <span style={{ color: r.credits_earned>=r.credits_required?'var(--green)':'var(--red)', fontWeight:700 }}>
                          {r.credits_earned}/{r.credits_required}
                        </span>
                      </td>
                      <td style={{ textAlign:'center', color: r.trail_count>0?'var(--red)':undefined }}>{r.trail_count}</td>
                      <td>
                        <span className={`badge ${eligibilityBadge(r.eligibility)}`} style={{ fontSize:12 }}>
                          {r.eligibility==='Eligible' && <CheckCircle size={10} />}
                          {r.eligibility==='Conditional' && <Clock size={10} />}
                          {r.eligibility==='Ineligible' && <XCircle size={10} />}
                          {' '}{r.eligibility}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!dangerReport && !graduationReport && !loading && (
        <div className="empty-state">
          {activeTab==='danger' ? <AlertTriangle size={48} color="var(--gray-300)" /> : <GraduationCap size={48} color="var(--gray-300)" />}
          <h3>Select filters and generate report</h3>
        </div>
      )}
    </div>
  );
};

export default DangerAndGraduationPage;
