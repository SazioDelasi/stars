import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { grievancesApi } from '../../api/client';
import { Grievance, GrievanceComment } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Send, CheckCircle, Clock, XCircle, AlertCircle,
         MessageSquare, User, Shield, Eye, EyeOff, AlertTriangle, X } from 'lucide-react';

const statusOptions = [
  {value:'pending',   label:'Pending',      cls:'badge-gold'},
  {value:'in_review', label:'Under Review', cls:'badge-blue'},
  {value:'escalated', label:'Escalated',    cls:'badge-red'},
  {value:'resolved',  label:'Resolved',     cls:'badge-green'},
  {value:'rejected',  label:'Rejected',     cls:'badge-gray'},
];
const priorityCls: Record<string,string> = {high:'badge-red',medium:'badge-gold',low:'badge-gray'};
const typeLabel: Record<string,string> = {
  result:'Result Issue',registration:'Registration Issue',grade:'Grade Dispute',
  timetable:'Timetable Conflict',portal:'Portal/System Issue',lecturer:'Lecturer Complaint',
  graduation:'Graduation Issue',transcript:'Transcript Issue',feedback:'General Feedback',other:'Other',
};

const GrievanceDetailPage: React.FC = () => {
  const {id}    = useParams<{id:string}>();
  const navigate = useNavigate();
  const {user}   = useAuth();
  const [grievance, setGrievance]   = useState<Grievance|null>(null);
  const [comments, setComments]     = useState<GrievanceComment[]>([]);
  const [loading, setLoading]       = useState(true);
  const [message, setMessage]       = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending]       = useState(false);
  const [updatingStatus, setUpdating] = useState(false);
  const [showOverride, setShowOverride] = useState(false);
  const [overridePriority, setOP]   = useState('');
  const [overrideReason, setOR]     = useState('');
  const [overriding, setOverriding] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isStaff = user?.role !== 'student';

  const load = async () => {
    try {
      const [gRes, cRes] = await Promise.all([
        grievancesApi.get(Number(id)),
        grievancesApi.comments(Number(id)),
      ]);
      setGrievance(gRes.data);
      setComments(cRes.data.results || cRes.data);
    } finally { setLoading(false); }
  };

  useEffect(()=>{ load(); },[id]);
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}); },[comments]);

  const sendMsg = async (e:React.FormEvent) => {
    e.preventDefault();
    if(!message.trim()) return;
    setSending(true);
    try {
      await grievancesApi.addComment(Number(id), message, isInternal && isStaff);
      setMessage(''); await load();
    } finally { setSending(false); }
  };

  const updateStatus = async (s:string) => {
    setUpdating(true);
    try { await grievancesApi.updateStatus(Number(id),s); await load(); }
    finally { setUpdating(false); }
  };

  const handleOverride = async () => {
    if(!overridePriority||!overrideReason.trim()){alert('Priority and reason required.');return;}
    setOverriding(true);
    try {
      await grievancesApi.updateStatus(Number(id),'',undefined,overridePriority,overrideReason);
      setShowOverride(false); setOP(''); setOR(''); await load();
    } catch(e:any){ alert(e?.response?.data?.error||'Failed.'); }
    finally{ setOverriding(false); }
  };

  const fmt = (d:string) => new Date(d).toLocaleString('en-GB',
    {day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});

  if(loading) return <div className="loading-spinner">Loading…</div>;
  if(!grievance) return <div className="empty-state"><h3>Grievance not found</h3></div>;

  const curStatus  = statusOptions.find(s=>s.value===grievance.status);
  const isResolved = ['resolved','rejected'].includes(grievance.status);
  const isOverdue  = grievance.is_overdue;
  const daysLeft   = grievance.days_until_deadline;
  const logs       = grievance.priority_logs || [];

  return (
    <div style={{maxWidth:900,margin:'0 auto'}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24}}>
        <button className="btn btn-secondary btn-sm" onClick={()=>navigate('/grievances')}>
          <ArrowLeft size={14}/> Back
        </button>
        <h1 style={{fontSize:18,fontWeight:800,color:'var(--navy)',flex:1}}>Grievance #{grievance.id}</h1>
        <div style={{display:'flex',gap:6,alignItems:'center'}}>
          {isOverdue&&<span className="badge badge-red">⏰ Overdue</span>}
          <span className={`badge ${curStatus?.cls||'badge-gray'}`}>{curStatus?.label}</span>
          <span className={`badge ${priorityCls[grievance.priority]}`}>{grievance.priority}</span>
        </div>
      </div>

      {/* Detail card */}
      <div className="card" style={{marginBottom:16}}>
        <div className="card-header">
          <div style={{flex:1}}>
            <div style={{display:'flex',gap:8,marginBottom:8,flexWrap:'wrap'}}>
              <span className={`badge ${curStatus?.cls||'badge-gray'}`}>{curStatus?.label}</span>
              <span className={`badge ${priorityCls[grievance.priority]}`}>{grievance.priority}</span>
              <span className="badge badge-navy">{typeLabel[grievance.grievance_type]}</span>
              {isOverdue&&<span className="badge badge-red">Overdue</span>}
            </div>
            <h2 style={{fontSize:18,fontWeight:700,color:'var(--navy)'}}>{grievance.subject}</h2>
          </div>
        </div>
        <div className="card-body">
          {isStaff&&(
            <div style={{background:'var(--sky)',borderRadius:10,padding:'12px 16px',marginBottom:16,
              display:'flex',gap:20,flexWrap:'wrap'}}>
              {[
                {l:'Student',    v:grievance.student_name||'—'},
                {l:'Index No.',  v:grievance.student_index||'—', mono:true},
                {l:'Department', v:(grievance as any).department_name||'—'},
                {l:'Assigned To',v:grievance.assigned_to_name||'Unassigned'},
              ].map(item=>(
                <div key={item.l}>
                  <div style={{fontSize:10,color:'var(--gray-500)',textTransform:'uppercase',letterSpacing:'0.6px',fontWeight:600}}>{item.l}</div>
                  <div style={{fontWeight:700,fontSize:13,fontFamily:(item as any).mono?'DM Mono,monospace':undefined}}>{item.v}</div>
                </div>
              ))}
            </div>
          )}
          <p style={{fontSize:14,color:'var(--gray-700)',lineHeight:1.7,marginBottom:16}}>{grievance.description}</p>
          <div style={{display:'flex',gap:20,fontSize:12,color:'var(--gray-500)',flexWrap:'wrap'}}>
            <span>Filed: {fmt(grievance.created_at)}</span>
            {grievance.response_deadline&&(
              <span style={{color:isOverdue?'var(--red)':daysLeft!=null&&daysLeft<=2?'#d97706':'var(--gray-500)'}}>
                {isOverdue
                  ? `⏰ Overdue since ${fmt(grievance.response_deadline)}`
                  : `Due: ${fmt(grievance.response_deadline)}${daysLeft!=null?` (${daysLeft}d left)`:''}`}
              </span>
            )}
            {grievance.resolved_at&&<span>Resolved: {fmt(grievance.resolved_at)}</span>}
          </div>
          {isStaff&&logs.length>0&&(
            <div style={{marginTop:16,padding:'10px 14px',background:'#fef9c3',borderRadius:8,border:'1px dashed #fde047'}}>
              <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',color:'#92400e',marginBottom:6}}>
                Priority Override History
              </div>
              {logs.map((log:any,i:number)=>(
                <div key={i} style={{fontSize:12,color:'#78350f',marginBottom:3}}>
                  {log.changed_by_name}: <strong>{log.old_priority}</strong> → <strong>{log.new_priority}</strong>
                  {log.reason&&<span style={{color:'#92400e'}}> — {log.reason}</span>}
                  <span style={{color:'#d97706',marginLeft:6}}>{fmt(log.changed_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Staff actions */}
      {isStaff&&!isResolved&&(
        <div className="card" style={{marginBottom:16}}>
          <div className="card-header"><h2>Update Status & Priority</h2></div>
          <div className="card-body">
            <div style={{marginBottom:12}}>
              <div style={{fontSize:12,fontWeight:600,color:'var(--gray-700)',marginBottom:6}}>Change Status:</div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {statusOptions.filter(s=>s.value!==grievance.status).map(opt=>(
                  <button key={opt.value} className="btn btn-secondary btn-sm"
                    onClick={()=>updateStatus(opt.value)} disabled={updatingStatus}
                    style={{borderLeft:`3px solid ${
                      opt.value==='resolved'?'var(--green)':opt.value==='rejected'?'var(--red)':
                      opt.value==='escalated'?'var(--red)':opt.value==='in_review'?'var(--blue)':'var(--gold)'}`}}>
                    {opt.value==='resolved'&&<CheckCircle size={12} color="var(--green)"/>}{' '}
                    {opt.value==='rejected'&&<XCircle size={12} color="var(--red)"/>}{' '}
                    {opt.value==='escalated'&&<AlertTriangle size={12} color="var(--red)"/>}{' '}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{fontSize:12,fontWeight:600,color:'var(--gray-700)',marginBottom:6}}>Override Priority (logged):</div>
              {!showOverride?(
                <button className="btn btn-secondary btn-sm" onClick={()=>setShowOverride(true)}>
                  Override System Priority
                </button>
              ):(
                <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'flex-end'}}>
                  <div style={{flex:1,minWidth:120}}>
                    <label className="form-label">New Priority</label>
                    <select className="form-control" value={overridePriority} onChange={e=>setOP(e.target.value)}>
                      <option value="">Select…</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div style={{flex:2,minWidth:200}}>
                    <label className="form-label">Reason (required)</label>
                    <input className="form-control" placeholder="Reason for override…"
                      value={overrideReason} onChange={e=>setOR(e.target.value)}/>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={handleOverride} disabled={overriding}>
                    {overriding?'Saving…':'Save'}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={()=>setShowOverride(false)}><X size={13}/></button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Comments */}
      <div className="card">
        <div className="card-header">
          <h2 style={{display:'flex',alignItems:'center',gap:8}}>
            <MessageSquare size={15}/> Conversation ({comments.length})
          </h2>
        </div>
        <div className="card-body">
          {comments.length===0?(
            <div style={{textAlign:'center',padding:'32px 0',color:'var(--gray-500)'}}>
              <MessageSquare size={32} color="var(--gray-300)" style={{marginBottom:8}}/>
              <p>No messages yet.</p>
            </div>
          ):(
            <div className="comment-thread" style={{marginBottom:24}}>
              {comments.map(c=>{
                const fromStudent=c.author_role==='student';
                const cls=c.is_internal?'internal':fromStudent?'student':'staff';
                return (
                  <div key={c.id} style={{display:'flex',flexDirection:'column',
                    alignItems:fromStudent?'flex-start':'flex-end'}}>
                    <div className={`comment-bubble ${cls}`}>
                      <div className="comment-meta" style={{display:'flex',alignItems:'center',gap:6}}>
                        {fromStudent?<User size={11}/>:<Shield size={11}/>}
                        <strong>{c.author_name}</strong>
                        <span style={{opacity:0.7}}>·</span>
                        <span>{fmt(c.created_at)}</span>
                        {c.is_internal&&(
                          <span style={{background:'#fde047',color:'#92400e',
                            padding:'1px 6px',borderRadius:10,fontSize:10,fontWeight:700}}>INTERNAL</span>
                        )}
                      </div>
                      <div className="comment-text">{c.message}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef}/>
            </div>
          )}
          {!isResolved?(
            <form onSubmit={sendMsg}>
              <div style={{border:'1.5px solid var(--gray-200)',borderRadius:10,overflow:'hidden'}}>
                <textarea style={{width:'100%',padding:'12px 16px',border:'none',outline:'none',
                  fontFamily:'Sora,sans-serif',fontSize:13,resize:'none',minHeight:80}}
                  placeholder={isStaff?'Type your response…':'Type your message…'}
                  value={message} onChange={e=>setMessage(e.target.value)}
                  onKeyDown={e=>{if(e.key==='Enter'&&e.ctrlKey) sendMsg(e as any);}}/>
                <div style={{padding:'8px 12px',background:'var(--gray-50)',
                  display:'flex',alignItems:'center',justifyContent:'space-between',
                  borderTop:'1px solid var(--gray-200)'}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    {isStaff&&(
                      <button type="button" className="btn btn-ghost btn-sm"
                        onClick={()=>setIsInternal(!isInternal)}
                        style={{fontSize:11,color:isInternal?'#92400e':'var(--gray-500)',
                          background:isInternal?'#fef9c3':undefined}}>
                        {isInternal?<EyeOff size={12}/>:<Eye size={12}/>}
                        {isInternal?' Internal Note':' Visible to Student'}
                      </button>
                    )}
                    <span style={{fontSize:11,color:'var(--gray-400)'}}>Ctrl+Enter to send</span>
                  </div>
                  <button type="submit" className="btn btn-primary btn-sm"
                    disabled={sending||!message.trim()}>
                    <Send size={13}/> {sending?'Sending…':'Send'}
                  </button>
                </div>
              </div>
            </form>
          ):(
            <div className="alert alert-success" style={{marginTop:16}}>
              <CheckCircle size={14}/>
              <span>This grievance has been <strong>{grievance.status}</strong> and is closed.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GrievanceDetailPage;
