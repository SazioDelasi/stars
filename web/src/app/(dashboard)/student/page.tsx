"use client";

import { withRole } from "@/components/auth/with-role";
import { useAuthStore } from "@/store/auth.store";
import { useProfileStore } from "@/store/profile.store";
import {
  Clock,
  BookCheck,
  AlertCircle,
  ChevronRight,
  BookOpen,
  GraduationCap,
  School,
  CalendarCheck
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { profile } = useProfileStore();

  const userInformation = {
    first_name: user?.first_name,
    last_name: user?.last_name,
    full_name: `${user?.first_name} ${user?.last_name}`,
    student_id: profile?.index_number,
    programme: "BSc. Computer Science",
    school: "School of Sciences",
    year_of_entry: profile?.enrollment_year,
    session: profile?.session,
    fee_payment: profile?.fee_payment,
    registration_status: "Fully Registered",
    current_cwa: 74,
    semester_credits: 18,
    level: profile?.level,
    semester: 1
  }
  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* 1. URGENT NOTIFICATIONS */}
      <section className="bg-uenr-brown text-white rounded-4xl p-6 shadow-lg shadow-maroon-900/20 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-2xl">
            <AlertCircle size={24} className="text-uenr-gold" />
          </div>
          <div>
            <h3 className="font-bold font-lato text-sm uppercase tracking-widest">Registration Alert</h3>
            <p className="text-sm font-roboto font-normal opacity-90">
              Semester 2 Elective selection is now live. Please confirm your <span className="text-uenr-gold font-bold">Study Plan</span> before Friday.
            </p>
          </div>
        </div>
        <button className="bg-white text-uenr-brown px-6 py-2.5 rounded-xl font-bold text-xs uppercase hover:bg-uenr-gold transition-colors shrink-0 font-roboto">
          View Electives
        </button>
      </section>

      {/* DETAILED ACADEMIC PROFILE HEADER */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between gap-8">

          {/* Primary Identity */}
          <div className="space-y-4 min-w-75">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 font-lato">{userInformation.full_name}</h1>
              <p className="text-uenr-brown font-bold font-roboto text-sm tracking-tight">{userInformation.student_id}</p>
            </div>
            <div className="flex items-center gap-2 bg-uenr-green/10 text-uenr-green px-3 py-1.5 rounded-lg w-fit">
              <div className="w-2 h-2 rounded-full bg-uenr-green animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider font-roboto">{userInformation.registration_status}</span>
            </div>
          </div>

          {/* Academic Metadata Grid */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6 py-2">
            <AcademicInfo
              icon={<GraduationCap size={16} />}
              label="Programme"
              value={userInformation.programme}
            />
            <AcademicInfo
              icon={<School size={16} />}
              label="School"
              value={userInformation.school}
            />
            <AcademicInfo
              icon={<CalendarCheck size={16} />}
              label="Year of Entry"
              value={userInformation.year_of_entry ?? "N/A"}
            />
            <AcademicInfo
              icon={<BookCheck size={16} />}
              label="Enrollment"
              value={`${userInformation.session} / ${userInformation.fee_payment ?? "N/A"}`}
            />
          </div>
        </div>
      </div>

      {/* 3. PERFORMANCE & PROGRESS QUICK-LOOK */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-4xl p-6 flex items-center gap-4">
          <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-uenr-brown font-black font-lato text-xl">{userInformation.current_cwa}</div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase font-roboto">Current CWA</p>
            <p className="text-sm font-bold text-slate-800 font-lato">First Class Division</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-4xl p-6 flex items-center gap-4">
          <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-uenr-blue font-black font-lato text-xl">{userInformation.semester_credits}</div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase font-roboto">Semester Credits</p>
            <p className="text-sm font-bold text-slate-800 font-lato">6 Registered Courses</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-4xl p-6 flex items-center gap-4">
          <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-uenr-green font-black font-lato text-xl">03</div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase font-roboto">Academic Year</p>
            <p className="text-sm font-bold text-slate-800 font-lato">Level {userInformation.level} - Sem {userInformation.semester}</p>
          </div>
        </div>
      </div>

      {/* 4. SCHEDULE & COURSE INFO (Previous Layout Elements) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-lg font-bold text-slate-800 font-lato flex items-center gap-2">
              <Clock size={20} className="text-uenr-brown" /> Upcoming Schedule
            </h2>
            <Link href="/schedules" className="text-xs font-bold text-uenr-brown hover:underline">VIEW FULL TIMETABLE</Link>
          </div>
          <div className="grid gap-3">
            <ScheduleCard time="10:30 AM" code="CSC 305" title="Software Engineering" venue="LT 12" type="Lecture" active />
            <ScheduleCard time="02:00 PM" code="ELC 301" title="Power Systems" venue="Virtual" type="Discussion" />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800 font-lato flex items-center gap-2 px-2">
            <BookOpen size={20} className="text-uenr-brown" /> Course Details
          </h2>
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-5 space-y-3">
            <CourseDetailItem title="Data Structures" code="CSC 301" lecturer="Dr. S. Appiah" />
            <CourseDetailItem title="Operating Systems" code="CSC 303" lecturer="Prof. J. Mensah" />
            <button className="w-full py-4 mt-2 text-[10px] font-bold text-slate-400 hover:text-uenr-brown transition-colors uppercase tracking-widest border-t border-slate-50 font-roboto">
              View All Course Specs
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

/* --- Reusable Information Components --- */

function AcademicInfo({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-slate-400 font-roboto">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm font-bold text-slate-700 font-lato leading-tight">{value}</p>
    </div>
  );
}

function CourseDetailItem({ title, code, lecturer }: any) {
  return (
    <div className="p-3 hover:bg-slate-50 rounded-2xl transition-all group">
      <p className="text-[10px] font-black text-uenr-brown font-roboto mb-0.5">{code}</p>
      <h4 className="text-sm font-bold text-slate-800 font-lato group-hover:text-slate-900">{title}</h4>
      <p className="text-[11px] text-slate-500 font-roboto italic mt-1">{lecturer}</p>
    </div>
  );
}

function ScheduleCard({ time, code, title, venue, type, active = false }: any) {
  return (
    <div className={`
      relative p-5 rounded-3xl border transition-all flex items-center justify-between group
      ${active ? 'bg-white border-uenr-brown shadow-md' : 'bg-white border-slate-100 hover:border-slate-300'}
    `}>
      <div className="flex items-center gap-4">
        <div className={`h-12 w-12 rounded-xl flex flex-col items-center justify-center font-lato ${active ? 'bg-uenr-brown text-white' : 'bg-slate-50 text-slate-400'}`}>
          <span className="text-[10px] font-bold uppercase">Start</span>
          <span className="text-sm font-black">{time.split(' ')[0]}</span>
        </div>
        <div>
          <p className="text-[10px] font-bold text-uenr-brown uppercase font-roboto tracking-tighter">{code} • {type}</p>
          <h4 className="text-sm font-bold text-slate-800 font-lato">{title}</h4>
          <p className="text-[11px] text-slate-500 font-roboto">Venue: <span className="font-bold text-slate-700">{venue}</span></p>
        </div>
      </div>
      <ChevronRight size={18} className={`${active ? 'text-uenr-brown' : 'text-slate-300'}`} />
    </div>
  );
}