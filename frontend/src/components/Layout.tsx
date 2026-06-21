import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, BookOpen, AlertCircle,
  Search, LogOut, ClipboardList, BarChart3,
  BookMarked, TrendingDown, GraduationCap, TrendingUp,
  Globe, Upload, UserCircle, ClipboardCheck, CalendarCheck, ListChecks
} from 'lucide-react';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const at = (p: string) =>
    p === '/'
      ? location.pathname === '/'
      : location.pathname === p || location.pathname.startsWith(p + '/');

  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || 'U';

  const roleLabel: Record<string, string> = {
    student:                 'Student',
    hod:                     'Head of Department',
    dept_coordinator:        'Dept Exams Coordinator',
    university_coordinator:  'University Exams Coordinator',
    exams_coordinator:       'Exams Coordinator',
  };

  const isStaff    = user?.role !== 'student';
  const isUniCoord = user?.role === 'university_coordinator';
  const isCoord    = ['dept_coordinator','university_coordinator','exams_coordinator'].includes(user?.role || '');
  const isHOD = user?.role === 'hod' || user?.role === 'university_coordinator';
  const isDeptCoord = user?.role === 'dept_coordinator';
  
  const pageTitle = () => {
    const p = location.pathname;
    if (p === '/')                         return 'Dashboard';
    if (p.startsWith('/profile'))          return 'My Profile';
    if (p.startsWith('/students'))         return 'Students';
    if (p.startsWith('/results/master'))   return 'Master Search';
    if (p.startsWith('/results/reports'))  return 'Department Report';
    if (p.startsWith('/results/entry'))    return 'Result Entry';
    if (p.startsWith('/results'))          return 'Results';
    if (p.startsWith('/reports/courses'))  return 'Course Offering Report';
    if (p.startsWith('/reports/programmes')) return 'Programme Report';
    if (p.startsWith('/reports/semester')) return 'Semester Report';
    if (p.startsWith('/reports/danger'))   return 'Danger & Graduation';
    if (p.startsWith('/reports/university')) return 'University Comparison';
    if (p.startsWith('/reports/batch'))    return 'Batch Upload';
    if (p.startsWith('/registration/manage'))        return 'Registration Management';
    if (p.startsWith('/admin/course-setup')) return 'Course Setup';
    if (p.startsWith('/registration'))     return 'Course Registration';
    if (p.startsWith('/grievances'))       return 'Grievances';
    if (p.startsWith('/reports/registration-status')) return 'Course Registration Status';
    return 'UENR STARS';
  };

  type NavItem = { label: string; icon: React.ReactNode; path: string };
  const NavBtn = ({ item }: { item: NavItem }) => (
    <button className={`nav-item ${at(item.path) ? 'active' : ''}`}
      onClick={() => navigate(item.path)}>
      {item.icon} {item.label}
    </button>
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>UENR <span>STARS</span></h1>
          <p>Academic Management System</p>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">{initials}</div>
          <div className="user-name">{user?.full_name}</div>
          <div className="user-role">{roleLabel[user?.role || ''] || user?.role}</div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Overview</div>
          <NavBtn item={{ label:'Dashboard', icon:<LayoutDashboard size={16}/>, path:'/' }} />

          {/* ── Student ── */}
          {user?.role === 'student' && <>
            <div className="nav-section-label">My Academic Record</div>
            <NavBtn item={{ label:'My Profile',       icon:<UserCircle size={16}/>,    path:'/profile' }} />
            <NavBtn item={{ label:'My Results',       icon:<BookOpen size={16}/>,      path:'/results' }} />
            <NavBtn item={{ label:'Course Registration', icon:<CalendarCheck size={16}/>, path:'/registration' }} />
            <NavBtn item={{ label:'My Grievances',    icon:<AlertCircle size={16}/>,   path:'/grievances' }} />
          </>}

          {/* ── Staff — Students ── */}
          {isStaff && <>
            <div className="nav-section-label">Students</div>
            <NavBtn item={{ label:'All Students',   icon:<Users size={16}/>,  path:'/students' }} />
            {isCoord && <NavBtn item={{ label:'Master Search', icon:<Search size={16}/>, path:'/results/master-search' }} />}
          </>}

          {/* ── Staff — Results ── */}
          {isStaff && <>
            <div className="nav-section-label">Results</div>
            {isDeptCoord && <NavBtn item={{ label:'Enter Results', icon:<ClipboardList size={16}/>, path:'/results/entry' }} />}
            {isDeptCoord && <NavBtn item={{ label:'Batch Upload',  icon:<Upload size={16}/>,        path:'/reports/batch' }} />}
            <NavBtn item={{ label:'Dept Report', icon:<BarChart3 size={16}/>, path:'/results/reports' }} />
          </>}

          {/* ── Staff — Registration ── */}
          {isHOD && <>
            <div className="nav-section-label">Registration</div>
            <NavBtn item={{ label:'Manage Registrations', icon:<ClipboardCheck size={16}/>, path:'/registration/manage' }} />
            <NavBtn item={{ label:'Course Setup',         icon:<BookOpen size={16}/>,       path:'/admin/course-setup' }} />
          </>}
          
          {/* ── Staff — Analytics ── */}
          {isStaff && <>
            <div className="nav-section-label">Analytics & Reports</div>
            <NavBtn item={{ label:'Course Report',    icon:<BookMarked size={16}/>,    path:'/reports/courses' }} />
            <NavBtn item={{ label:'Programme Report', icon:<GraduationCap size={16}/>, path:'/reports/programmes' }} />
            <NavBtn item={{ label:'Semester Report',  icon:<TrendingUp size={16}/>,    path:'/reports/semester' }} />
            <NavBtn item={{ label:'Danger & Grad.',   icon:<TrendingDown size={16}/>,  path:'/reports/danger' }} />
            <NavBtn item={{ label:'Registration Status', icon:<ClipboardCheck size={16}/>, path:'/reports/registration-status' }} />
            {isUniCoord && <NavBtn item={{ label:'University Overview', icon:<Globe size={16}/>, path:'/reports/university' }} />}
          </>}

          {/* ── Grievances ── */}
          <div className="nav-section-label">Support</div>
          <NavBtn item={{ label:'Grievances', icon:<AlertCircle size={16}/>, path:'/grievances' }} />
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item" onClick={() => { logout(); navigate('/login'); }}
            style={{ color:'#fca5a5' }}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <span className="topbar-title">{pageTitle()}</span>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            {(user as any)?.department_name && (
              <span style={{ fontSize:11, color:'var(--gray-500)', background:'var(--sky)', padding:'3px 10px', borderRadius:20 }}>
                {(user as any).department_name}
              </span>
            )}
            <span style={{ fontSize:12, color:'var(--gray-500)' }}>@{user?.username}</span>
            <div style={{
              width:32, height:32, borderRadius:'50%',
              background:'var(--navy)', color:'white',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:12, fontWeight:700,
            }}>{initials}</div>
          </div>
        </header>
        <main className="page-content"><Outlet /></main>
      </div>
    </div>
  );
};

export default Layout;
