import React, { useEffect, useState } from 'react';
import { reportsApi } from '../../api/client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { Globe } from 'lucide-react';

interface DeptRow {
  department_id: number; department_name: string; department_code: string;
  total_students: number; avg_gpa: number; in_danger: number;
  first_class: number; fail: number;
}

const UniversityComparisonPage: React.FC = () => {
  const [data, setData]   = useState<DeptRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsApi.universityComparison()
      .then(res => setData(res.data.departments || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const barData = data.map(d => ({
    name: d.department_code,
    'Avg GPA':    d.avg_gpa,
    'First Class': d.first_class,
    'In Danger':  d.in_danger,
    'Students':   d.total_students,
    'Fail':       d.fail,
  }));

  if (loading) return <div className="loading-spinner">Loading…</div>;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)' }}>University Comparison</h1>
        <p style={{ color: 'var(--gray-500)', fontSize: 13 }}>Cross-department performance — university-wide view</p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><h2>Department Overview</h2></div>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Department</th><th>Code</th><th>Students</th>
                <th>Avg GPA</th><th>First Class</th><th>In Danger</th><th>Fail</th>
              </tr>
            </thead>
            <tbody>
              {data.map(d => (
                <tr key={d.department_id}>
                  <td style={{ fontWeight: 700, color: 'var(--navy)' }}>{d.department_name}</td>
                  <td><span className="badge badge-navy font-mono">{d.department_code}</span></td>
                  <td style={{ textAlign: 'center' }}>{d.total_students}</td>
                  <td>
                    <span className="font-mono" style={{ fontWeight: 800, color: d.avg_gpa >= 3 ? 'var(--green)' : d.avg_gpa >= 2 ? 'var(--blue)' : 'var(--red)' }}>
                      {d.avg_gpa.toFixed(2)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center', color: 'var(--gold)', fontWeight: 700 }}>{d.first_class}</td>
                  <td style={{ textAlign: 'center', color: d.in_danger > 0 ? 'var(--red)' : 'inherit', fontWeight: d.in_danger > 0 ? 700 : 400 }}>{d.in_danger}</td>
                  <td style={{ textAlign: 'center', color: d.fail > 0 ? 'var(--red)' : 'inherit' }}>{d.fail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 20, marginBottom: 20 }}>
        <div className="card">
          <div className="card-header"><h2>Average GPA by Department</h2></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 4]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => [Number(v).toFixed(2), 'Avg GPA']} />
                <Bar dataKey="Avg GPA" fill="var(--blue)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2>First Class vs Danger vs Fail</h2></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend iconSize={10} />
                <Bar dataKey="First Class" fill="var(--gold)" radius={[4,4,0,0]} />
                <Bar dataKey="In Danger"   fill="var(--red)"  radius={[4,4,0,0]} />
                <Bar dataKey="Fail"        fill="#94a3b8"     radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h2>Students vs GPA per Department</h2></div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 4]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend iconSize={10} />
              <Bar yAxisId="left"  dataKey="Students"  fill="var(--blue)"  radius={[4,4,0,0]} />
              <Bar yAxisId="right" dataKey="Avg GPA"   fill="var(--green)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {data.length === 0 && (
        <div className="empty-state">
          <Globe size={48} color="var(--gray-300)" />
          <h3>No department data available</h3>
        </div>
      )}
    </div>
  );
};

export default UniversityComparisonPage;
