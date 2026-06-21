import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh/`, { refresh });
          localStorage.setItem('access_token', data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login/', { username, password }),
  me: () => api.get('/auth/me/'),
};

// Students
export const studentsApi = {
  list: (params?: Record<string, string>) => api.get('/students/', { params }),
  get: (id: number) => api.get(`/students/${id}/`),
  search: (index: string) => api.get(`/students/search/${index}/`),
  departments: () => api.get('/departments/'),
  programmes: (deptId?: number) => api.get('/programmes/', { params: deptId ? { department: deptId } : {} }),
};

// Results
export const resultsApi = {
  academicYears: () => api.get('/results/academic-years/'),
  courses: (params?: Record<string, string>) => api.get('/results/courses/', { params }),
  createCourse: (data: Record<string, unknown>) => api.post('/results/courses/', data),
  updateCourse: (id: number, data: Record<string, unknown>) => api.patch(`/results/courses/${id}/`, data),
  deleteCourse: (id: number) => api.delete(`/results/courses/${id}/`),
  courseResults: (params?: Record<string, string>) => api.get('/results/course-results/', { params }),
  createResult: (data: Record<string, unknown>) => api.post('/results/course-results/', data),
  updateResult: (id: number, data: Record<string, unknown>) => api.patch(`/results/course-results/${id}/`, data),
  publishResults: (data: Record<string, unknown>) => api.post('/results/publish/', data),
  transcript: (studentId: number) => api.get(`/results/transcript/student/${studentId}/`),
  transcriptByIndex: (index: string) => api.get(`/results/transcript/search/${index}/`),
  transcriptPDF: (index: string) => api.get(`/results/transcript/pdf/${index}/`, { responseType: 'blob' }),
  departmentReport: (params?: Record<string, string>) => api.get('/reports/departments/', { params }),
  departmentReportPDF: (params?: Record<string, string>) =>
    api.get('/reports/departments/pdf/', { params, responseType: 'blob' }),
};

// Grievances
export const grievancesApi = {
  list:      (params?: Record<string,string>) => api.get('/grievances/', { params }),
  get:       (id: number)                     => api.get(`/grievances/${id}/`),
  create:    (data: Record<string,unknown>)   => api.post('/grievances/', data),
  update:    (id: number, data: Record<string,unknown>) => api.patch(`/grievances/${id}/`, data),
  updateStatus: (id: number, status: string, assigned_to?: number,
                 priority?: string, reason?: string) =>
    api.patch(`/grievances/${id}/status/`, {
      ...(status   ? { status }                : {}),
      ...(assigned_to ? { assigned_to }        : {}),
      ...(priority ? { priority, reason }      : {}),
    }),
  comments:   (grievanceId: number) => api.get(`/grievances/${grievanceId}/comments/`),
  addComment: (grievanceId: number, message: string, is_internal?: boolean) =>
    api.post(`/grievances/${grievanceId}/comments/`,
             { grievance: grievanceId, message, is_internal }),
  summary:    () => api.get('/grievances/summary/'),
};

// Reports
export const reportsApi = {
  // Course offering
  courseOffering:      (p?: Record<string,string>) => api.get('/reports/courses/', { params: p }),
  courseOfferingPDF:   (p?: Record<string,string>) => api.get('/reports/courses/pdf/', { params: p, responseType: 'blob' }),
  courseOfferingExcel: (p?: Record<string,string>) => api.get('/reports/courses/excel/', { params: p, responseType: 'blob' }),
  courseOfferingCSV:   (p?: Record<string,string>) => api.get('/reports/courses/csv/', { params: p, responseType: 'blob' }),

  // Programme
  programme:           (p?: Record<string,string>) => api.get('/reports/programmes/', { params: p }),
  programmeExcel:      (p?: Record<string,string>) => api.get('/reports/programmes/excel/', { params: p, responseType: 'blob' }),

  // Department
  department:          (p?: Record<string,string>) => api.get('/reports/departments/', { params: p }),
  departmentPDF:       (p?: Record<string,string>) => api.get('/reports/departments/pdf/', { params: p, responseType: 'blob' }),
  departmentExcel:     (p?: Record<string,string>) => api.get('/reports/departments/excel/', { params: p, responseType: 'blob' }),

  // Semester
  semester:            (p?: Record<string,string>) => api.get('/reports/semesters/', { params: p }),
  semesterExcel:       (p?: Record<string,string>) => api.get('/reports/semesters/excel/', { params: p, responseType: 'blob' }),

  // Danger
  danger:              (p?: Record<string,string>) => api.get('/reports/danger/', { params: p }),
  dangerExcel:         (p?: Record<string,string>) => api.get('/reports/danger/excel/', { params: p, responseType: 'blob' }),

  // Graduation
  graduation:          (p?: Record<string,string>) => api.get('/reports/graduation/', { params: p }),
  graduationExcel:     (p?: Record<string,string>) => api.get('/reports/graduation/excel/', { params: p, responseType: 'blob' }),

  // University comparison
  universityComparison: () => api.get('/reports/university/'),
  hodDashboard:         () => api.get('/reports/hod-dashboard/'),

  // Batch upload
  batchUpload: (formData: FormData) => api.post('/reports/batch-upload/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // Result editing
  editResult:  (id: number, data: Record<string,unknown>) => api.patch(`/reports/results/${id}/edit/`, data),
  lockResult:  (id: number, is_locked: boolean) => api.patch(`/reports/results/${id}/lock/`, { is_locked }),
  resultLogs:  (id: number) => api.get(`/reports/results/${id}/logs/`),

  // Course registration status
  registrationStatus:      (params?: Record<string,string>) =>
    api.get('/reports/registration-status/', { params }),
  registrationStatusExcel: (params?: Record<string,string>) =>
    api.get('/reports/registration-status/excel/', { params, responseType: 'blob' }),
};

// Registration
// Registration API (single unified export)
export const registrationApi = {
  // Student endpoints
  myList:         ()                                => api.get('/registration/my/'),
  myGet:          (id: number)                      => api.get(`/registration/my/${id}/`),
  myCreate:       (data: Record<string,unknown>)    => api.post('/registration/my/', data),
  available:      (regId: number)                   => api.get(`/registration/my/${regId}/available/`),
  addElective:    (regId: number, courseId: number) =>
    api.post(`/registration/my/${regId}/add-elective/`, { course_id: courseId }),
  removeElective: (regId: number, courseId: number) =>
    api.delete(`/registration/my/${regId}/remove/${courseId}/`),
  submit:         (regId: number)                   => api.post(`/registration/my/${regId}/submit/`),
  // Staff endpoints
  staffList:      (params?: Record<string,string>)  => api.get('/registration/all/', { params }),
  staffGet:       (id: number)                      => api.get(`/registration/all/${id}/`),
  staffAction:    (id: number, action: string, notes?: string) =>
    api.patch(`/registration/all/${id}/action/`, { action, notes }),
  summary:        ()                                => api.get('/registration/summary/'),
  offerings:      (params?: Record<string,string>)  => api.get('/registration/offerings/', { params }),
};

// Lecturers and offerings
export const lecturersApi = {
  list:      (params?: Record<string,string>) => api.get('/results/lecturers/', { params }),
  offerings: (params?: Record<string,string>) => api.get('/results/offerings/', { params }),
};

// Global search
export const searchApi = {
  global: (params: Record<string,string>) => api.get('/students/global-search/', { params }),
};


// Elective Pools (HOD management)
export const electivePoolApi = {
  list:         (params?: Record<string,string>) => api.get('/results/elective-pools/', { params }),
  get:          (id: number)                      => api.get(`/results/elective-pools/${id}/`),
  create:       (data: Record<string,unknown>)    => api.post('/results/elective-pools/', data),
  update:       (id: number, data: Record<string,unknown>) => api.patch(`/results/elective-pools/${id}/`, data),
  addCourse:    (poolId: number, courseId: number) =>
    api.post(`/results/elective-pools/${poolId}/courses/`, { course_id: courseId }),
  removeCourse: (poolId: number, courseId: number) =>
    api.delete(`/results/elective-pools/${poolId}/courses/${courseId}/`),
};

// Elective pools (HOD management)

