import React, { useState, useEffect, useRef, useCallback } from 'react';
import { searchApi, resultsApi, studentsApi } from '../../api/client';
import { useNavigate } from 'react-router-dom';
import { SearchResult, Department, Programme } from '../../types';
import {
  Search, Download, AlertTriangle, Filter,
  ChevronRight, X, SlidersHorizontal, User
} from 'lucide-react';

const standingBadge = (s: string) => {
  const m: Record<string,string> = {
    'First Class':'badge-gold','Second Class Upper':'badge-green',
    'Second Class Lower':'badge-blue','Third Class':'badge-gray','Fail':'badge-red',
  };
  return m[s] || 'badge-gray';
};

const gpaColor = (gpa: number) =>
  gpa >= 3.6 ? '#92400e' : gpa >= 3.0 ? 'var(--green)' :
  gpa >= 2.0 ? 'var(--blue)' : 'var(--red)';

const MasterSearchPage: React.FC = () => {
  const navigate = useNavigate();

  const [query, setQuery]             = useState('');
  const [results, setResults]         = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [sugLoading, setSugLoading]   = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [programmes, setProgrammes]   = useState<Programme[]>([]);
  const [selDept, setSelDept]         = useState('');
  const [selProg, setSelProg]         = useState('');
  const [selYear, setSelYear]         = useState('');
  const [selStanding, setSelStanding] = useState('');
  const [minGpa, setMinGpa]           = useState('');
  const [maxGpa, setMaxGpa]           = useState('');
  const [dangerOnly, setDangerOnly]   = useState(false);

  const inputRef    = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Promise.all([studentsApi.departments(), studentsApi.programmes()]).then(([d, p]) => {
      setDepartments(d.data.results || d.data);
      setProgrammes(p.data.results || p.data);
    });
    inputRef.current?.focus();

    // Close dropdown when clicking outside
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Debounced live suggestions as user types
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSugLoading(true);
      try {
        const params: Record<string,string> = { q: query.trim() };
        if (selDept) params.department_id = selDept;
        const res = await searchApi.global(params);
        const top10 = (res.data.results || []).slice(0, 10);
        setSuggestions(top10);
        setShowDropdown(top10.length > 0);
      } catch { setSuggestions([]); }
      finally { setSugLoading(false); }
    }, 300); // 300ms debounce
  }, [query, selDept]);

  const buildParams = () => {
    const params: Record<string,string> = { q: query.trim() };
    if (selDept)     params.department_id  = selDept;
    if (selProg)     params.programme_id   = selProg;
    if (selYear)     params.year           = selYear;
    if (selStanding) params.standing       = selStanding;
    if (minGpa)      params.min_gpa        = minGpa;
    if (maxGpa)      params.max_gpa        = maxGpa;
    if (dangerOnly)  params.danger_only    = 'true';
    return params;
  };

  const doSearch = async () => {
    setShowDropdown(false);
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await searchApi.global(buildParams());
      setResults(res.data.results || []);
    } catch { setResults([]); }
    finally { setLoading(false); }
  };

  const selectSuggestion = (r: SearchResult) => {
    setShowDropdown(false);
    setQuery(r.full_name);
    // Navigate directly to student profile
    navigate(`/students/${r.id}`);
  };

  const clearAll = () => {
    setQuery(''); setResults([]); setSuggestions([]);
    setHasSearched(false); setShowDropdown(false);
    inputRef.current?.focus();
  };

  const downloadTranscript = async (indexNumber: string) => {
    try {
      const res = await resultsApi.transcriptPDF(indexNumber);
      const url = URL.createObjectURL(new Blob([res.data], { type:'application/pdf' }));
      const a = document.createElement('a');
      a.href = url; a.download = `transcript_${indexNumber}.pdf`; a.click();
    } catch { alert('Failed to download.'); }
  };

  const activeFilters = [selDept,selProg,selYear,selStanding,minGpa,maxGpa,dangerOnly].filter(Boolean).length;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)' }}>Global Student Search</h1>
        <p style={{ color: 'var(--gray-500)', fontSize: 13 }}>
          Search by name, partial name, index number, programme or department
        </p>
      </div>

      {/* Search bar with dropdown */}
      <div className="card" style={{ marginBottom: 16, padding: '20px 24px' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {/* Input + dropdown wrapper */}
          <div ref={dropdownRef} style={{ flex: 1, position: 'relative' }}>
            <div className="search-wrap" style={{ padding: '12px 16px' }}>
              <Search size={18} color="var(--gray-500)" />
              <input
                ref={inputRef}
                style={{ fontSize: 15, fontFamily: 'Sora,sans-serif' }}
                placeholder='Type a name, index number or programme… e.g. "Kofi" or "UEB2100"'
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') doSearch();
                  if (e.key === 'Escape') setShowDropdown(false);
                }}
                onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                autoComplete="off"
              />
              {sugLoading && (
                <div style={{ width: 16, height: 16, border: '2px solid var(--blue)',
                  borderTopColor: 'transparent', borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite' }} />
              )}
              {query && (
                <button style={{ border: 'none', background: 'none', cursor: 'pointer',
                  color: 'var(--gray-400)', padding: 0 }} onClick={clearAll}>
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Live dropdown  */}
            {showDropdown && suggestions.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                background: 'white', border: '1px solid var(--gray-200)',
                borderRadius: '0 0 12px 12px', boxShadow: 'var(--shadow-lg)',
                maxHeight: 380, overflowY: 'auto',
              }}>
                <div style={{ padding: '6px 12px', fontSize: 11, color: 'var(--gray-400)',
                  fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px',
                  borderBottom: '1px solid var(--gray-100)' }}>
                  {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''}
                </div>
                {suggestions.map(r => (
                  <div key={r.id}
                    style={{
                      padding: '10px 16px', cursor: 'pointer', display: 'flex',
                      alignItems: 'center', gap: 12,
                      borderBottom: '1px solid var(--gray-50)',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--sky)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                    onMouseDown={() => selectSuggestion(r)}
                  >
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%',
                      background: 'var(--navy)', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, flexShrink: 0,
                    }}>
                      {r.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 14 }}>
                        {r.full_name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--gray-500)', display: 'flex', gap: 8 }}>
                        <span className="font-mono">{r.index_number}</span>
                        <span>·</span>
                        <span>{r.programme}</span>
                        <span>·</span>
                        <span>Year {r.current_year}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <span className="font-mono" style={{
                        fontWeight: 800, fontSize: 13,
                        color: gpaColor(r.cumulative_gpa)
                      }}>
                        {r.cumulative_gpa.toFixed(2)}
                      </span>
                      {r.in_danger && <AlertTriangle size={13} color="var(--red)" />}
                    </div>
                  </div>
                ))}
                <div style={{ padding: '8px 16px', borderTop: '1px solid var(--gray-100)',
                  textAlign: 'center' }}>
                  <button className="btn btn-ghost btn-sm" onClick={doSearch}
                    style={{ fontSize: 12, color: 'var(--blue)' }}>
                    See all results for "{query}"
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Filter toggle */}
          <button className="btn btn-secondary" onClick={() => setShowFilters(!showFilters)}
            style={{ position: 'relative' }}>
            <SlidersHorizontal size={15} /> Filters
            {activeFilters > 0 && (
              <span style={{
                position: 'absolute', top: -6, right: -6,
                background: 'var(--red)', color: 'white', borderRadius: '50%',
                width: 18, height: 18, fontSize: 10, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{activeFilters}</span>
            )}
          </button>

          {/* Search button */}
          <button className="btn btn-primary" style={{ padding: '12px 28px' }}
            onClick={doSearch} disabled={loading}>
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--gray-200)' }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              {[
                { label: 'Department', el: (
                  <select className="form-control" value={selDept} onChange={e => setSelDept(e.target.value)}>
                    <option value="">All Departments</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>) },
                { label: 'Programme', el: (
                  <select className="form-control" value={selProg} onChange={e => setSelProg(e.target.value)}>
                    <option value="">All Programmes</option>
                    {programmes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>) },
                { label: 'Year', el: (
                  <select className="form-control" value={selYear} onChange={e => setSelYear(e.target.value)}>
                    <option value="">All Years</option>
                    {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>) },
                { label: 'Standing', el: (
                  <select className="form-control" value={selStanding} onChange={e => setSelStanding(e.target.value)}>
                    <option value="">All Standings</option>
                    {['First Class','Second Class Upper','Second Class Lower','Third Class','Fail']
                      .map(s => <option key={s} value={s}>{s}</option>)}
                  </select>) },
                { label: 'Min GPA', el: (
                  <input type="number" step="0.1" min="0" max="4" className="form-control"
                    placeholder="e.g. 2.0" value={minGpa} onChange={e => setMinGpa(e.target.value)} />) },
                { label: 'Max GPA', el: (
                  <input type="number" step="0.1" min="0" max="4" className="form-control"
                    placeholder="e.g. 4.0" value={maxGpa} onChange={e => setMaxGpa(e.target.value)} />) },
              ].map(({ label, el }) => (
                <div key={label} style={{ flex: 1, minWidth: 140, marginBottom: 0 }}>
                  <label className="form-label">{label}</label>{el}
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingBottom: 2 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  <input type="checkbox" checked={dangerOnly}
                    onChange={e => setDangerOnly(e.target.checked)} />
                  Danger Only
                </label>
                {activeFilters > 0 && (
                  <button className="btn btn-ghost btn-sm" onClick={() => {
                    setSelDept(''); setSelProg(''); setSelYear('');
                    setSelStanding(''); setMinGpa(''); setMaxGpa(''); setDangerOnly(false);
                  }}>
                    <X size={12} /> Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Full results table */}
      {loading && <div className="loading-spinner">Searching…</div>}

      {!loading && hasSearched && (
        <div className="card">
          <div className="card-header">
            <h2>
              {results.length === 0 ? 'No results found' : `${results.length} student${results.length !== 1 ? 's' : ''} found`}
              {query && (
                <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--gray-500)', marginLeft: 8 }}>
                  for "{query}"
                </span>
              )}
            </h2>
          </div>
          {results.length > 0 ? (
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>#</th><th>Index No.</th><th>Full Name</th>
                    <th>Department</th><th>Programme</th><th>Yr</th>
                    <th>Status</th><th>CuGPA</th><th>Standing</th>
                    <th>Trails</th><th>Risk</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={r.id} style={{ background: r.in_danger ? '#fff5f5' : undefined }}>
                      <td style={{ color: 'var(--gray-500)' }}>{i+1}</td>
                      <td><span className="font-mono" style={{ fontSize: 12, fontWeight: 700 }}>{r.index_number}</span></td>
                      <td style={{ fontWeight: 600, color: 'var(--navy)' }}>{r.full_name}</td>
                      <td style={{ fontSize: 12 }}>{r.department}</td>
                      <td style={{ fontSize: 12 }}>{r.programme}</td>
                      <td style={{ textAlign: 'center' }}>{r.current_year}</td>
                      <td>
                        <span className={`badge ${r.status==='active'?'badge-green':r.status==='repeating'?'badge-gold':'badge-gray'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td>
                        <span className="font-mono" style={{ fontWeight: 800, color: gpaColor(r.cumulative_gpa) }}>
                          {r.cumulative_gpa.toFixed(2)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${standingBadge(r.academic_standing)}`} style={{ fontSize: 10 }}>
                          {r.academic_standing}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center',
                        color: r.trail_count > 0 ? 'var(--red)' : undefined,
                        fontWeight: r.trail_count > 0 ? 700 : 400 }}>
                        {r.trail_count}
                      </td>
                      <td>
                        {r.in_danger
                          ? <span className="badge badge-red"><AlertTriangle size={10}/> Danger</span>
                          : <span className="badge badge-green">OK</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-ghost btn-sm" title="View profile"
                            onClick={() => navigate(`/students/${r.id}`)}>
                            <ChevronRight size={14}/>
                          </button>
                          <button className="btn btn-ghost btn-sm" title="Download transcript"
                            onClick={() => downloadTranscript(r.index_number)}>
                            <Download size={13}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <User size={48} color="var(--gray-300)" />
              <h3>No students matched your search</h3>
              <p>Try a different name or partial name. For full names like "Kofi Adu", type either "Kofi" or "Adu".</p>
            </div>
          )}
        </div>
      )}

      {!hasSearched && !loading && (
        <div className="empty-state" style={{ padding: '60px 20px' }}>
          <Search size={52} color="var(--gray-300)" />
          <h3>Start typing to search</h3>
          <p style={{ maxWidth: 380, margin: '8px auto 0' }}>
            Results appear as you type. Click a suggestion to go directly to that student's profile,
            or press Enter to see the full results table.
          </p>
          <div style={{ marginTop: 20, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['Kofi', 'Ama', 'UEB210', 'Computer Science'].map(hint => (
              <button key={hint} className="btn btn-secondary btn-sm"
                onClick={() => { setQuery(hint); }}>
                {hint}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterSearchPage;
