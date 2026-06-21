import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentsApi } from '../../api/client';
import { Student, Department, Programme } from '../../types';
import { Search, AlertTriangle, Eye, Filter, Users, Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const statusBadge = (s: string) => ({
  active:'badge-green', repeating:'badge-gold',
  deferred:'badge-blue', graduated:'badge-navy', withdrawn:'badge-gray',
}[s] || 'badge-gray');

const gpaColor = (gpa: number) =>
  gpa >= 3.6 ? '#92400e' : gpa >= 3.0 ? 'var(--green)' :
  gpa >= 2.0 ? 'var(--blue)' : gpa >= 1.0 ? 'var(--gray-700)' : 'var(--red)';

const StudentsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents]         = useState<Student[]>([]);
  const [departments, setDepartments]   = useState<Department[]>([]);
  const [programmes, setProgrammes]     = useState<Programme[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [yearFilter, setYearFilter]     = useState('');
  const [deptFilter, setDeptFilter]     = useState('');
  const [progFilter, setProgFilter]     = useState('');
  const [standingFilter, setStandingFilter] = useState('');
  const [minGpa, setMinGpa]             = useState('');
  const [dangerOnly, setDangerOnly]     = useState(false);
  const [showFilters, setShowFilters]   = useState(false);
  const [groupBy, setGroupBy]           = useState<'none'|'year'|'programme'|'standing'>('none');

  const isUniCoord = user?.role === 'university_coordinator';

  const load = async () => {
    setLoading(true);
    try {
      const params: Record<string,string> = {};
      if (search)     params.search       = search;
      if (statusFilter) params.status     = statusFilter;
      if (yearFilter) params.current_year = yearFilter;
      if (deptFilter) params.department   = deptFilter;
      if (progFilter) params.programme    = progFilter;
      const [sRes, dRes, pRes] = await Promise.all([
        studentsApi.list(params),
        studentsApi.departments(),
        studentsApi.programmes(),
      ]);
      setStudents(sRes.data.results || sRes.data);
      setDepartments(dRes.data.results || dRes.data);
      setProgrammes(pRes.data.results || pRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, statusFilter, yearFilter, deptFilter, progFilter]);

  // Client-side filters
  let displayed = students;
  if (standingFilter) displayed = displayed.filter(s => s.academic_standing === standingFilter);
  if (minGpa)         displayed = displayed.filter(s => s.cumulative_gpa >= parseFloat(minGpa));
  if (dangerOnly)     displayed = displayed.filter(s => s.in_academic_danger);

  // Grouping
  const grouped = (() => {
    if (groupBy === 'none') return { All: displayed };
    const groups: Record<string, Student[]> = {};
    displayed.forEach(s => {
      let key = '';
      if (groupBy === 'year')      key = `Year ${s.current_year}`;
      if (groupBy === 'programme') key = s.programme_name;
      if (groupBy === 'standing')  key = s.academic_standing;
      groups[key] = groups[key] || [];
      groups[key].push(s);
    });
    return Object.fromEntries(Object.entries(groups).sort());
  })();

  const dangerCount  = displayed.filter(s => s.in_academic_danger).length;
  const firstClass   = displayed.filter(s => s.academic_standing === 'First Class').length;
  const avgGpa       = displayed.length
    ? (displayed.reduce((sum, s) => sum + s.cumulative_gpa, 0) / displayed.length).toFixed(2)
    : '—';

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'var(--navy)' }}>Students</h1>
          <p style={{ color:'var(--gray-500)', fontSize:13 }}>{displayed.length} students shown</p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="stats-grid" style={{ marginBottom:20 }}>
        <div className="stat-card"><div className="stat-icon blue"><Users size={18}/></div>
          <div><div className="stat-value" style={{ fontSize:22 }}>{displayed.length}</div><div className="stat-label">Total</div></div></div>
        <div className="stat-card"><div className="stat-icon gold"><Award size={18}/></div>
          <div><div className="stat-value" style={{ fontSize:22 }}>{firstClass}</div><div className="stat-label">First Class</div></div></div>
        <div className="stat-card"><div className="stat-icon red"><AlertTriangle size={18}/></div>
          <div><div className="stat-value" style={{ fontSize:22, color:dangerCount>0?'var(--red)':undefined }}>{dangerCount}</div><div className="stat-label">In Danger</div></div></div>
        <div className="stat-card"><div className="stat-icon green"><Award size={18}/></div>
          <div><div className="stat-value" style={{ fontSize:20 }}>{avgGpa}</div><div className="stat-label">Avg GPA</div></div></div>
      </div>

      <div className="card">
        {/* Search + filters bar */}
        <div className="card-header" style={{ flexWrap:'wrap', gap:10 }}>
          <div className="search-wrap" style={{ flex:2, minWidth:220 }}>
            <Search size={14} color="var(--gray-500)"/>
            <input placeholder="Search name or index number…" value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-control" style={{ flex:1, maxWidth:150 }}
            value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {['active','repeating','deferred','graduated','withdrawn'].map(s=>
              <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </select>
          <select className="form-control" style={{ flex:1, maxWidth:130 }}
            value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
            <option value="">All Years</option>
            {[1,2,3,4].map(y=><option key={y} value={y}>Year {y}</option>)}
          </select>
          {isUniCoord && (
            <select className="form-control" style={{ flex:1, maxWidth:180 }}
              value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
              <option value="">All Departments</option>
              {departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          )}
          <button className="btn btn-sm btn-secondary"
            onClick={() => navigate('/results/reports')}>
            <Filter size={13}/> Advanced Report
          </button>
        </div>

        {/* Extended filters */}
        {showFilters && (
          <div style={{ padding:'12px 24px', borderBottom:'1px solid var(--gray-100)', display:'flex', gap:12, flexWrap:'wrap', alignItems:'flex-end' }}>
            <div style={{ flex:1, minWidth:150 }}>
              <label className="form-label">Programme</label>
              <select className="form-control" value={progFilter} onChange={e=>setProgFilter(e.target.value)}>
                <option value="">All Programmes</option>
                {programmes.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div style={{ flex:1, minWidth:160 }}>
              <label className="form-label">Academic Standing</label>
              <select className="form-control" value={standingFilter} onChange={e=>setStandingFilter(e.target.value)}>
                <option value="">All Standings</option>
                {['First Class','Second Class Upper','Second Class Lower','Third Class','Fail'].map(s=>
                  <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ flex:1, minWidth:120 }}>
              <label className="form-label">Min GPA</label>
              <input type="number" step="0.1" min="0" max="4" className="form-control"
                placeholder="e.g. 1.5" value={minGpa} onChange={e=>setMinGpa(e.target.value)} />
            </div>
            <div style={{ flex:1, minWidth:130 }}>
              <label className="form-label">Group by</label>
              <select className="form-control" value={groupBy} onChange={e=>setGroupBy(e.target.value as any)}>
                <option value="none">No grouping</option>
                <option value="year">Year of Study</option>
                <option value="programme">Programme</option>
                <option value="standing">Academic Standing</option>
              </select>
            </div>
            <button className={`btn btn-sm ${dangerOnly?'btn-danger':'btn-secondary'}`}
              onClick={() => setDangerOnly(!dangerOnly)}>
              <AlertTriangle size={13}/> {dangerOnly ? 'Danger Only ✓' : 'Danger Only'}
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="loading-spinner">Loading students…</div>
          ) : displayed.length === 0 ? (
            <div className="empty-state"><h3>No students found</h3><p>Adjust your filters.</p></div>
          ) : (
            Object.entries(grouped).map(([groupLabel, groupStudents]) => (
              <React.Fragment key={groupLabel}>
                {groupBy !== 'none' && (
                  <div style={{
                    padding:'8px 16px', background:'var(--sky)',
                    fontWeight:700, fontSize:13, color:'var(--navy-mid)',
                    borderBottom:'1px solid var(--gray-200)'
                  }}>
                    {groupLabel} <span style={{ fontWeight:400, color:'var(--gray-500)', fontSize:12 }}>
                      ({groupStudents.length} students)
                    </span>
                  </div>
                )}
                <table>
                  {groupBy === 'none' && (
                    <thead>
                      <tr>
                        <th>Index No.</th><th>Name</th><th>Programme</th>
                        <th>Yr</th><th>Status</th><th>CuGPA</th>
                        <th>Standing</th><th>Trails</th><th>Risk</th><th></th>
                      </tr>
                    </thead>
                  )}
                  {groupBy !== 'none' && groupStudents === Object.values(grouped)[0] && (
                    <thead>
                      <tr>
                        <th>Index No.</th><th>Name</th><th>Programme</th>
                        <th>Yr</th><th>Status</th><th>CuGPA</th>
                        <th>Standing</th><th>Trails</th><th>Risk</th><th></th>
                      </tr>
                    </thead>
                  )}
                  <tbody>
                    {groupStudents.map(s => (
                      <tr key={s.id} style={{ cursor:'pointer', background:s.in_academic_danger?'#fff5f5':undefined }}
                        onClick={() => navigate(`/students/${s.id}`)}>
                        <td><span className="font-mono" style={{ fontSize:12 }}>{s.index_number}</span></td>
                        <td style={{ fontWeight:600, color:'var(--navy)' }}>{s.full_name}</td>
                        <td style={{ fontSize:12, color:'var(--gray-500)' }}>{s.programme_name}</td>
                        <td style={{ textAlign:'center' }}>{s.current_year}</td>
                        <td><span className={`badge ${statusBadge(s.status)}`}>{s.status}</span></td>
                        <td>
                          <span className="font-mono" style={{ fontWeight:800, color:gpaColor(s.cumulative_gpa) }}>
                            {s.cumulative_gpa.toFixed(2)}
                          </span>
                        </td>
                        <td style={{ fontSize:12 }}>{s.academic_standing}</td>
                        <td style={{ textAlign:'center', color:s.trail_count>0?'var(--red)':undefined, fontWeight:s.trail_count>0?700:400 }}>
                          {s.trail_count}
                        </td>
                        <td>
                          {s.in_academic_danger
                            ? <span className="badge badge-red"><AlertTriangle size={10}/> Danger</span>
                            : <span className="badge badge-green">OK</span>}
                        </td>
                        <td>
                          <button className="btn btn-ghost btn-sm"
                            onClick={e=>{e.stopPropagation();navigate(`/students/${s.id}`);}}>
                            <Eye size={13}/>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </React.Fragment>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentsPage;
