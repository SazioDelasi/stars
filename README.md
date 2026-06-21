# UENR STARS — Student Tracker & Academic Results System

**University of Energy and Natural Resources**  
A full-stack academic information system built with Django REST Framework + React TypeScript.

---

##  Architecture

```
uenr_stars/
├── backend/          # Django REST API
│   ├── core/         # Settings, main URLs
│   ├── accounts/     # User auth (JWT), roles
│   ├── students/     # Student profiles, departments, programmes
│   ├── results/      # Courses, results, transcripts, PDF reports
│   └── grievances/   # Grievance workflow + comment threads
│
└── frontend/         # React TypeScript SPA
    └── src/
        ├── api/        # Axios API client
        ├── context/    # Auth context (JWT)
        ├── pages/
        │   ├── auth/       # Login
        │   ├── dashboard/  # Role-specific dashboard
        │   ├── students/   # Student list + detail/transcript
        │   ├── results/    # Results, entry, reports, master search
        │   └── grievances/ # Grievance list + detail/thread
        └── types/      # TypeScript interfaces
```

---

##  Running the Project

### Backend

```bash
cd backend
pip install -r requirements.txt  # django djangorestframework djangorestframework-simplejwt django-cors-headers django-filter reportlab
python manage.py migrate
python seed_data.py              # Creates demo data
python manage.py runserver       # Runs on http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
npm start                        # Runs on http://localhost:3000
```

---

##  Demo Accounts (all password: `stars2024`)

| Role | Username | Access |
|------|----------|--------|
| Exams Coordinator | `exams_coord` | Full system: master search, all reports, all grievances |
| Head of Department | `hod_cse` | CSE department: results entry, department report, grievances |
| Student | `kofi_adu` | Own results, own grievances |
| Student | `ama_boateng` | Own results, own grievances |
| Student | `yaw_mensah` | Own results (repeating, in danger) |
| Student | `akosua_frimpong` | Own results (First Class) |
| Student | `kweku_darko` | Own results |

---

##  Key Features

### Identity & Access Control (RBAC)
- JWT-based stateless auth (`access_token` + `refresh_token`)
- Three roles: Student, HoD, Exams Coordinator
- HoDs scoped to their department only
- Auto token refresh on 401

### Results Module
- **Grading System**: CA (out of 40) + Exam (out of 60) = Total (100)
- **Auto Grade Computation**: A+ (80+) → F (<40)
- **GPA Calculation**: Weighted by credit hours per course
- **Cumulative GPA**: Aggregated across all published semesters
- **Academic Standing**: First Class (≥3.6), 2nd Upper (≥3.0), 2nd Lower (≥2.0), Third (≥1.0)
- **Danger Detection**: CuGPA < 1.5 OR trail_count ≥ 3 triggers danger flag
- **Trail Course Tracking**: Failed courses flagged across repeat attempts
- **Course Equivalency**: `equivalent_to` FK on Course model maps old codes to new
- **Publish Workflow**: Marks remain unpublished (draft) until staff explicitly publishes

### Report Generation
- **Student Transcript (PDF)**: Full 4-year history, semester-by-semester, downloadable PDF via ReportLab
- **Department Report (PDF)**: All students with GPA, standing, danger flags — landscape A4 PDF
- **Master Search** (Exams Coordinator only): Pull any student's complete history by index number
- **Department Analytics**: Pie chart (standing distribution) + bar chart (GPA by student)

### Grievances Module
- Students raise concerns (type: result / grade / registration / other)
- Priority levels: low / medium / high (colour-coded with red left border for high)
- Status lifecycle: `open → in_review → resolved / rejected`
- **Comment Thread**: Real-time conversation between student and staff
- **Internal Notes**: Staff can post internal-only comments (visible only to staff, shown with yellow dashed border)
- Staff can update status directly from the grievance detail page
- Auto-timestamps on resolution

---

##  Database Schema (Key Models)

```
User (accounts) ─── role: student | hod | exams_coordinator
     │
     └─ Student ─── department, programme, status, current_year
          │
          ├─ CourseResult ─── course, academic_year, ca, exam, grade, grade_point, is_published
          ├─ SemesterResult ─── semester_gpa, total_credits, weighted_points
          └─ Grievance ─── type, priority, status, subject, description
               └─ GrievanceComment ─── author, message, is_internal
```

---

## 🔌 API Endpoints

### Auth
```
POST /api/auth/login/          → JWT login (returns access, refresh, user)
POST /api/auth/refresh/        → Refresh access token
GET  /api/auth/me/             → Current user profile
```

### Students
```
GET  /api/students/            → List students (filtered by role)
GET  /api/students/:id/        → Student detail
GET  /api/students/search/:idx/ → Search by index number (staff only)
GET  /api/departments/         → List departments
GET  /api/programmes/          → List programmes
```

### Results
```
GET  /api/results/academic-years/           → List academic years
GET  /api/results/courses/                  → List courses (filter by dept/year/sem)
GET  /api/results/course-results/           → List results (scoped by role)
POST /api/results/course-results/           → Enter a result (HoD)
POST /api/results/publish/                  → Publish batch of results
GET  /api/results/transcript/student/:id/   → Student transcript (JSON)
GET  /api/results/transcript/search/:idx/   → Master search by index (Exams Coordinator)
GET  /api/results/transcript/pdf/:idx/      → Download PDF transcript
GET  /api/results/department-report/        → Department analytics (JSON)
GET  /api/results/department-report/pdf/    → Download PDF department report
```

### Grievances
```
GET  /api/grievances/                     → List grievances (scoped)
POST /api/grievances/                     → Raise a grievance (student)
GET  /api/grievances/:id/                 → Grievance detail
PATCH /api/grievances/:id/status/         → Update status (staff)
GET  /api/grievances/:id/comments/        → Get comments
POST /api/grievances/:id/comments/        → Add comment
GET  /api/grievances/summary/             → Summary counts (dashboard)
```

---

##  Security Implementation

- **JWT (djangorestframework-simplejwt)**: 8-hour access tokens, 7-day rotating refresh tokens
- **RBAC enforcement**: Every view checks `request.user.role`; HoDs can only see their department
- **Django built-in protections**: XSS, CSRF, SQL injection prevention via ORM
- **No plain-text passwords**: Django's PBKDF2 hashing by default (can upgrade to Argon2)
- **Session-less**: JWT-based stateless API — no server-side session storage

---

##  Future Expansion (from proposal)

- [ ] Switch SQLite → PostgreSQL for production
- [ ] Add `django-argon2` for stronger password hashing
- [ ] AI Academic Advising endpoint (suggest study paths for students in danger)
- [ ] Push notifications (Firebase/WebSocket)
- [ ] Resource Library module (course study materials)
- [ ] Course registration gating (50% fee payment rule)
- [ ] Multi-department support for Exams Coordinator drill-down
