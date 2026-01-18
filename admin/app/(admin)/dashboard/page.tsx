'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../../lib/api';

type DashboardStats = {
  totalUsers: number;
  newUsersLast7Days: number;
  totalQuestions: number;
  totalQuizSessions: number;
  totalMockExams: number;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<DashboardStats>('/admin/dashboard')
      .then(setStats)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <div className="card">Hata: {error}</div>;
  }

  if (!stats) {
    return <div className="card">Yükleniyor...</div>;
  }

  return (
    <div className="grid grid-3">
      <div className="card">
        <div className="muted">Toplam Kullanıcı</div>
        <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.totalUsers}</div>
      </div>
      <div className="card">
        <div className="muted">Son 7 Gün Kayıt</div>
        <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.newUsersLast7Days}</div>
      </div>
      <div className="card">
        <div className="muted">Toplam Soru</div>
        <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.totalQuestions}</div>
      </div>
      <div className="card">
        <div className="muted">Quiz Oturumu</div>
        <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.totalQuizSessions}</div>
      </div>
      <div className="card">
        <div className="muted">Mock Exam</div>
        <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.totalMockExams}</div>
      </div>
    </div>
  );
}
