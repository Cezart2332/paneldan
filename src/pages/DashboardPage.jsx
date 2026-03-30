import { useEffect, useState } from 'react';
import { FiAlertCircle, FiCalendar, FiCreditCard, FiFileText, FiHelpCircle, FiUsers } from 'react-icons/fi';
import { adminApi } from '../api';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.stats().then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading">Se încarcă...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Sumar general al aplicației</p>
      </div>
      <div className="stats-grid">
        <StatCard icon={FiUsers} label="Utilizatori" value={stats?.totalUsers ?? '–'} color="blue" />
        <StatCard icon={FiFileText} label="Jurnale" value={stats?.totalEntries ?? '–'} color="green" />
        <StatCard icon={FiHelpCircle} label="Întrebări" value={stats?.totalQuestions ?? '–'} color="purple" sub={`${stats?.newQuestions ?? 0} noi`} />
        <StatCard icon={FiAlertCircle} label="Bug Reports" value={stats?.totalBugReports ?? '–'} color="red" sub={`${stats?.openBugReports ?? 0} deschise`} />
        <StatCard icon={FiCalendar} label="Ședințe" value={stats?.totalMeetings ?? '–'} color="orange" sub={`${stats?.upcomingMeetings ?? 0} viitoare`} />
        <StatCard icon={FiCreditCard} label="Abonamente active" value={stats?.totalSubscriptions ?? '–'} color="teal" />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, sub }) {
  const Icon = icon;
  return (
    <div className={`stat-card stat-card--${color}`}>
      <div className="stat-card__icon"><Icon /></div>
      <div className="stat-card__body">
        <div className="stat-card__value">{value}</div>
        <div className="stat-card__label">{label}</div>
        {sub && <div className="stat-card__sub">{sub}</div>}
      </div>
    </div>
  );
}
