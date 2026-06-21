import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { studentsApi, resultsApi, grievancesApi, reportsApi } from '../../api/client';
import { Student, Transcript } from '../../types';
import {
  Users, BookOpen, AlertCircle, TrendingUp, AlertTriangle,
  CheckCircle, Clock, ArrowRight, Award, BarChart3,
  GraduationCap, Upload, Search, BookMarked, Globe,
  ListChecks, ClipboardCheck, CalendarCheck
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  BarChart, Bar
} from 'recharts';

const STANDING_COLORS: Record<string,string> = {
  'First Class':'#f59e0b','Second Class Upper':'#16a34a',
  'Second Class Lower':'#2563eb','Third Class':'#64748b','Fail':'#dc2626',
};

const Dashboard: React.FC = () => {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [loading, setLoading] = useState(true);

  const [transcript, setTranscript]   = useState<Transcript|null>(null);
  const [studentCount, setStudentCount] = useState(0);
  const [dangerCount, setDangerCount]   = useState(0);
  const [grievanceSummary, setGrievanceSummary] = useState<any>(null);
  const [recentStudents, setRecentStudents]     = useState<Student[]>([]);
  const [hodData, setHodData]         = useState<any>(null);
  const [deptSummary, setDeptSummary] = useState<any>(null);
  const [univData, setUnivData]       = useState<any[]>([]);

  useEffect(()=>{
    const load = async () => {
      try {
        if (user?.role === 'student') {
          const sRes = await studentsApi.list();
          const me   = (sRes.data.results || sRes.data)[0];
          if (me) {
            const tRes = await resultsApi.transcript(me.id);
            setTranscript(tRes.data);
          }
        } else {
          const [sRes, gRes] = await Promise.all([studentsApi.list(), grievancesApi.summary()]);
          const students: Student[] = sRes.data.results || sRes.data;
          setStudentCount(students.length);
          setDangerCount(students.filter(s=>s.in_academic_danger).length);
          setRecentStudents(students.slice(0,6));
          setGrievanceSummary(gRes.data);

          if (user?.department_id) {
            try {
              const [hodRes, drRes] = await Promise.all([
                reportsApi.hodDashboard(),
                reportsApi.department({department_id:String(user.department_id)}),
              ]);
              setHodData(hodRes.data);
              setDeptSummary(drRes.data.summary);
            } catch {}
          }
          if (user?.role === 'university_coordinator') {
            try {
              const ur = await reportsApi.universityComparison();
              setUnivData(ur.data.departments || []);
            } catch {}
          }
        }
      } catch(err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  },[user]);

  if (loading) return <div className="loading-spinner">Loading dashboard…</div>;

  // ── STUDENT ──────────────────────────────────────────────────────────────
  if (user?.role === 'student') {
    const gpaData = transcript?.semesters.map(s=>({
      name:`Y${s.year_of_study}S${s.semester}`, GPA:s.semester_gpa
    })) || [];
    return (
      <div>
        {transcript?.in_academic_danger && (
          <div className="danger-banner">
            <AlertTriangle size={22} color="var(--red)"/>
            <div>
              <strong>Academic Danger Alert</strong>
              <span>Your CuGPA is critically low or you have multiple trail courses. Visit your advisor immediately.</span>
            </div>
          </div>
        )}
        <div className="stats-grid">
          {[
            {icon:<Award size={20}/>,       label:'CuGPA',         value:transcript?.cumulative_gpa.toFixed(2)??'—', cls:'gold'},
            {icon:<BookOpen size={20}/>,    label:'Credits Earned', value:transcript?.total_credits_earned??0,        cls:'blue'},
            {icon:<AlertCircle size={20}/>, label:'Trail Courses',  value:transcript?.trail_count??0,                 cls:'red'},
            {icon:<TrendingUp size={20}/>,  label:'Standing',       value:transcript?.academic_standing??'—',         cls:'green'},
          ].map((s,i)=>(
            <div key={i} className="stat-card">
              <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
              <div><div className="stat-value" style={{fontSize:22}}>{s.value}</div>
                <div className="stat-label">{s.label}</div></div>
            </div>
          ))}
        </div>
        {gpaData.length>0&&(
          <div className="card" style={{marginBottom:24}}>
            <div className="card-header"><h2>GPA Trend</h2></div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={gpaData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)"/>
                  <XAxis dataKey="name" tick={{fontSize:12}}/>
                  <YAxis domain={[0,4]} tick={{fontSize:12}}/>
                  <Tooltip formatter={(v:any)=>[Number(v).toFixed(2),'GPA']}/>
                  <Line type="monotone" dataKey="GPA" stroke="var(--blue)" strokeWidth={2.5} dot={{r:5,fill:'var(--blue)'}}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          <button className="btn btn-primary"   onClick={()=>navigate('/profile')}>
            <BookOpen size={14}/> Full Profile
          </button>
          <button className="btn btn-outline"   onClick={()=>navigate('/registration')}>
            <CalendarCheck size={14}/> Course Registration
          </button>
          <button className="btn btn-secondary" onClick={()=>navigate('/grievances')}>
            <AlertCircle size={14}/> My Grievances
          </button>
        </div>
      </div>
    );
  }

  // ── STAFF ─────────────────────────────────────────────────────────────────
  const isUniCoord   = user?.role === 'university_coordinator';
  const isHodOrCoord = user?.role === 'hod' || user?.role === 'dept_coordinator';
  const standingPie  = deptSummary
    ? Object.entries(deptSummary.standing_dist as Record<string,number>)
        .filter(([,v])=>v>0).map(([name,value])=>({name,value}))
    : [];

  return (
    <div>
      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><Users size={22}/></div>
          <div><div className="stat-value">{studentCount}</div><div className="stat-label">Students</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><AlertTriangle size={22}/></div>
          <div>
            <div className="stat-value" style={{color:dangerCount>0?'var(--red)':undefined}}>{dangerCount}</div>
            <div className="stat-label">In Academic Danger</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon gold"><Clock size={22}/></div>
          <div>
            <div className="stat-value">{grievanceSummary?.pending??0}</div>
            <div className="stat-label">Pending Grievances</div>
          </div>
        </div>
        {hodData&&(
          <div className="stat-card">
            <div className="stat-icon red"><AlertCircle size={22}/></div>
            <div>
              <div className="stat-value" style={{color:hodData.grievances?.overdue>0?'var(--red)':undefined}}>
                {hodData.grievances?.overdue??0}
              </div>
              <div className="stat-label">Overdue Grievances</div>
            </div>
          </div>
        )}
        {deptSummary&&(
          <div className="stat-card">
            <div className="stat-icon gold"><Award size={22}/></div>
            <div><div className="stat-value" style={{fontSize:22}}>{deptSummary.avg_gpa?.toFixed(2)}</div>
              <div className="stat-label">Dept Avg GPA</div></div>
          </div>
        )}
        {deptSummary&&(
          <div className="stat-card">
            <div className="stat-icon navy"><GraduationCap size={22}/></div>
            <div><div className="stat-value">{deptSummary.first_class}</div><div className="stat-label">First Class</div></div>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:24}}>
        <button className="btn btn-primary"   onClick={()=>navigate('/results/entry')}>
          <BookOpen size={14}/> Enter Results
        </button>
        <button className="btn btn-outline"   onClick={()=>navigate('/reports/batch')}>
          <Upload size={14}/> Batch Upload
        </button>
        <button className="btn btn-secondary" onClick={()=>navigate('/reports/danger')}>
          <AlertTriangle size={14}/> Danger Report
        </button>
        <button className="btn btn-secondary" onClick={()=>navigate('/registration/manage')}>
          <ClipboardCheck size={14}/> Registrations
        </button>
        {isHodOrCoord&&(
          <button className="btn btn-secondary" onClick={()=>navigate('/registration/elective-pools')}>
            <ListChecks size={14}/> Elective Pools
          </button>
        )}
        {!isHodOrCoord&&(
          <button className="btn btn-secondary" onClick={()=>navigate('/results/master-search')}>
            <Search size={14}/> Master Search
          </button>
        )}
        {isUniCoord&&(
          <button className="btn btn-secondary" onClick={()=>navigate('/reports/university')}>
            <Globe size={14}/> University Overview
          </button>
        )}
      </div>

      {/* HOD operational panel */}
      {hodData&&(
        <div className="card" style={{marginBottom:20}}>
          <div className="card-header">
            <h2>Departmental Operations</h2>
            <button className="btn btn-ghost btn-sm" onClick={()=>navigate('/reports/courses')}>
              Reports <ArrowRight size={13}/>
            </button>
          </div>
          <div className="card-body">
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20}}>
              <div>
                <div style={{fontSize:12,fontWeight:700,color:'var(--gray-500)',textTransform:'uppercase',
                  letterSpacing:'0.6px',marginBottom:8}}>Students</div>
                {[
                  {label:'Active',    value:hodData.students?.active,    color:'var(--green)'},
                  {label:'Repeating', value:hodData.students?.repeating, color:'var(--gold)'},
                  {label:'Deferred',  value:hodData.students?.deferred,  color:'var(--blue)'},
                  {label:'In Danger', value:hodData.students?.danger,    color:'var(--red)'},
                ].map(row=>(
                  <div key={row.label} style={{display:'flex',justifyContent:'space-between',
                    padding:'4px 0',borderBottom:'1px solid var(--gray-100)'}}>
                    <span style={{fontSize:13,color:'var(--gray-700)'}}>{row.label}</span>
                    <span style={{fontWeight:700,color:row.color}}>{row.value??0}</span>
                  </div>
                ))}
              </div>
              <div>
                <div style={{fontSize:12,fontWeight:700,color:'var(--gray-500)',textTransform:'uppercase',
                  letterSpacing:'0.6px',marginBottom:8}}>Registrations</div>
                {[
                  {label:'Draft',     value:hodData.registrations?.draft,     color:'var(--gray-500)'},
                  {label:'Submitted', value:hodData.registrations?.submitted, color:'var(--gold)'},
                  {label:'Approved',  value:hodData.registrations?.approved,  color:'var(--green)'},
                  {label:'Rejected',  value:hodData.registrations?.rejected,  color:'var(--red)'},
                ].map(row=>(
                  <div key={row.label} style={{display:'flex',justifyContent:'space-between',
                    padding:'4px 0',borderBottom:'1px solid var(--gray-100)'}}>
                    <span style={{fontSize:13,color:'var(--gray-700)'}}>{row.label}</span>
                    <span style={{fontWeight:700,color:row.color}}>{row.value??0}</span>
                  </div>
                ))}
              </div>
              <div>
                <div style={{fontSize:12,fontWeight:700,color:'var(--gray-500)',textTransform:'uppercase',
                  letterSpacing:'0.6px',marginBottom:8}}>Elective Pools</div>
                {hodData.elective_pools?.length>0?(
                  hodData.elective_pools.map((pool:any,i:number)=>(
                    <div key={i} style={{padding:'4px 0',borderBottom:'1px solid var(--gray-100)'}}>
                      <div style={{fontSize:12,fontWeight:600,color:'var(--navy)'}}>Y{pool.year}S{pool.semester}</div>
                      <div style={{fontSize:11,color:'var(--gray-500)'}}>
                        {pool.course_count} courses · max {pool.max_electives} pick(s)
                      </div>
                    </div>
                  ))
                ):(
                  <div style={{fontSize:12,color:'var(--gray-400)',fontStyle:'italic'}}>
                    No active pools —{' '}
                    <span style={{color:'var(--blue)',cursor:'pointer'}}
                      onClick={()=>navigate('/registration/elective-pools')}>configure one</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid-2" style={{gap:20,marginBottom:20}}>
        {/* Recent students */}
        <div className="card">
          <div className="card-header">
            <h2>Recent Students</h2>
            <button className="btn btn-ghost btn-sm" onClick={()=>navigate('/students')}>
              View All <ArrowRight size={13}/>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table>
              <thead><tr><th>Index</th><th>Name</th><th>GPA</th><th>Status</th></tr></thead>
              <tbody>
                {recentStudents.map(s=>(
                  <tr key={s.id} style={{cursor:'pointer'}} onClick={()=>navigate(`/students/${s.id}`)}>
                    <td><span className="font-mono" style={{fontSize:12}}>{s.index_number}</span></td>
                    <td style={{fontWeight:600}}>{s.full_name}</td>
                    <td>
                      <span className="font-mono" style={{fontWeight:800,
                        color:s.cumulative_gpa>=3?'var(--green)':s.cumulative_gpa>=2?'var(--blue)':'var(--red)'}}>
                        {s.cumulative_gpa.toFixed(2)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${s.status==='active'?'badge-green':s.status==='repeating'?'badge-gold':'badge-gray'}`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Grievances overview */}
        <div className="card">
          <div className="card-header">
            <h2>Grievances</h2>
            <button className="btn btn-ghost btn-sm" onClick={()=>navigate('/grievances')}>
              Manage <ArrowRight size={13}/>
            </button>
          </div>
          <div className="card-body">
            {grievanceSummary&&(
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {[
                  {label:'Pending',       value:grievanceSummary.pending??0,       color:'var(--gold)'},
                  {label:'Under Review',  value:grievanceSummary.in_review??0,     color:'var(--blue)'},
                  {label:'Escalated',     value:grievanceSummary.escalated??0,     color:'var(--red)'},
                  {label:'Resolved',      value:grievanceSummary.resolved??0,      color:'var(--green)'},
                  {label:'High Priority', value:grievanceSummary.high_priority??0, color:'var(--red)'},
                  {label:'Overdue',       value:grievanceSummary.overdue??0,       color:'var(--red)'},
                ].map(item=>(
                  <div key={item.label} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontSize:13,color:'var(--gray-700)'}}>{item.label}</span>
                    <span style={{fontWeight:800,fontSize:16,color:item.color}}>{item.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{padding:'0 24px 20px'}}>
            <button className="btn btn-primary btn-sm" onClick={()=>navigate('/grievances')}>
              Manage Grievances
            </button>
          </div>
        </div>
      </div>

      {/* Standing pie */}
      {deptSummary&&standingPie.length>0&&(
        <div className="card" style={{marginBottom:20}}>
          <div className="card-header">
            <h2>Department Standing Distribution</h2>
            <button className="btn btn-ghost btn-sm" onClick={()=>navigate('/results/reports')}>
              Full Report <ArrowRight size={13}/>
            </button>
          </div>
          <div className="card-body" style={{display:'flex',gap:32,alignItems:'center',flexWrap:'wrap'}}>
            <ResponsiveContainer width={260} height={200}>
              <PieChart>
                <Pie data={standingPie} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                  {standingPie.map((_,i)=><Cell key={i} fill={STANDING_COLORS[standingPie[i].name]||'#94a3b8'}/>)}
                </Pie>
                <Legend iconSize={10}/><Tooltip/>
              </PieChart>
            </ResponsiveContainer>
            <div style={{flex:1,display:'flex',flexDirection:'column',gap:8}}>
              {[
                {label:'First Class',        value:deptSummary.first_class,  color:'#f59e0b'},
                {label:'Second Class Upper', value:deptSummary.second_upper, color:'#16a34a'},
                {label:'Second Class Lower', value:deptSummary.second_lower, color:'#2563eb'},
                {label:'Third Class',        value:deptSummary.third_class,  color:'#64748b'},
                {label:'Fail',               value:deptSummary.fail,         color:'#dc2626'},
              ].map(item=>(
                <div key={item.label} style={{display:'flex',justifyContent:'space-between'}}>
                  <span style={{fontSize:13,display:'flex',alignItems:'center',gap:6}}>
                    <span style={{width:10,height:10,borderRadius:2,background:item.color,display:'inline-block'}}/>
                    {item.label}
                  </span>
                  <span style={{fontWeight:700,color:item.color}}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Uni bar chart */}
      {isUniCoord&&univData.length>0&&(
        <div className="card">
          <div className="card-header">
            <h2>University — Avg GPA by Department</h2>
            <button className="btn btn-ghost btn-sm" onClick={()=>navigate('/reports/university')}>
              Full Overview <ArrowRight size={13}/>
            </button>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={univData.map(d=>({name:d.department_code,'Avg GPA':d.avg_gpa,'In Danger':d.in_danger}))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)"/>
                <XAxis dataKey="name" tick={{fontSize:12}}/>
                <YAxis yAxisId="left" domain={[0,4]} tick={{fontSize:12}}/>
                <YAxis yAxisId="right" orientation="right" tick={{fontSize:12}}/>
                <Tooltip/><Legend iconSize={10}/>
                <Bar yAxisId="left"  dataKey="Avg GPA"   fill="var(--blue)" radius={[4,4,0,0]}/>
                <Bar yAxisId="right" dataKey="In Danger" fill="var(--red)"  radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
