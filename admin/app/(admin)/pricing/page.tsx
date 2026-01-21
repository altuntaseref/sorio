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
  title?: string;
  badge?: string;
  priceMonthly?: number;
  priceYearly?: number;
  buttonText?: string;
  featureTexts?: string[];
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
  isEnabled?: boolean;
  plan: Plan;
  feature: Feature;
};

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [planLimits, setPlanLimits] = useState<PlanLimit[]>([]);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const [newPlan, setNewPlan] = useState({
    name: '',
    code: '',
    priceAmount: '',
    priceCurrency: 'TRY',
    billingPeriod: 'MONTHLY',
    title: '',
    badge: '',
    priceMonthly: '',
    priceYearly: '',
    buttonText: '',
    featureTexts: '',
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

  const sortedPlans = useMemo(() => {
    // Planları sırala: Free, Pro, Premium (Pro ortada olsun)
    const planOrder = ['free_tier', 'pro_tier', 'premium_tier'];
    return [...plans].sort((a, b) => {
      const aIndex = planOrder.indexOf(a.code);
      const bIndex = planOrder.indexOf(b.code);
      // Eğer plan order'da yoksa en sona koy
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  }, [plans]);

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
    resetPeriod: feature.type === 'BOOLEAN' ? 'NEVER' : 'MONTHLY',
    isEnabled: false,
    plan,
    feature,
  });

  const handleLimitChange = (
    planId: string,
    featureId: string,
    field: 'limitValue' | 'resetPeriod' | 'isEnabled',
    value: number | 'DAILY' | 'MONTHLY' | 'NEVER' | boolean,
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
    } as PlanLimit;
    setEditedLimits((prev) => ({ ...prev, [key]: updated }));
  };

  const saveLimits = async () => {
    const payload = Object.values(editedLimits).map((limit) => {
      if (limit.feature.type === 'BOOLEAN') {
        const enabled = limit.isEnabled ?? limit.limitValue > 0;
        return {
          planId: limit.planId,
          featureId: limit.featureId,
          isEnabled: enabled,
          limitValue: enabled ? 1 : 0,
          resetPeriod: 'NEVER',
        };
      }
      return {
        planId: limit.planId,
        featureId: limit.featureId,
        limitValue: Number(limit.limitValue),
        resetPeriod: limit.resetPeriod,
      };
    });
    if (!payload.length) {
      setStatus('Kaydedilecek değişiklik yok.');
      return;
    }
    setSaving(true);
    setStatus('');
    try {
      const updated = await apiFetch<PlanLimit[]>('/admin/plan-limits', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      setPlanLimits(updated);
      setEditedLimits({});
      setStatus('Kaydedildi.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Kaydetme hatası';
      setError(message);
    } finally {
      setSaving(false);
    }
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
        title: newPlan.title || undefined,
        badge: newPlan.badge || undefined,
        priceMonthly: newPlan.priceMonthly ? Number(newPlan.priceMonthly) : undefined,
        priceYearly: newPlan.priceYearly ? Number(newPlan.priceYearly) : undefined,
        buttonText: newPlan.buttonText || undefined,
        featureTexts: newPlan.featureTexts
          ? newPlan.featureTexts.split('\n').map((line) => line.trim()).filter(Boolean)
          : [],
      }),
    });
    setPlans((prev) => [...prev, created]);
    setNewPlan({
      name: '',
      code: '',
      priceAmount: '',
      priceCurrency: 'TRY',
      billingPeriod: 'MONTHLY',
      title: '',
      badge: '',
      priceMonthly: '',
      priceYearly: '',
      buttonText: '',
      featureTexts: '',
    });
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
    const payload = {
      ...plan,
      featureTexts: plan.featureTexts ?? [],
    };
    const updated = await apiFetch<Plan>(`/admin/plans/${plan.id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
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

  const deleteFeature = async (featureId: string) => {
    await apiFetch(`/admin/features/${featureId}`, {
      method: 'DELETE',
    });
    setFeatures((prev) => prev.filter((feature) => feature.id !== featureId));
    setPlanLimits((prev) => prev.filter((limit) => limit.featureId !== featureId));
  };

  if (error) {
    return <div className="card">Hata: {error}</div>;
  }

  return (
    <div className="grid" style={{ gap: 24 }}>
      <div className="card">
        <div className="page-title" style={{ marginBottom: 12 }}>
          Plan Özeti
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Feature</th>
              {sortedPlans.map((plan) => (
                <th key={plan.id}>{plan.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map((feature) => (
              <tr key={feature.id}>
                <td>{feature.key}</td>
                {sortedPlans.map((plan) => {
                  const key = `${plan.id}-${feature.id}`;
                  const limit = limitMap.get(key);
                  const value =
                    feature.type === 'BOOLEAN'
                      ? limit?.isEnabled
                        ? 'true'
                        : 'false'
                      : limit?.limitValue ?? 0;
                  const reset = feature.type === 'BOOLEAN' ? '' : limit?.resetPeriod ?? '';
                  const resetDisplay = reset === 'NEVER' ? 'TOPLAM' : reset;
                  return (
                    <td key={plan.id}>
                      <div style={{ fontWeight: 600 }}>{value}</div>
                      {reset ? <div className="muted">{resetDisplay}</div> : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
          <input
            className="input"
            placeholder="Başlık"
            value={newPlan.title}
            onChange={(e) => setNewPlan({ ...newPlan, title: e.target.value })}
          />
          <input
            className="input"
            placeholder="Badge"
            value={newPlan.badge}
            onChange={(e) => setNewPlan({ ...newPlan, badge: e.target.value })}
          />
          <input
            className="input"
            placeholder="Aylık fiyat"
            value={newPlan.priceMonthly}
            onChange={(e) => setNewPlan({ ...newPlan, priceMonthly: e.target.value })}
          />
          <input
            className="input"
            placeholder="Yıllık fiyat"
            value={newPlan.priceYearly}
            onChange={(e) => setNewPlan({ ...newPlan, priceYearly: e.target.value })}
          />
          <input
            className="input"
            placeholder="Buton yazısı"
            value={newPlan.buttonText}
            onChange={(e) => setNewPlan({ ...newPlan, buttonText: e.target.value })}
          />
          <textarea
            className="input"
            rows={3}
            placeholder="Özellikler (satır satır)"
            value={newPlan.featureTexts}
            onChange={(e) => setNewPlan({ ...newPlan, featureTexts: e.target.value })}
          />
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
              <th>Başlık</th>
              <th>Badge</th>
              <th>Aylık</th>
              <th>Yıllık</th>
              <th>Buton</th>
              <th>Özellikler</th>
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
                    className="input"
                    value={plan.title ?? ''}
                    onChange={(e) =>
                      setPlans((prev) =>
                        prev.map((p) =>
                          p.id === plan.id ? { ...p, title: e.target.value } : p,
                        ),
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    className="input"
                    value={plan.badge ?? ''}
                    onChange={(e) =>
                      setPlans((prev) =>
                        prev.map((p) =>
                          p.id === plan.id ? { ...p, badge: e.target.value } : p,
                        ),
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    className="input"
                    value={plan.priceMonthly ?? ''}
                    onChange={(e) =>
                      setPlans((prev) =>
                        prev.map((p) =>
                          p.id === plan.id
                            ? { ...p, priceMonthly: Number(e.target.value) }
                            : p,
                        ),
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    className="input"
                    value={plan.priceYearly ?? ''}
                    onChange={(e) =>
                      setPlans((prev) =>
                        prev.map((p) =>
                          p.id === plan.id
                            ? { ...p, priceYearly: Number(e.target.value) }
                            : p,
                        ),
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    className="input"
                    value={plan.buttonText ?? ''}
                    onChange={(e) =>
                      setPlans((prev) =>
                        prev.map((p) =>
                          p.id === plan.id ? { ...p, buttonText: e.target.value } : p,
                        ),
                      )
                    }
                  />
                </td>
                <td>
                  <textarea
                    className="input"
                    rows={3}
                    value={(plan.featureTexts ?? []).join('\n')}
                    onChange={(e) =>
                      setPlans((prev) =>
                        prev.map((p) =>
                          p.id === plan.id
                            ? {
                                ...p,
                                featureTexts: e.target.value
                                  .split('\n')
                                  .map((line) => line.trim())
                                  .filter(Boolean),
                              }
                            : p,
                        ),
                      )
                    }
                  />
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
                <td>
                  <button
                    className="button secondary"
                    onClick={() => deleteFeature(feature.id)}
                  >
                    Sil
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
          <div className="row">
            {status ? <div className="muted">{status}</div> : null}
            <button className="button" onClick={saveLimits} disabled={saving}>
              {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </button>
          </div>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Feature</th>
              {sortedPlans.map((plan) => (
                <th key={plan.id}>{plan.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map((feature) => (
              <tr key={feature.id}>
                <td>{feature.key}</td>
                {sortedPlans.map((plan) => {
                  const key = `${plan.id}-${feature.id}`;
                  const limit = editedLimits[key] ?? limitMap.get(key) ?? createDefaultLimit(plan, feature);
                  if (!limit) {
                    return <td key={plan.id} className="muted">-</td>;
                  }
                  return (
                    <td key={plan.id}>
                      <div className="grid" style={{ gap: 6 }}>
                        {feature.type === 'BOOLEAN' ? (
                          <select
                            className="select"
                            value={(limit.isEnabled ?? limit.limitValue > 0) ? 'true' : 'false'}
                            onChange={(e) =>
                              handleLimitChange(
                                plan.id,
                                feature.id,
                                'isEnabled',
                                e.target.value === 'true',
                              )
                            }
                          >
                            <option value="true">true</option>
                            <option value="false">false</option>
                          </select>
                        ) : (
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
                        )}
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
                          disabled={feature.type === 'BOOLEAN'}
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
