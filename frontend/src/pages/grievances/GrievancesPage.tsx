import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { grievancesApi, studentsApi } from '../../api/client';
import { Grievance, Student } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Plus, AlertCircle, Clock, CheckCircle, XCircle, X,
         MessageSquare, Filter, ChevronRight, AlertTriangle } from 'lucide-react';

const statusMap: Record<string,{label:string;cls:string;icon:React.ReactNode}> = {
  pending:   {label:'Pending',      cls:'badge-gold',  icon:<Clock size={10}/>},
  in_review: {label:'Under Review', cls:'badge-blue',  icon:<AlertCircle size={10}/>},
  escalated: {label:'Escalated',    cls:'badge-red',   icon:<AlertTriangle size={10}/>},
  resolved:  {label:'Resolved',     cls:'badge-green', icon:<CheckCircle size={10}/>},
  rejected:  {label:'Rejected',     cls:'badge-gray',  icon:<XCircle size={10}/>},
};

const priorityCls: Record<string,string> = {
  high:'badge-red', medium:'badge-gold', low:'badge-gray'
};

const typeLabel: Record<string,string> = {
  result:'Result Issue', registration:'Registration', grade:'Grade Dispute',
  timetable:'Timetable', portal:'Portal Issue', lecturer:'Lecturer',
  graduation:'Graduation', transcript:'Transcript', feedback:'Feedback', other:'Other',
};

const GrievancesPage: React.FC = () => {
  const {user}  = useAuth();
  const navigate = useNavigate();
  const [grievances, setGrievances]     = useState<Grievance[]>([]);
  const [loading, setLoading]           = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter]     = useState('');
  const [priorityFilter, setPriority]   = useState('');
  const [showModal, setShowModal]       = useState(false);
  const [myStudent, setMyStudent]       = useState<Student|null>(null);
  const [form, setForm]                 = useState({subject:'',description:'',grievance_type:'result'});
  const [submitting, setSubmitting]     = useState(false);
  const [submitError, setSubmitError]   = useState('');
  const [previewPriority, setPreviewPriority] = useState<string|null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const params: Record<string,string> = {};
      if (statusFilter)   params.status        = statusFilter;
      if (typeFilter)     params.grievance_type = typeFilter;
      if (priorityFilter) params.priority       = priorityFilter;
      const res = await grievancesApi.list(params);
      setGrievances(res.data.results || res.data);
    } finally { setLoading(false); }
  };

  useEffect(()=>{ load(); },[statusFilter,typeFilter,priorityFilter]);

  useEffect(()=>{
    if(user?.role==='student'){
      studentsApi.list().then(res=>{
        const s=(res.data.results||res.data)[0];
        if(s) setMyStudent(s);
      });
    }
  },[user]);

  useEffect(()=>{
    if(!form.grievance_type) return;
    const HIGH=['result','registration','grade','graduation','transcript'];
    const MED=['timetable','portal','lecturer'];
    const text=(form.subject+' '+form.description).toLowerCase();
    const HKW=['missing result','missing grade','wrong gpa','incorrect gpa','cannot graduate',
      'transcript error','registration failed','wrong mark','incorrect mark','missing mark',
      'wrong score','failed incorrectly','wrong grade','incomplete result'];
    if(HIGH.includes(form.grievance_type)||HKW.some(k=>text.includes(k))) setPreviewPriority('high');
    else if(MED.includes(form.grievance_type)) setPreviewPriority('medium');
    else setPreviewPriority('low');
  },[form.grievance_type,form.subject,form.description]);

  const handleSubmit = async (e:React.FormEvent) => {
    e.preventDefault();
    if(!myStudent) return;
    setSubmitting(true); setSubmitError('');
    try {
      await grievancesApi.create({student:myStudent.id,...form});
      setShowModal(false);
      setForm({subject:'',description:'',grievance_type:'result'});
      await load();
    } catch { setSubmitError('Failed. Please try again.'); }
    finally { setSubmitting(false); }
  };

  const fmt = (d:string) => new Date(d).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:800,color:'var(--navy)'}}>Grievances</h1>
          <p style={{color:'var(--gray-500)',fontSize:13}}>
            {user?.role==='student'
              ? 'Raise and track your academic concerns'
              : 'Manage student grievances — priority is auto-assigned by the system'}
          </p>
        </div>
        {user?.role==='student' && (
          <button className="btn btn-primary" onClick={()=>setShowModal(true)}>
            <Plus size={14}/> Raise a Concern
          </button>
        )}
      </div>

      <div className="filters-row">
        <select className="form-control" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {Object.entries(statusMap).map(([v,s])=><option key={v} value={v}>{s.label}</option>)}
        </select>
        <select className="form-control" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          {Object.entries(typeLabel).map(([v,l])=><option key={v} value={v}>{l}</option>)}
        </select>
        <select className="form-control" value={priorityFilter} onChange={e=>setPriority(e.target.value)}>
          <option value="">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <button className="btn btn-secondary btn-sm" onClick={load}><Filter size={13}/> Refresh</button>
      </div>

      {loading ? <div className="loading-spinner">Loading…</div>
      : grievances.length===0 ? (
        <div className="empty-state">
          <AlertCircle size={48} color="var(--gray-300)"/>
          <h3>No grievances found</h3>
          {user?.role==='student' && <p>Click "Raise a Concern" to submit.</p>}
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {grievances.map(g=>{
            const s=statusMap[g.status]||statusMap['pending'];
            const isOverdue=g.is_overdue;
            const border=g.priority==='high'?'var(--red)':g.priority==='medium'?'var(--gold)':'var(--gray-300)';
            return (
              <div key={g.id} className="card"
                style={{cursor:'pointer',borderLeft:`4px solid ${border}`,background:isOverdue?'#fff8f5':undefined}}
                onClick={()=>navigate(`/grievances/${g.id}`)}>
                <div style={{padding:'14px 18px',display:'flex',alignItems:'center',gap:16}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',gap:6,marginBottom:5,flexWrap:'wrap',alignItems:'center'}}>
                      <span style={{fontSize:11,fontFamily:'DM Mono,monospace',color:'var(--gray-500)'}}>#{g.id}</span>
                      <span className={`badge ${s.cls}`}>{s.icon} {s.label}</span>
                      <span className={`badge ${priorityCls[g.priority]}`}>{g.priority}</span>
                      <span className="badge badge-navy">{typeLabel[g.grievance_type]}</span>
                      {isOverdue && <span className="badge badge-red">⏰ Overdue</span>}
                    </div>
                    <div style={{fontWeight:700,fontSize:14,color:'var(--navy)',marginBottom:3,
                      whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                      {g.subject}
                    </div>
                    <div style={{display:'flex',gap:16,flexWrap:'wrap',fontSize:12,color:'var(--gray-500)'}}>
                      {user?.role!=='student'&&g.student_name&&(
                        <span><strong style={{color:'var(--gray-700)'}}>{g.student_name}</strong> · {g.student_index}</span>
                      )}
                      {g.department_name&&user?.role!=='student'&&<span>{g.department_name}</span>}
                      <span>Filed {fmt(g.created_at)}</span>
                      {g.assigned_to_name&&<span>→ {g.assigned_to_name}</span>}
                      {g.days_until_deadline!=null&&!isOverdue&&(
                        <span style={{color:g.days_until_deadline<=2?'var(--red)':'var(--gray-500)'}}>
                          Due in {g.days_until_deadline}d
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
                    {(g.comment_count??0)>0&&(
                      <div style={{display:'flex',alignItems:'center',gap:4,color:'var(--gray-500)',fontSize:12}}>
                        <MessageSquare size={13}/><span>{g.comment_count}</span>
                      </div>
                    )}
                    <ChevronRight size={18} color="var(--gray-400)"/>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal&&(
        <div className="modal-overlay" onClick={()=>setShowModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3>Raise a Concern</h3>
              <button className="btn btn-ghost btn-sm" onClick={()=>setShowModal(false)}><X size={14}/></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {submitError&&<div className="alert alert-danger"><AlertCircle size={14}/><span>{submitError}</span></div>}
                <div className="form-group">
                  <label className="form-label">Type of Issue</label>
                  <select className="form-control" value={form.grievance_type}
                    onChange={e=>setForm(f=>({...f,grievance_type:e.target.value}))}>
                    {Object.entries(typeLabel).map(([v,l])=><option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input className="form-control" placeholder="Brief description of your concern"
                    value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))}
                    required maxLength={200}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Detailed Description</label>
                  <textarea className="form-control" style={{minHeight:120,resize:'vertical'}}
                    placeholder="Include course codes, semester, and relevant details…"
                    value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}
                    required/>
                </div>
                {previewPriority&&(
                  <div style={{padding:'10px 14px',borderRadius:8,marginBottom:12,
                    background:previewPriority==='high'?'#fff5f5':previewPriority==='medium'?'#fffbeb':'var(--gray-50)',
                    border:`1px solid ${previewPriority==='high'?'#fca5a5':previewPriority==='medium'?'#fcd34d':'var(--gray-200)'}`,
                    fontSize:12}}>
                    <strong>System Priority: </strong>
                    <span className={`badge ${priorityCls[previewPriority]}`} style={{marginLeft:4}}>
                      {previewPriority}
                    </span>
                    <span style={{color:'var(--gray-500)',marginLeft:8}}>
                      (automatically assigned based on issue type)
                    </span>
                  </div>
                )}
                <div className="alert alert-info" style={{fontSize:12}}>
                  <AlertCircle size={14}/>
                  <span>Priority is automatically set by the system and you will be routed to the appropriate coordinator.</span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={()=>setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting?'Submitting…':'Submit Concern'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GrievancesPage;
