import React, { useEffect, useState } from 'react';
import { reportsApi, resultsApi } from '../../api/client';
import { Course } from '../../types';
import { Download, CheckCircle, XCircle, ChevronDown, ChevronUp, Users, AlertCircle } from 'lucide-react';

interface RegStudent {
  student_id: number; index_number: string; full_name: string;
  programme: string; year: number; reg_status: string; is_core: boolean;
}
interface NotRegStudent {
  student_id: number; index_number: string; full_name: string;
  programme: string; year: number;
}
interface CourseStatus {
  course_id: number; code: string; title: string;
  credit_hours: number; year: number; semester: number;
  is_core: boolean;
  registered_count: number; not_registered_count: number;
  registered: RegStudent[]; not_registered: NotRegStudent[];
}

const statusBadge = (s: string) => {
  const m: Record<string,string> = {
    draft:'badge-gray', submitted:'badge-gold',
    approved:'badge-green', rejected:'badge-red',
  };
  return m[s] || 'badge-gray';
};

const RegistrationStatusPage: React.FC = () => {
  const [courses, setCourses]       = useState<CourseStatus[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loading, setLoading]       = useState(false);
  const [selYear, setSelYear]       = useState('');
  const [selSem, setSelSem]         = useState('');
  const [selCourse, setSelCourse]   = useState('');
  const [expanded, setExpanded]     = useState<Record<number, 'registered'|'not_registered'|null>>({});
  const [downloading, setDownloading] = useState(false);

  // Load course list for the filter dropdown
  useEffect(() => {
    resultsApi.courses().then(res => setAllCourses(res.data.results || res.data));
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const params: Record<string,string> = {};
      if (selYear)   params.year      = selYear;
      if (selSem)    params.semester  = selSem;
      if (selCourse) params.course_id = selCourse;
      const res = await reportsApi.registrationStatus(params);
      setCourses(res.data.courses || []);
      setExpanded({});
    } catch { alert('Failed to load.'); }
    finally { setLoading(false); }
  };

  const download = async () => {
    setDownloading(true);
    try {
      const params: Record<string,string> = {};
      if (selYear)   params.year      = selYear;
      if (selSem)    params.semester  = selSem;
      if (selCourse) params.course_id = selCourse;
      const res = await reportsApi.registrationStatusExcel(params);
      const url = URL.createObjectURL(new Blob([res.data],
        { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const a = document.createElement('a');
      a.href = url; a.download = 'registration_status.xlsx'; a.click();
    } catch { alert('Download failed.'); }
    finally { setDownloading(false); }
  };

  const toggle = (courseId: number, section: 'registered'|'not_registered') => {
    setExpanded(prev => ({
      ...prev,
      [courseId]: prev[courseId] === section ? null : section,
    }));
  };

  const filteredCourses = allCourses.filter(c => {
    if (selYear && c.year !== Number(selYear)) return false;
    if (selSem  && c.semester !== Number(selSem)) return false;
    return true;
  });

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'var(--navy)' }}>
            Course Registration Status
          </h1>
          <p style={{ color:'var(--gray-500)', fontSize:13 }}>
            See which students have registered for each course and who has not
          </p>
        </div>
        {courses.length > 0 && (
          <button className="btn btn-secondary" onClick={download} disabled={downloading}>
            <Download size={14}/> {downloading ? 'Downloading…' : 'Download Excel'}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom:20 }}>
        <div className="card-body">
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'flex-end' }}>
            <div style={{ flex:1, minWidth:140 }}>
              <label className="form-label">Year</label>
              <select className="form-control" value={selYear}
                onChange={e => { setSelYear(e.target.value); setSelCourse(''); }}>
                <option value="">All Years</option>
                {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
            <div style={{ flex:1, minWidth:140 }}>
              <label className="form-label">Semester</label>
              <select className="form-control" value={selSem}
                onChange={e => { setSelSem(e.target.value); setSelCourse(''); }}>
                <option value="">All Semesters</option>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
              </select>
            </div>
            <div style={{ flex:2, minWidth:200 }}>
              <label className="form-label">Specific Course (optional)</label>
              <select className="form-control" value={selCourse}
                onChange={e => setSelCourse(e.target.value)}>
                <option value="">All Courses</option>
                {filteredCourses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.title}
                  </option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" onClick={load} disabled={loading}>
              {loading ? 'Loading…' : 'Load Status'}
            </button>
          </div>
        </div>
      </div>

      {/* Summary row */}
      {courses.length > 0 && (
        <div className="stats-grid" style={{ marginBottom:20 }}>
          <div className="stat-card">
            <div className="stat-icon blue"><Users size={18}/></div>
            <div>
              <div className="stat-value">{courses.length}</div>
              <div className="stat-label">Courses</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green"><CheckCircle size={18}/></div>
            <div>
              <div className="stat-value">
                {courses.reduce((sum, c) => sum + c.registered_count, 0)}
              </div>
              <div className="stat-label">Total Registrations</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon red"><XCircle size={18}/></div>
            <div>
              <div className="stat-value">
                {courses.reduce((sum, c) => sum + c.not_registered_count, 0)}
              </div>
              <div className="stat-label">Not Registered</div>
            </div>
          </div>
        </div>
      )}

      {/* Course cards */}
      {courses.length === 0 && !loading && (
        <div className="empty-state">
          <AlertCircle size={48} color="var(--gray-300)"/>
          <h3>Select filters and click "Load Status"</h3>
          <p>You can filter by year, semester, or pick a specific course.</p>
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {courses.map(course => (
          <div key={course.course_id} className="card">
            {/* Course header */}
            <div style={{
              padding:'16px 20px',
              display:'flex', justifyContent:'space-between', alignItems:'center',
              background: 'var(--sky)', borderRadius:'12px 12px 0 0',
            }}>
              <div>
                <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:4 }}>
                  <span className="font-mono" style={{ fontWeight:800, fontSize:15, color:'var(--navy)' }}>
                    {course.code}
                  </span>
                  <span className={`badge ${course.is_core ? 'badge-blue' : 'badge-green'}`}>
                    {course.is_core ? 'Core' : 'Elective'}
                  </span>
                  <span className="badge badge-gray">
                    Y{course.year} S{course.semester}
                  </span>
                  <span className="badge badge-navy">{course.credit_hours} cr</span>
                </div>
                <div style={{ fontSize:14, fontWeight:600, color:'var(--navy)' }}>{course.title}</div>
              </div>
              <div style={{ display:'flex', gap:16, alignItems:'center' }}>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:22, fontWeight:800, color:'var(--green)' }}>
                    {course.registered_count}
                  </div>
                  <div style={{ fontSize:11, color:'var(--gray-500)' }}>Registered</div>
                </div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:22, fontWeight:800,
                    color: course.not_registered_count > 0 ? 'var(--red)' : 'var(--gray-400)' }}>
                    {course.not_registered_count}
                  </div>
                  <div style={{ fontSize:11, color:'var(--gray-500)' }}>Not Registered</div>
                </div>
              </div>
            </div>

            {/* Toggle buttons */}
            <div style={{
              display:'flex', borderTop:'1px solid var(--gray-200)',
            }}>
              <button
                onClick={() => toggle(course.course_id, 'registered')}
                style={{
                  flex:1, padding:'10px', border:'none', borderRight:'1px solid var(--gray-200)',
                  background: expanded[course.course_id]==='registered' ? '#f0fdf4' : 'white',
                  cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                  gap:6, fontSize:13, fontWeight:600,
                  color: expanded[course.course_id]==='registered' ? 'var(--green)' : 'var(--gray-600)',
                  borderRadius:'0 0 0 12px',
                }}>
                <CheckCircle size={14} color="var(--green)"/>
                Show Registered ({course.registered_count})
                {expanded[course.course_id]==='registered'
                  ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
              </button>
              <button
                onClick={() => toggle(course.course_id, 'not_registered')}
                style={{
                  flex:1, padding:'10px', border:'none',
                  background: expanded[course.course_id]==='not_registered' ? '#fff5f5' : 'white',
                  cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                  gap:6, fontSize:13, fontWeight:600,
                  color: expanded[course.course_id]==='not_registered' ? 'var(--red)' : 'var(--gray-600)',
                  borderRadius:'0 0 12px 0',
                }}>
                <XCircle size={14} color="var(--red)"/>
                Not Registered ({course.not_registered_count})
                {expanded[course.course_id]==='not_registered'
                  ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
              </button>
            </div>

            {/* Registered students table */}
            {expanded[course.course_id] === 'registered' && (
              <div className="overflow-x-auto">
                {course.registered.length === 0 ? (
                  <div style={{ padding:'16px 20px', color:'var(--gray-500)', fontSize:13 }}>
                    No students have registered for this course yet.
                  </div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>#</th><th>Index No.</th><th>Name</th>
                        <th>Programme</th><th>Year</th><th>Reg. Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {course.registered.map((s, i) => (
                        <tr key={s.student_id}>
                          <td style={{ color:'var(--gray-500)' }}>{i+1}</td>
                          <td><span className="font-mono" style={{ fontSize:12 }}>{s.index_number}</span></td>
                          <td style={{ fontWeight:600 }}>{s.full_name}</td>
                          <td style={{ fontSize:12, color:'var(--gray-500)' }}>{s.programme}</td>
                          <td style={{ textAlign:'center' }}>{s.year}</td>
                          <td>
                            <span className={`badge ${statusBadge(s.reg_status)}`}>
                              {s.reg_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Not registered students table */}
            {expanded[course.course_id] === 'not_registered' && (
              <div className="overflow-x-auto">
                {course.not_registered.length === 0 ? (
                  <div style={{ padding:'16px 20px', color:'var(--green)', fontSize:13, fontWeight:600 }}>
                    ✓ All eligible students have registered for this course.
                  </div>
                ) : (
                  <table>
                    <thead>
                      <tr style={{ background:'#fff5f5' }}>
                        <th>#</th><th>Index No.</th><th>Name</th>
                        <th>Programme</th><th>Year</th>
                      </tr>
                    </thead>
                    <tbody>
                      {course.not_registered.map((s, i) => (
                        <tr key={s.student_id} style={{ background: i%2===0 ? '#fff5f5' : 'white' }}>
                          <td style={{ color:'var(--gray-500)' }}>{i+1}</td>
                          <td><span className="font-mono" style={{ fontSize:12 }}>{s.index_number}</span></td>
                          <td style={{ fontWeight:600 }}>{s.full_name}</td>
                          <td style={{ fontSize:12, color:'var(--gray-500)' }}>{s.programme}</td>
                          <td style={{ textAlign:'center' }}>{s.year}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RegistrationStatusPage;