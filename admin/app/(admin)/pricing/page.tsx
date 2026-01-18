'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../../lib/api';

type Plan = {
  id: string;
  name: string;
  code: string;
  priceAmount?: number;
  priceCurrency?: string;
  billingPeriod?: string;
  isActive: boolean;
};

type Feature = {
  id: string;
  key: string;
  description: string;
  type: 'BOOLEAN' | 'INTEGER';
};

type PlanLimit = {
  id?: string;
  planId: string;
  featureId: string;
  limitValue: number;
  resetPeriod: 'DAILY' | 'MONTHLY' | 'NEVER';
  plan: Plan;
  feature: Feature;
};

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [planLimits, setPlanLimits] = useState<PlanLimit[]>([]);
  const [error, setError] = useState('');

  const [newPlan, setNewPlan] = useState({
    name: '',
    code: '',
    priceAmount: '',
    priceCurrency: 'TRY',
    billingPeriod: 'MONTHLY',
  });
  const [newFeature, setNewFeature] = useState({
    key: '',
    description: '',
    type: 'INTEGER',
  });

  useEffect(() => {
    Promise.all([
      apiFetch<Plan[]>('/admin/plans'),
      apiFetch<Feature[]>('/admin/features'),
      apiFetch<PlanLimit[]>('/admin/plan-limits'),
    ])
      .then(([plansData, featuresData, limitsData]) => {
        setPlans(plansData);
        setFeatures(featuresData);
        setPlanLimits(limitsData);
      })
      .catch((err) => setError(err.message));
  }, []);

  const limitMap = useMemo(() => {
    const map = new Map<string, PlanLimit>();
    planLimits.forEach((limit) => {
      map.set(`${limit.planId}-${limit.featureId}`, limit);
    });
    return map;
  }, [planLimits]);

  const [editedLimits, setEditedLimits] = useState<Record<string, PlanLimit>>({});

  const createDefaultLimit = (plan: Plan, feature: Feature): PlanLimit => ({
    planId: plan.id,
    featureId: feature.id,
    limitValue: feature.type === 'BOOLEAN' ? 0 : 0,
    resetPeriod: 'MONTHLY',
    plan,
    feature,
  });

  const handleLimitChange = (
    planId: string,
    featureId: string,
    field: 'limitValue' | 'resetPeriod',
    value: number | 'DAILY' | 'MONTHLY' | 'NEVER',
  ) => {
    const key = `${planId}-${featureId}`;
    const existing = editedLimits[key] ?? limitMap.get(key);
    const plan = plans.find((item) => item.id === planId);
    const feature = features.find((item) => item.id === featureId);
    if (!plan || !feature) return;
    const current = existing ?? createDefaultLimit(plan, feature);
    const updated = {
      ...current,
      [field]: value,
    };
    setEditedLimits((prev) => ({ ...prev, [key]: updated }));
  };

  const saveLimits = async () => {
    const payload = Object.values(editedLimits).map((limit) => ({
      planId: limit.planId,
      featureId: limit.featureId,
      limitValue: Number(limit.limitValue),
      resetPeriod: limit.resetPeriod,
    }));
    if (!payload.length) return;
    const updated = await apiFetch<PlanLimit[]>('/admin/plan-limits', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    setPlanLimits(updated);
    setEditedLimits({});
  };

  const createPlan = async () => {
    const created = await apiFetch<Plan>('/admin/plans', {
      method: 'POST',
      body: JSON.stringify({
        name: newPlan.name,
        code: newPlan.code,
        priceAmount: newPlan.priceAmount ? Number(newPlan.priceAmount) : undefined,
        priceCurrency: newPlan.priceCurrency,
        billingPeriod: newPlan.billingPeriod,
      }),
    });
    setPlans((prev) => [...prev, created]);
    setNewPlan({ name: '', code: '', priceAmount: '', priceCurrency: 'TRY', billingPeriod: 'MONTHLY' });
  };

  const createFeature = async () => {
    const created = await apiFetch<Feature>('/admin/features', {
      method: 'POST',
      body: JSON.stringify(newFeature),
    });
    setFeatures((prev) => [...prev, created]);
    setNewFeature({ key: '', description: '', type: 'INTEGER' });
  };

  const updatePlan = async (plan: Plan) => {
    const updated = await apiFetch<Plan>(`/admin/plans/${plan.id}`, {
      method: 'PATCH',
      body: JSON.stringify(plan),
    });
    setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const updateFeature = async (feature: Feature) => {
    const updated = await apiFetch<Feature>(`/admin/features/${feature.id}`, {
      method: 'PATCH',
      body: JSON.stringify(feature),
    });
    setFeatures((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
  };

  if (error) {
    return <div className="card">Hata: {error}</div>;
  }

  return (
    <div className="grid" style={{ gap: 24 }}>
      <div className="card">
        <div className="page-title" style={{ marginBottom: 12 }}>
          Planlar
        </div>
        <div className="grid grid-3" style={{ marginBottom: 16 }}>
          <input
            className="input"
            placeholder="Plan adı"
            value={newPlan.name}
            onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
          />
          <input
            className="input"
            placeholder="plan_code"
            value={newPlan.code}
            onChange={(e) => setNewPlan({ ...newPlan, code: e.target.value })}
          />
          <input
            className="input"
            placeholder="Fiyat"
            value={newPlan.priceAmount}
            onChange={(e) => setNewPlan({ ...newPlan, priceAmount: e.target.value })}
          />
          <input
            className="input"
            placeholder="Para birimi"
            value={newPlan.priceCurrency}
            onChange={(e) => setNewPlan({ ...newPlan, priceCurrency: e.target.value })}
          />
          <select
            className="select"
            value={newPlan.billingPeriod}
            onChange={(e) => setNewPlan({ ...newPlan, billingPeriod: e.target.value })}
          >
            <option value="MONTHLY">MONTHLY</option>
            <option value="YEARLY">YEARLY</option>
            <option value="ONE_TIME">ONE_TIME</option>
          </select>
          <button className="button" onClick={createPlan}>
            Plan Ekle
          </button>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Ad</th>
              <th>Kod</th>
              <th>Fiyat</th>
              <th>Para</th>
              <th>Periyot</th>
              <th>Aktif</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan.id}>
                <td>
                  <input
                    className="input"
                    value={plan.name}
                    onChange={(e) =>
                      setPlans((prev) =>
                        prev.map((p) => (p.id === plan.id ? { ...p, name: e.target.value } : p)),
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    className="input"
                    value={plan.code}
                    onChange={(e) =>
                      setPlans((prev) =>
                        prev.map((p) => (p.id === plan.id ? { ...p, code: e.target.value } : p)),
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    className="input"
                    value={plan.priceAmount ?? ''}
                    onChange={(e) =>
                      setPlans((prev) =>
                        prev.map((p) =>
                          p.id === plan.id ? { ...p, priceAmount: Number(e.target.value) } : p,
                        ),
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    className="input"
                    value={plan.priceCurrency ?? ''}
                    onChange={(e) =>
                      setPlans((prev) =>
                        prev.map((p) =>
                          p.id === plan.id ? { ...p, priceCurrency: e.target.value } : p,
                        ),
                      )
                    }
                  />
                </td>
                <td>
                  <select
                    className="select"
                    value={plan.billingPeriod ?? 'MONTHLY'}
                    onChange={(e) =>
                      setPlans((prev) =>
                        prev.map((p) =>
                          p.id === plan.id ? { ...p, billingPeriod: e.target.value } : p,
                        ),
                      )
                    }
                  >
                    <option value="MONTHLY">MONTHLY</option>
                    <option value="YEARLY">YEARLY</option>
                    <option value="ONE_TIME">ONE_TIME</option>
                  </select>
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={plan.isActive}
                    onChange={(e) =>
                      setPlans((prev) =>
                        prev.map((p) =>
                          p.id === plan.id ? { ...p, isActive: e.target.checked } : p,
                        ),
                      )
                    }
                  />
                </td>
                <td>
                  <button className="button" onClick={() => updatePlan(plan)}>
                    Kaydet
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="page-title" style={{ marginBottom: 12 }}>
          Features
        </div>
        <div className="grid grid-3" style={{ marginBottom: 16 }}>
          <input
            className="input"
            placeholder="feature_key"
            value={newFeature.key}
            onChange={(e) => setNewFeature({ ...newFeature, key: e.target.value })}
          />
          <input
            className="input"
            placeholder="Açıklama"
            value={newFeature.description}
            onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })}
          />
          <select
            className="select"
            value={newFeature.type}
            onChange={(e) => setNewFeature({ ...newFeature, type: e.target.value })}
          >
            <option value="INTEGER">INTEGER</option>
            <option value="BOOLEAN">BOOLEAN</option>
          </select>
          <button className="button" onClick={createFeature}>
            Feature Ekle
          </button>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Key</th>
              <th>Açıklama</th>
              <th>Tip</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {features.map((feature) => (
              <tr key={feature.id}>
                <td>
                  <input
                    className="input"
                    value={feature.key}
                    onChange={(e) =>
                      setFeatures((prev) =>
                        prev.map((f) =>
                          f.id === feature.id ? { ...f, key: e.target.value } : f,
                        ),
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    className="input"
                    value={feature.description}
                    onChange={(e) =>
                      setFeatures((prev) =>
                        prev.map((f) =>
                          f.id === feature.id
                            ? { ...f, description: e.target.value }
                            : f,
                        ),
                      )
                    }
                  />
                </td>
                <td>
                  <select
                    className="select"
                    value={feature.type}
                    onChange={(e) =>
                      setFeatures((prev) =>
                        prev.map((f) =>
                          f.id === feature.id ? { ...f, type: e.target.value as Feature['type'] } : f,
                        ),
                      )
                    }
                  >
                    <option value="INTEGER">INTEGER</option>
                    <option value="BOOLEAN">BOOLEAN</option>
                  </select>
                </td>
                <td>
                  <button className="button" onClick={() => updateFeature(feature)}>
                    Kaydet
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
          <div className="page-title">Plan Limitleri</div>
          <button className="button" onClick={saveLimits}>
            Değişiklikleri Kaydet
          </button>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Feature</th>
              {plans.map((plan) => (
                <th key={plan.id}>{plan.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map((feature) => (
              <tr key={feature.id}>
                <td>{feature.key}</td>
                {plans.map((plan) => {
                  const key = `${plan.id}-${feature.id}`;
                  const limit = editedLimits[key] ?? limitMap.get(key) ?? createDefaultLimit(plan, feature);
                  if (!limit) {
                    return <td key={plan.id} className="muted">-</td>;
                  }
                  return (
                    <td key={plan.id}>
                      <div className="grid" style={{ gap: 6 }}>
                        <input
                          className="input"
                          type="number"
                          value={limit.limitValue}
                          onChange={(e) =>
                            handleLimitChange(
                              plan.id,
                              feature.id,
                              'limitValue',
                              Number(e.target.value),
                            )
                          }
                        />
                        <select
                          className="select"
                          value={limit.resetPeriod}
                          onChange={(e) =>
                            handleLimitChange(
                              plan.id,
                              feature.id,
                              'resetPeriod',
                              e.target.value as PlanLimit['resetPeriod'],
                            )
                          }
                        >
                          <option value="DAILY">DAILY</option>
                          <option value="MONTHLY">MONTHLY</option>
                          <option value="NEVER">NEVER</option>
                        </select>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
