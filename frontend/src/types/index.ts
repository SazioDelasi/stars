export interface User {
  id: number;
  username: string;
  full_name: string;
  email: string;
  role: 'student' | 'hod' | 'exams_coordinator' | 'dept_coordinator' | 'university_coordinator';
  department_id: number | null;
}

export interface AuthTokens {
  access: string;
  refresh: string;
  user: User;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  faculty: string;
  student_count: number;
}

export interface Programme {
  id: number;
  name: string;
  code: string;
  department: number;
  department_name: string;
  duration_years: number;
}

export interface Student {
  id: number;
  index_number: string;
  reference_number: string;
  full_name: string;
  email?: string;
  department: number;
  department_name: string;
  programme: number;
  programme_name: string;
  year_of_admission: number;
  current_year: number;
  current_semester: number;
  status: 'active' | 'repeating' | 'deferred' | 'graduated' | 'withdrawn';
  cumulative_gpa: number;
  academic_standing: string;
  trail_count: number;
  in_academic_danger: boolean;
  phone?: string;
}

export interface AcademicYear {
  id: number;
  label: string;
  is_current: boolean;
}

export interface Course {
  id: number;
  code: string;
  title: string;
  credit_hours: number;
  department: number;
  year: number;
  semester: number;
  is_active: boolean;
  is_core: boolean;
  programme: number | null;
  lecturer_name?: string;
  lecturer_email?: string;
}

export interface CourseResult {
  id: number;
  student: number;
  student_name?: string;
  student_index?: string;
  course: number;
  course_code?: string;
  course_title?: string;
  credit_hours?: number;
  academic_year: number;
  academic_year_label?: string;
  semester: number;
  year_of_study: number;
  continuous_assessment: number | null;
  exam_score: number | null;
  total_score: number | null;
  grade: string;
  grade_point: number;
  is_published: boolean;
  is_locked: boolean;
  is_trail: boolean;
}

export interface SemesterData {
  year_of_study: number;
  semester: number;
  academic_year: string;
  courses: {
    code: string;
    title: string;
    credit_hours: number;
    ca: number | null;
    exam: number | null;
    total: number | null;
    grade: string;
    grade_point: number;
    is_trail: boolean;
  }[];
  semester_gpa: number;
  total_credits: number;
}

export interface Transcript {
  student_info: {
    id: number;
    index_number: string;
    reference_number: string;
    full_name: string;
    email: string;
    department: string;
    programme: string;
    year_of_admission: number;
    current_year: number;
    status: string;
    phone: string;
  };
  semesters: SemesterData[];
  cumulative_gpa: number;
  academic_standing: string;
  trail_count: number;
  in_academic_danger: boolean;
  total_credits_earned: number;
}

export interface Grievance {
  id: number;
  student: number;
  student_name?: string;
  student_index?: string;
  department_name?: string;
  grievance_type: 'result' | 'registration' | 'grade' | 'other';
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_review' | 'resolved' | 'rejected';
  subject: string;
  description: string;
  related_course?: number;
  related_course_code?: string;
  related_course_title?: string;
  related_academic_year?: number;
  assigned_to?: number;
  assigned_to_name?: string;
  comment_count?: number;
  comments?: GrievanceComment[];
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  response_deadline?: string;
  days_until_deadline?: number;
  is_overdue?: boolean;
  priority_logs?: { old_priority: string; new_priority: string; reason: string; changed_by_name: string; changed_at: string; }[];
}

export interface GrievanceComment {
  id: number;
  grievance: number;
  author: number;
  author_name: string;
  author_role: string;
  message: string;
  is_internal: boolean;
  created_at: string;
}

export interface DepartmentReport {
  department_id: number;
  filters: Record<string, string | null>;
  students: {
    index_number: string;
    full_name: string;
    status: string;
    current_year: number;
    cumulative_gpa: number;
    academic_standing: string;
    trail_count: number;
    in_academic_danger: boolean;
    results_count: number;
  }[];
  summary: {
    total: number;
    in_danger: number;
    first_class: number;
    second_upper: number;
    second_lower: number;
    third_class: number;
    fail: number;
    avg_gpa: number;
  };
}

export interface CourseOfferingReport {
  course: { id: number; code: string; title: string; credit_hours: number; department: string };
  rows: {
    student_id: number; index_number: string; full_name: string;
    department: string; programme: string; year_of_study: number; semester: number;
    academic_year: string; ca: number | null; exam: number | null; total: number | null;
    grade: string; grade_point: number; pass: boolean; is_trail: boolean;
  }[];
  analytics: {
    total_students: number; pass_count: number; fail_count: number;
    pass_rate: number; fail_rate: number; avg_score: number;
    highest_score: number; lowest_score: number;
    grade_distribution: Record<string, number>;
  };
}

export interface ProgrammeReport {
  programme: { id: number; name: string; code: string };
  rows: StudentReportRow[];
  summary: {
    total: number; avg_gpa: number; in_danger: number;
    standing_dist: Record<string, number>;
    top_student: StudentReportRow | null;
    lowest_student: StudentReportRow | null;
  };
}

export interface DepartmentReportData {
  department: { id: number; name: string; code: string };
  rows: StudentReportRow[];
  summary: {
    total: number; avg_gpa: number; in_danger: number;
    first_class: number; second_upper: number; second_lower: number;
    third_class: number; fail: number; standing_dist: Record<string, number>;
  };
}

export interface StudentReportRow {
  student_id: number; index_number: string; full_name: string; email: string;
  department: string; programme: string; current_year: number; status: string;
  cumulative_gpa: number; academic_standing: string; trail_count: number; in_danger: boolean;
}

export interface SemesterReportData {
  rows: {
    student_id: number; index_number: string; full_name: string;
    department: string; programme: string; year_of_study: number;
    semester_gpa: number; total_credits: number; cumulative_gpa: number; in_danger: boolean;
  }[];
  summary: { total: number; avg_gpa: number; best_gpa: number; worst_gpa: number; pass_rate: number };
}

export interface DangerReportData {
  rows: (StudentReportRow & {
    failed_courses: { code: string; title: string }[];
    gpa_below_threshold: boolean; trails_exceeded: boolean;
  })[];
  summary: { total_in_danger: number; gpa_below_threshold: number; trails_exceeded: number };
  thresholds: { gpa: number; trails: number };
}

export interface GraduationReportData {
  rows: (StudentReportRow & {
    credits_earned: number; credits_required: number;
    trail_courses: { code: string; title: string }[];
    eligibility: 'Eligible' | 'Conditional' | 'Ineligible';
  })[];
  summary: { total: number; eligible: number; conditional: number; ineligible: number };
}

export interface ResultEditLog {
  id: number; edited_by: string; old_ca: number; new_ca: number;
  old_exam: number; new_exam: number; old_grade: string; new_grade: string;
  reason: string; is_override: boolean; timestamp: string;
}

export interface RegisteredCourse {
  id: number; registration: number;
  course: number; course_code: string; course_title: string;
  credit_hours: number; year_of_study: number; semester: number;
  is_core: boolean; course_is_core: boolean;
  lecturer_name: string; lecturer_email: string;
  added_at: string;
}

export interface CourseRegistration {
  id: number;
  student: number; student_name?: string; student_index?: string;
  academic_year: number; academic_year_label?: string;
  semester: number; year_of_study: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  total_credits: number; course_count?: number;
  registered_courses?: RegisteredCourse[];
  submitted_at?: string; approved_by?: number; approved_by_name?: string;
  approved_at?: string; notes?: string;
  created_at: string; updated_at: string;
}

export interface Lecturer {
  id: number; full_name: string; title: string;
  first_name: string; last_name: string; email: string;
  department: number; is_active: boolean;
}

export interface CourseOffering {
  id: number; course: number; course_code: string; course_title: string;
  credit_hours: number; is_core: boolean;
  academic_year: number; academic_year_label: string; semester: number;
  lecturer: number | null; lecturer_name: string; lecturer_email: string;
  max_students: number; enrolled_count: number; notes: string;
}

export interface AvailableCourses {
  core_courses: AvailableCourse[];
  elective_courses: AvailableCourse[];
  current_total_credits: number;
  current_elective_credits: number;
  max_elective_credits: number;
  max_total_credits: number;
}

export interface AvailableCourse {
  id: number; code: string; title: string; credit_hours: number;
  is_core: boolean; already_registered: boolean;
  lecturer_name: string; lecturer_email: string;
  enrolled_count: number; max_students: number;
}

export interface SearchResult {
  id: number; index_number: string; reference_number: string;
  full_name: string; email: string;
  department: string; department_id: number;
  programme: string; programme_id: number;
  current_year: number; status: string;
  cumulative_gpa: number; academic_standing: string;
  trail_count: number; in_danger: boolean;
}

export interface ElectivePoolCourse {
  id: number; course: number; course_code: string; course_title: string;
  credit_hours: number; added_by_name: string; added_at: string;
}

export interface ElectivePool {
  id: number; name: string;
  department: number; department_name: string;
  programme: number | null; programme_name: string;
  year_of_study: number; semester: number;
  academic_year: number; academic_year_label: string;
  max_electives: number; max_elective_credits: number;
  is_active: boolean; course_count: number;
  pool_courses: ElectivePoolCourse[];
  created_by_name: string; created_at: string; updated_at: string;
}
