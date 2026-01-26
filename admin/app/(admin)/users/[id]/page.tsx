'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../../../lib/api';
import { useParams } from 'next/navigation';

type Plan = {
  id: string;
  name: string;
  code: string;
};

type UserDetail = {
  profile: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    provider: string;
    isActive: boolean;
    createdAt: string;
    lastLoginAt?: string | null;
  };
  activitySummary: {
    questionsCount: number;
    quizSessionsCount: number;
    mockExamsCount: number;
  };
  pricing: {
    activePlan: {
      id: string;
      name: string;
      code: string;
      priceAmount?: string;
      priceCurrency?: string;
      billingPeriod?: string;
      status?: string;
    } | null;
    features: Array<{
      key: string;
      type: 'BOOLEAN' | 'INTEGER';
      description: string;
      limitValue: number;
      resetPeriod: 'DAILY' | 'MONTHLY' | 'NEVER';
    }>;
    usage: Array<{
      key: string;
      usageCount: number;
      periodStart: string;
      periodEnd: string;
    }>;
  };
};

type Analysis = {
  id: string;
  weekStart: string;
  weekEnd: string;
  createdAt: string;
};

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const userId = params.id;
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [error, setError] = useState('');
  const [analyses, setAnalyses] = useState<Analysis[]>([]);

  const fetchAnalyses = () => {
    apiFetch<Analysis[]>(`/admin/users/${userId}/analyses`)
      .then((data) => setAnalyses(data))
      .catch((err) => console.error('Failed to fetch analyses:', err));
  };

  useEffect(() => {
    Promise.all([
      apiFetch<UserDetail>(`/admin/users/${userId}`),
      apiFetch<Plan[]>('/admin/plans'),
    ])
      .then(([detailData, plansData]) => {
        setDetail(detailData);
        setPlans(plansData);
        setSelectedPlan(detailData.pricing.activePlan?.id ?? '');
      })
      .catch((err) => setError(err.message));
    
    fetchAnalyses();
  }, [userId]);

  const deleteAnalysis = async (analysisId: string) => {
    if (!confirm('Bu analizi silmek istediğinize emin misiniz?')) {
      return;
    }
    
    try {
      await apiFetch(`/admin/users/${userId}/analyses/${analysisId}`, {
        method: 'DELETE',
      });
      fetchAnalyses();
    } catch (err: any) {
      setError(err.message || 'Analiz silinirken bir hata oluştu');
    }
  };

  const updatePlan = async () => {
    await apiFetch(`/admin/users/${userId}/plan`, {
      method: 'PATCH',
      body: JSON.stringify({ planId: selectedPlan }),
    });
    const detailData = await apiFetch<UserDetail>(`/admin/users/${userId}`);
    setDetail(detailData);
  };

  if (error) {
    return <div className="card">Hata: {error}</div>;
  }

  if (!detail) {
    return <div className="card">Yükleniyor...</div>;
  }

  return (
    <div className="grid" style={{ gap: 24 }}>
      <div className="card">
        <div className="page-title" style={{ marginBottom: 12 }}>
          Kullanıcı Profili
        </div>
        <div className="grid grid-2">
          <div>
            <div className="muted">Email</div>
            <div>{detail.profile.email}</div>
          </div>
          <div>
            <div className="muted">Ad Soyad</div>
            <div>
              {detail.profile.firstName} {detail.profile.lastName}
            </div>
          </div>
          <div>
            <div className="muted">Provider</div>
            <div>{detail.profile.provider}</div>
          </div>
          <div>
            <div className="muted">Kayıt Tarihi</div>
            <div>{new Date(detail.profile.createdAt).toLocaleString()}</div>
          </div>
          <div>
            <div className="muted">Son Giriş</div>
            <div>
              {detail.profile.lastLoginAt
                ? new Date(detail.profile.lastLoginAt).toLocaleString()
                : '-'}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="page-title" style={{ marginBottom: 12 }}>
          Plan Atama
        </div>
        <div className="row">
          <select
            className="select"
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
          >
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} ({plan.code})
              </option>
            ))}
          </select>
          <button className="button" onClick={updatePlan}>
            Güncelle
          </button>
        </div>
      </div>

      <div className="card">
        <div className="page-title" style={{ marginBottom: 12 }}>
          Aktivite Özeti
        </div>
        <div className="grid grid-3">
          <div>
            <div className="muted">Soru</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>
              {detail.activitySummary.questionsCount}
            </div>
          </div>
          <div>
            <div className="muted">Quiz Oturumu</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>
              {detail.activitySummary.quizSessionsCount}
            </div>
          </div>
          <div>
            <div className="muted">Mock Exam</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>
              {detail.activitySummary.mockExamsCount}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="page-title" style={{ marginBottom: 12 }}>
          Kullanım & Limitler
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Feature</th>
              <th>Limit</th>
              <th>Kullanım</th>
              <th>Reset</th>
            </tr>
          </thead>
          <tbody>
            {detail.pricing.features.map((feature) => {
              const usage = detail.pricing.usage.find((u) => u.key === feature.key);
              return (
                <tr key={feature.key}>
                  <td>{feature.key}</td>
                  <td>{feature.limitValue}</td>
                  <td>{usage?.usageCount ?? 0}</td>
                  <td>{feature.resetPeriod}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="page-title" style={{ marginBottom: 12 }}>
          Haftalık Analizler (Test İçin)
        </div>
        <div className="muted" style={{ marginBottom: 16 }}>
          Test için mevcut analizleri silebilir veya yeni analiz oluşturabilirsiniz.
        </div>
        <div style={{ marginBottom: 16 }}>
          <button
            className="button"
            onClick={async () => {
              try {
                await apiFetch(`/admin/users/${userId}/trigger-analysis`, {
                  method: 'POST',
                });
                alert('Analiz oluşturma işlemi başlatıldı. Lütfen birkaç saniye bekleyip sayfayı yenileyin.');
                setTimeout(() => {
                  fetchAnalyses();
                }, 3000);
              } catch (err: any) {
                setError(err.message || 'Analiz oluşturulurken bir hata oluştu');
              }
            }}
            style={{ marginRight: 8 }}
          >
            Analiz Oluştur (Job Tetikle)
          </button>
        </div>
        {analyses.length === 0 ? (
          <div className="muted">Henüz analiz bulunmuyor.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Hafta Başlangıç</th>
                <th>Hafta Bitiş</th>
                <th>Oluşturulma</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {analyses.map((analysis) => (
                <tr key={analysis.id}>
                  <td>{analysis.weekStart}</td>
                  <td>{analysis.weekEnd}</td>
                  <td>{new Date(analysis.createdAt).toLocaleString()}</td>
                  <td>
                    <button
                      className="button danger"
                      onClick={() => deleteAnalysis(analysis.id)}
                      style={{ backgroundColor: '#dc3545', color: 'white', border: 'none' }}
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
