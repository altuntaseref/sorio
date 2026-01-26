'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../../lib/api';
import Link from 'next/link';

type Plan = {
  id: string;
  name: string;
  code: string;
};

type UserRow = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  lastLoginAt?: string | null;
  isActive: boolean;
  activePlan?: {
    id: string;
    name: string;
    code: string;
    status: string;
  } | null;
};

type UsersResponse = {
  data: UserRow[];
  total: number;
  page: number;
  limit: number;
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const fetchUsers = () => {
    apiFetch<UsersResponse>(`/admin/users?search=${encodeURIComponent(search)}`)
      .then((data) => setUsers(data.data))
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    Promise.all([apiFetch<Plan[]>('/admin/plans')])
      .then(([plansData]) => setPlans(plansData))
      .catch((err) => setError(err.message));
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateUserPlan = async (userId: string, planId: string) => {
    await apiFetch(`/admin/users/${userId}/plan`, {
      method: 'PATCH',
      body: JSON.stringify({ planId }),
    });
    fetchUsers();
  };

  const deleteUser = async (userId: string, email: string) => {
    if (!confirm(`"${email}" adresli kullanıcıyı silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`)) {
      return;
    }
    
    try {
      await apiFetch(`/admin/users/${userId}`, {
        method: 'DELETE',
      });
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Kullanıcı silinirken bir hata oluştu');
    }
  };

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <div className="page-title">Kullanıcılar</div>
        <div className="row">
          <input
            className="input"
            placeholder="Email ara"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="button" onClick={fetchUsers}>
            Ara
          </button>
        </div>
      </div>
      {error ? <div className="muted">Hata: {error}</div> : null}
      <table className="table">
        <thead>
          <tr>
            <th>Email</th>
            <th>İsim</th>
            <th>Plan</th>
            <th>Durum</th>
            <th>Son Giriş</th>
            <th>Kayıt</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.email}</td>
              <td>
                {user.firstName} {user.lastName}
              </td>
              <td>
                <select
                  className="select"
                  value={user.activePlan?.id ?? ''}
                  onChange={(e) => updateUserPlan(user.id, e.target.value)}
                >
                  <option value="" disabled>
                    Plan seç
                  </option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </td>
              <td>{user.isActive ? 'Aktif' : 'Pasif'}</td>
              <td>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '-'}</td>
              <td>{new Date(user.createdAt).toLocaleDateString()}</td>
              <td>
                <div className="row" style={{ gap: 8 }}>
                  <Link className="button secondary" href={`/users/${user.id}`}>
                    Detay
                  </Link>
                  <button
                    className="button danger"
                    onClick={() => deleteUser(user.id, user.email)}
                    style={{ backgroundColor: '#dc3545', color: 'white', border: 'none' }}
                  >
                    Sil
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
