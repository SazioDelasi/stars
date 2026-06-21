import React, { useEffect, useState } from 'react';
import { resultsApi, studentsApi } from '../../api/client';
import { Course, Programme } from '../../types';
import { Plus, Trash2, Edit2, CheckCircle, X, BookOpen, Lock } from 'lucide-react';

const semesterLabel = (y: number, s: number) => `Year ${y} — Semester ${s}`;

const YEARS_SEMESTERS = [
  { year: 1, semester: 1 }, { year: 1, semester: 2 },
  { year: 2, semester: 1 }, { year: 2, semester: 2 },
  { year: 3, semester: 1 }, { year: 3, semester: 2 },
  { year: 4, semester: 1 }, { year: 4, semester: 2 },
];

const electiveSlot = (year: number, semester: number) =>
  (year === 3 && semester === 2) || year === 4;

interface CourseForm {
  code: string; title: string; credit_hours: string; is_core: boolean;
}

const EMPTY_FORM: CourseForm = { code: '', title: '', credit_hours: '3', is_core: true };

const CourseSetupPage: React.FC = () => {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [selProg, setSelProg]       = useState('');
  const [selYear, setSelYear]       = useState(1);
  const [selSem, setSelSem]         = useState(1);
  const [courses, setCourses]       = useState<Course[]>([]);
  const [loading, setLoading]       = useState(false);
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState<CourseForm>(EMPTY_FORM);
  const [editId, setEditId]         = useState<number | null>(null);
  const [saving, setSaving]         = useState(false);
  const [msg, setMsg]               = useState('');
  const [msgType, setMsgType]       = useState<'success' | 'error'>('success');

  const flash = (text: string, type: 'success' | 'error' = 'success') => {
    setMsg(text); setMsgType(type); setTimeout(() => setMsg(''), 4000);
  };

  // Load programmes on mount
  useEffect(() => {
    studentsApi.programmes().then(res => {
      const progs: Programme[] = res.data.results || res.data;
      setProgrammes(progs);
      if (progs.length > 0) setSelProg(String(progs[0].id));
    });
  }, []);

  // Load courses when programme/year/semester changes
  useEffect(() => {
    if (!selProg) return;
    setLoading(true);
    resultsApi.courses({ year: String(selYear), semester: String(selSem) })
      .then(res => {
        const all: Course[] = res.data.results || res.data;
        // Show courses that belong to this programme's department
        // (department filter is enforced server-side)
        setCourses(all.filter(c =>
          c.year === selYear && c.semester === selSem
        ));
      })
      .finally(() => setLoading(false));
  }, [selProg, selYear, selSem]);

  const openAddForm = () => {
    setEditId(null);
    const isElectiveSlot = electiveSlot(selYear, selSem);
    setForm({ ...EMPTY_FORM, is_core: !isElectiveSlot });
    setShowForm(true);
  };

  const openEditForm = (c: Course) => {
    setEditId(c.id);
    setForm({
      code: c.code, title: c.title,
      credit_hours: String(c.credit_hours),
      is_core: c.is_core,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.code.trim() || !form.title.trim()) {
      flash('Course code and title are required.', 'error'); return;
    }
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        title: form.title.trim(),
        credit_hours: Number(form.credit_hours),
        year: selYear,
        semester: selSem,
        is_core: form.is_core,
        is_active: true,
      };
      if (editId) {
        await resultsApi.updateCourse(editId, payload);
        flash('Course updated.');
      } else {
        await resultsApi.createCourse(payload);
        flash('Course added.');
      }
      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditId(null);
      // Reload
      const res = await resultsApi.courses({ year: String(selYear), semester: String(selSem) });
      setCourses((res.data.results || res.data).filter((c: Course) =>
        c.year === selYear && c.semester === selSem
      ));
    } catch (e: any) {
      flash(e?.response?.data?.code?.[0] || e?.response?.data?.detail || 'Failed to save.', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (c: Course) => {
    if (!window.confirm(`Remove "${c.title}" from this semester?`)) return;
    try {
      await resultsApi.deleteCourse(c.id);
      flash(`${c.code} removed.`);
      setCourses(prev => prev.filter(x => x.id !== c.id));
    } catch { flash('Failed to remove.', 'error'); }
  };

  const isElective = electiveSlot(selYear, selSem);
  const coreCourses = courses.filter(c => c.is_core);
  const electiveCourses = courses.filter(c => !c.is_core);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)' }}>Course Setup</h1>
        <p style={{ color: 'var(--gray-500)', fontSize: 13 }}>
          Set core and elective courses for each year and semester.
          Students see exactly what you configure here when they register.
        </p>
      </div>

      {msg && (
        <div className={`alert ${msgType === 'success' ? 'alert-success' : 'alert-danger'}`}
          style={{ marginBottom: 16 }}>
          <CheckCircle size={14} /><span>{msg}</span>
        </div>
      )}

      {/* Controls */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label className="form-label">Programme</label>
              <select className="form-control" value={selProg}
                onChange={e => setSelProg(e.target.value)}>
                {programmes.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label className="form-label">Year &amp; Semester</label>
              <select className="form-control"
                value={`${selYear}-${selSem}`}
                onChange={e => {
                  const [y, s] = e.target.value.split('-').map(Number);
                  setSelYear(y); setSelSem(s);
                }}>
                {YEARS_SEMESTERS.map(({ year, semester }) => (
                  <option key={`${year}-${semester}`} value={`${year}-${semester}`}>
                    {semesterLabel(year, semester)}
                    {electiveSlot(year, semester) ? ' ⚡ (electives allowed)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" onClick={openAddForm}>
              <Plus size={14} /> Add Course
            </button>
          </div>
        </div>
      </div>

      {/* Elective notice */}
      {isElective ? (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          <BookOpen size={14} />
          <span>
            <strong>Year {selYear} Semester {selSem}</strong> — Students can choose electives here.
            Add both core courses (mandatory, auto-assigned) and electives (students pick from the list you set).
          </span>
        </div>
      ) : (
        <div className="alert" style={{ marginBottom: 16, background: 'var(--sky)', border: '1px solid var(--blue-light)' }}>
          <Lock size={14} />
          <span>
            <strong>Year {selYear} Semester {selSem}</strong> — Core only semester.
            All courses you add here will be automatically assigned to students when they register.
            No elective selection.
          </span>
        </div>
      )}

      {/* Add / Edit form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <h2>{editId ? 'Edit Course' : 'Add New Course'}</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => { setShowForm(false); setEditId(null); }}>
              <X size={14} />
            </button>
          </div>
          <div className="card-body">
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Course Code</label>
                <input className="form-control" placeholder="e.g. CSE301"
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Credit Hours</label>
                <select className="form-control" value={form.credit_hours}
                  onChange={e => setForm(f => ({ ...f, credit_hours: e.target.value }))}>
                  {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n} credit{n > 1 ? 's' : ''}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1', marginBottom: 0 }}>
                <label className="form-label">Course Title</label>
                <input className="form-control" placeholder="e.g. Advanced Algorithms"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              {isElective && (
                <div className="form-group" style={{ gridColumn: '1/-1', marginBottom: 0 }}>
                  <label className="form-label">Course Type</label>
                  <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                      <input type="radio" checked={form.is_core}
                        onChange={() => setForm(f => ({ ...f, is_core: true }))} />
                      <span>
                        <strong>Core</strong> — Automatically assigned to all students
                      </span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                      <input type="radio" checked={!form.is_core}
                        onChange={() => setForm(f => ({ ...f, is_core: false }))} />
                      <span>
                        <strong>Elective</strong> — Students choose from available list
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                <CheckCircle size={13} /> {saving ? 'Saving…' : editId ? 'Update Course' : 'Add Course'}
              </button>
              <button className="btn btn-secondary"
                onClick={() => { setShowForm(false); setEditId(null); }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Course tables */}
      {loading ? (
        <div className="loading-spinner">Loading courses…</div>
      ) : (
        <>
          {/* Core courses */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Lock size={14} color="var(--blue)" />
                Core Courses ({coreCourses.length})
              </h2>
              <span className="badge badge-blue">Auto-assigned to students</span>
            </div>
            {coreCourses.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--gray-500)', fontSize: 13 }}>
                No core courses set for this semester yet. Click "Add Course" above.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr><th>Code</th><th>Title</th><th>Credits</th><th>Type</th><th></th></tr>
                  </thead>
                  <tbody>
                    {coreCourses.map(c => (
                      <tr key={c.id}>
                        <td><span className="font-mono" style={{ fontSize: 12 }}>{c.code}</span></td>
                        <td style={{ fontWeight: 500 }}>{c.title}</td>
                        <td style={{ textAlign: 'center' }}>{c.credit_hours}</td>
                        <td><span className="badge badge-blue">Core</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => openEditForm(c)}>
                              <Edit2 size={13} />
                            </button>
                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }}
                              onClick={() => handleDelete(c)}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Elective courses — only show for Y3S2 and Y4 */}
          {isElective && (
            <div className="card">
              <div className="card-header">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BookOpen size={14} color="var(--green)" />
                  Available Electives ({electiveCourses.length})
                </h2>
                <span className="badge badge-green">Students choose from this list</span>
              </div>
              {electiveCourses.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--gray-500)', fontSize: 13 }}>
                  No elective courses added yet. Click "Add Course" and select "Elective" type.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table>
                    <thead>
                      <tr><th>Code</th><th>Title</th><th>Credits</th><th>Type</th><th></th></tr>
                    </thead>
                    <tbody>
                      {electiveCourses.map(c => (
                        <tr key={c.id}>
                          <td><span className="font-mono" style={{ fontSize: 12 }}>{c.code}</span></td>
                          <td style={{ fontWeight: 500 }}>{c.title}</td>
                          <td style={{ textAlign: 'center' }}>{c.credit_hours}</td>
                          <td><span className="badge badge-green">Elective</span></td>
                          <td>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button className="btn btn-ghost btn-sm" onClick={() => openEditForm(c)}>
                                <Edit2 size={13} />
                              </button>
                              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }}
                                onClick={() => handleDelete(c)}>
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CourseSetupPage;