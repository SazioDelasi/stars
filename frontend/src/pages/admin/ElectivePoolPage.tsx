import React, { useEffect, useState } from 'react';
import { electivePoolApi, resultsApi, studentsApi } from '../../api/client';
import { AcademicYear, Course, Programme, ElectivePool } from '../../types';
import { Plus, Trash2, Settings, CheckCircle, X, BookMarked } from 'lucide-react';

const ElectivePoolPage: React.FC = () => {
  const [pools, setPools]               = useState<ElectivePool[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [programmes, setProgrammes]     = useState<Programme[]>([]);
  const [allCourses, setAllCourses]     = useState<Course[]>([]);
  const [activePool, setActivePool]     = useState<ElectivePool|null>(null);
  const [loading, setLoading]           = useState(true);
  const [msg, setMsg]                   = useState('');
  const [msgType, setMsgType]           = useState<'success'|'error'>('success');
  const [showNewForm, setShowNewForm]   = useState(false);
  const [newName, setNewName]   = useState('');
  const [newProg, setNewProg]   = useState('');
  const [newYOS, setNewYOS]     = useState('3');
  const [newSem, setNewSem]     = useState('1');
  const [newAY, setNewAY]       = useState('');
  const [newMaxEl, setNewMaxEl] = useState('2');
  const [newMaxCr, setNewMaxCr] = useState('6');
  const [creating, setCreating] = useState(false);
  const [selCourse, setSelCourse]     = useState('');
  const [addingCourse, setAddingCourse] = useState(false);

  const flash = (text: string, type: 'success'|'error' = 'success') => {
    setMsg(text); setMsgType(type); setTimeout(()=>setMsg(''), 4000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [pRes, ayRes, progRes, cRes] = await Promise.all([
        electivePoolApi.list(),
        resultsApi.academicYears(),
        studentsApi.programmes(),
        resultsApi.courses(),
      ]);
      setPools(pRes.data.results || pRes.data);
      const years: AcademicYear[] = ayRes.data.results || ayRes.data;
      setAcademicYears(years);
      const curr = years.find(y => y.is_current);
      if (curr) setNewAY(String(curr.id));
      setProgrammes(progRes.data.results || progRes.data);
      setAllCourses((cRes.data.results || cRes.data).filter((c: Course) => !c.is_core));
    } catch { flash('Failed to load.', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(()=>{ load(); },[]);

  const openPool = async (pool: ElectivePool) => {
    const res = await electivePoolApi.get(pool.id);
    setActivePool(res.data);
    setSelCourse('');
  };

  const handleCreate = async () => {
    if (!newName || !newAY) return flash('Name and academic year are required.','error');
    setCreating(true);
    try {
      const res = await electivePoolApi.create({
        name: newName, programme: newProg || null,
        year_of_study: Number(newYOS), semester: Number(newSem),
        academic_year: Number(newAY), max_electives: Number(newMaxEl),
        max_elective_credits: Number(newMaxCr), is_active: true,
      });
      flash('Pool created.');
      setShowNewForm(false);
      await load();
      setActivePool(res.data);
    } catch(e:any){ flash(e?.response?.data?.non_field_errors?.[0]||'Failed.','error'); }
    finally { setCreating(false); }
  };

  const handleAddCourse = async () => {
    if (!activePool || !selCourse) return;
    setAddingCourse(true);
    try {
      await electivePoolApi.addCourse(activePool.id, Number(selCourse));
      flash('Course added to pool.');
      const res = await electivePoolApi.get(activePool.id);
      setActivePool(res.data);
      await load();
    } catch(e:any){ flash(e?.response?.data?.error||'Failed.','error'); }
    finally { setAddingCourse(false); }
  };

  const handleRemoveCourse = async (courseId: number, code: string) => {
    if (!activePool || !window.confirm(`Remove ${code} from this pool?`)) return;
    try {
      await electivePoolApi.removeCourse(activePool.id, courseId);
      flash(`${code} removed.`);
      const res = await electivePoolApi.get(activePool.id);
      setActivePool(res.data);
      await load();
    } catch(e:any){ flash(e?.response?.data?.error||'Failed.','error'); }
  };

  const toggleActive = async (pool: ElectivePool) => {
    await electivePoolApi.update(pool.id, {is_active: !pool.is_active});
    flash(`Pool ${pool.is_active?'deactivated':'activated'}.`);
    await load();
    if (activePool?.id===pool.id) {
      const res = await electivePoolApi.get(pool.id);
      setActivePool(res.data);
    }
  };

  const alreadyInPool = new Set(activePool?.pool_courses.map(c=>c.course)||[]);
  const availableToAdd = allCourses.filter(c=>!alreadyInPool.has(c.id));

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:800,color:'var(--navy)'}}>Elective Pool Management</h1>
          <p style={{color:'var(--gray-500)',fontSize:13}}>
            Configure which electives students may choose per semester and year
          </p>
        </div>
        <button className="btn btn-primary" onClick={()=>setShowNewForm(!showNewForm)}>
          <Plus size={14}/> New Pool
        </button>
      </div>

      {msg&&(
        <div className={`alert ${msgType==='success'?'alert-success':'alert-danger'}`} style={{marginBottom:16}}>
          <CheckCircle size={14}/><span>{msg}</span>
        </div>
      )}

      {showNewForm&&(
        <div className="card" style={{marginBottom:20}}>
          <div className="card-header">
            <h2>Create New Elective Pool</h2>
            <button className="btn btn-ghost btn-sm" onClick={()=>setShowNewForm(false)}><X size={14}/></button>
          </div>
          <div className="card-body">
            <div className="grid-2" style={{gap:12}}>
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="form-label">Pool Name</label>
                <input className="form-control" placeholder='e.g. "CSE Year 3 Semester 1 Electives"'
                  value={newName} onChange={e=>setNewName(e.target.value)}/>
              </div>
              {[
                {label:'Programme (optional)', el:(
                  <select className="form-control" value={newProg} onChange={e=>setNewProg(e.target.value)}>
                    <option value="">All programmes in department</option>
                    {programmes.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>)},
                {label:'Academic Year', el:(
                  <select className="form-control" value={newAY} onChange={e=>setNewAY(e.target.value)}>
                    {academicYears.map(y=><option key={y.id} value={y.id}>{y.label}{y.is_current?' ✓':''}</option>)}
                  </select>)},
                {label:'Year of Study', el:(
                  <select className="form-control" value={newYOS} onChange={e=>setNewYOS(e.target.value)}>
                    {[1,2,3,4].map(y=><option key={y} value={y}>Year {y}</option>)}
                  </select>)},
                {label:'Semester', el:(
                  <select className="form-control" value={newSem} onChange={e=>setNewSem(e.target.value)}>
                    <option value="1">Semester 1</option><option value="2">Semester 2</option>
                  </select>)},
                {label:'Max Electives', el:(
                  <input type="number" min="1" max="5" className="form-control"
                    value={newMaxEl} onChange={e=>setNewMaxEl(e.target.value)}/>)},
                {label:'Max Elective Credits', el:(
                  <input type="number" min="1" max="20" className="form-control"
                    value={newMaxCr} onChange={e=>setNewMaxCr(e.target.value)}/>)},
              ].map(({label,el})=>(
                <div key={label} className="form-group" style={{marginBottom:0}}>
                  <label className="form-label">{label}</label>{el}
                </div>
              ))}
            </div>
            <div style={{marginTop:16,display:'flex',gap:8}}>
              <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
                <Plus size={13}/> {creating?'Creating…':'Create Pool'}
              </button>
              <button className="btn btn-secondary" onClick={()=>setShowNewForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid-2" style={{gap:20,alignItems:'flex-start'}}>
        <div>
          <h3 style={{fontSize:14,fontWeight:700,color:'var(--navy)',marginBottom:12}}>Configured Pools</h3>
          {loading?<div className="loading-spinner" style={{height:120}}>Loading…</div>
          :pools.length===0?(
            <div className="card"><div className="empty-state" style={{padding:'32px'}}>
              <Settings size={40} color="var(--gray-300)"/>
              <h3>No pools configured yet</h3>
              <p>Create a pool to control student elective choices.</p>
            </div></div>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {pools.map(pool=>(
                <div key={pool.id} className="card" style={{
                  padding:'14px 18px',cursor:'pointer',opacity:pool.is_active?1:0.6,
                  border:activePool?.id===pool.id?'2px solid var(--blue)':'1px solid var(--gray-200)',
                }} onClick={()=>openPool(pool)}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                    <div>
                      <div style={{fontWeight:700,color:'var(--navy)',fontSize:14}}>{pool.name}</div>
                      <div style={{fontSize:12,color:'var(--gray-500)',marginTop:2}}>
                        {pool.programme_name||'All programmes'} · Y{pool.year_of_study}S{pool.semester} · {pool.academic_year_label}
                      </div>
                      <div style={{fontSize:12,color:'var(--gray-500)',marginTop:2}}>
                        {pool.course_count} courses · Max {pool.max_electives} choice(s) · Max {pool.max_elective_credits} credits
                      </div>
                    </div>
                    <div style={{display:'flex',gap:6,alignItems:'center'}}>
                      <span className={`badge ${pool.is_active?'badge-green':'badge-gray'}`}>
                        {pool.is_active?'Active':'Inactive'}
                      </span>
                      <button className="btn btn-ghost btn-sm"
                        onClick={e=>{e.stopPropagation();toggleActive(pool);}}
                        title={pool.is_active?'Deactivate':'Activate'}>
                        {pool.is_active?'⏸':'▶'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {activePool?(
          <div>
            <h3 style={{fontSize:14,fontWeight:700,color:'var(--navy)',marginBottom:12}}>{activePool.name}</h3>
            <div className="card" style={{marginBottom:12}}>
              <div style={{padding:'14px 18px',display:'flex',gap:20,flexWrap:'wrap'}}>
                {[
                  {label:'Year/Semester', value:`Y${activePool.year_of_study} S${activePool.semester}`},
                  {label:'Academic Year', value:activePool.academic_year_label},
                  {label:'Programme',     value:activePool.programme_name||'All'},
                  {label:'Max Electives', value:String(activePool.max_electives)},
                  {label:'Max Credits',   value:String(activePool.max_elective_credits)},
                ].map(item=>(
                  <div key={item.label}>
                    <div style={{fontSize:10,color:'var(--gray-500)',textTransform:'uppercase',fontWeight:600}}>{item.label}</div>
                    <div style={{fontWeight:700,fontSize:13}}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{marginBottom:12}}>
              <div className="card-header">
                <h2><BookMarked size={14} style={{marginRight:6}}/>Approved Electives ({activePool.pool_courses.length})</h2>
              </div>
              {activePool.pool_courses.length===0?(
                <div style={{padding:'16px 20px',fontSize:13,color:'var(--gray-500)'}}>
                  No courses added yet.
                </div>
              ):(
                <div className="overflow-x-auto">
                  <table>
                    <thead><tr><th>Code</th><th>Course Title</th><th>Credits</th><th></th></tr></thead>
                    <tbody>
                      {activePool.pool_courses.map(pc=>(
                        <tr key={pc.id}>
                          <td><span className="font-mono" style={{fontSize:12}}>{pc.course_code}</span></td>
                          <td>{pc.course_title}</td>
                          <td style={{textAlign:'center'}}>{pc.credit_hours}</td>
                          <td>
                            <button className="btn btn-ghost btn-sm" style={{color:'var(--red)'}}
                              onClick={()=>handleRemoveCourse(pc.course, pc.course_code)}>
                              <Trash2 size={13}/>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {activePool.is_active&&(
              <div className="card">
                <div className="card-header"><h2>Add Course to Pool</h2></div>
                <div className="card-body">
                  <div style={{display:'flex',gap:8}}>
                    <select className="form-control" value={selCourse}
                      onChange={e=>setSelCourse(e.target.value)}>
                      <option value="">Select an elective course…</option>
                      {availableToAdd.map(c=>(
                        <option key={c.id} value={c.id}>{c.code} — {c.title} ({c.credit_hours} cr)</option>
                      ))}
                    </select>
                    <button className="btn btn-primary btn-sm" style={{whiteSpace:'nowrap'}}
                      onClick={handleAddCourse} disabled={!selCourse||addingCourse}>
                      <Plus size={13}/> {addingCourse?'Adding…':'Add'}
                    </button>
                  </div>
                  {availableToAdd.length===0&&(
                    <p style={{fontSize:12,color:'var(--gray-500)',marginTop:8}}>
                      All available elective courses are already in this pool.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ):(
          <div className="card">
            <div className="empty-state" style={{padding:'48px 20px'}}>
              <Settings size={40} color="var(--gray-300)"/>
              <h3>Select a pool to manage</h3>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ElectivePoolPage;
