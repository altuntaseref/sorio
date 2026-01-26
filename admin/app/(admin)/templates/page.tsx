'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../../lib/api';

type Template = {
  id: string;
  name: string;
  backgroundImageUrl: string;
  soundUrl?: string | null;
  thumbnailUrl?: string | null;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    backgroundImageUrl: '',
    soundUrl: '',
    thumbnailUrl: '',
    description: '',
    isActive: true,
  });

  const [editTemplate, setEditTemplate] = useState({
    name: '',
    backgroundImageUrl: '',
    soundUrl: '',
    thumbnailUrl: '',
    description: '',
    isActive: true,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = () => {
    apiFetch<Template[]>('/admin/templates')
      .then(setTemplates)
      .catch((err) => setError(err.message));
  };

  const handleCreate = async () => {
    if (!newTemplate.name || !newTemplate.backgroundImageUrl) {
      setError('Name ve Background Image URL zorunludur');
      return;
    }

    setSaving(true);
    setError('');
    setStatus('');

    try {
      await apiFetch('/admin/templates', {
        method: 'POST',
        body: JSON.stringify({
          name: newTemplate.name,
          backgroundImageUrl: newTemplate.backgroundImageUrl,
          soundUrl: newTemplate.soundUrl || undefined,
          thumbnailUrl: newTemplate.thumbnailUrl || undefined,
          description: newTemplate.description || undefined,
          isActive: newTemplate.isActive,
        }),
      });

      setStatus('Template oluşturuldu!');
      setNewTemplate({
        name: '',
        backgroundImageUrl: '',
        soundUrl: '',
        thumbnailUrl: '',
        description: '',
        isActive: true,
      });
      fetchTemplates();
    } catch (err: any) {
      setError(err.message || 'Template oluşturulurken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string) => {
    setSaving(true);
    setError('');
    setStatus('');

    try {
      await apiFetch(`/admin/templates/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editTemplate.name,
          backgroundImageUrl: editTemplate.backgroundImageUrl,
          soundUrl: editTemplate.soundUrl || undefined,
          thumbnailUrl: editTemplate.thumbnailUrl || undefined,
          description: editTemplate.description || undefined,
          isActive: editTemplate.isActive,
        }),
      });

      setStatus('Template güncellendi!');
      setEditingId(null);
      fetchTemplates();
    } catch (err: any) {
      setError(err.message || 'Template güncellenirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu template\'i silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      await apiFetch(`/admin/templates/${id}`, {
        method: 'DELETE',
      });

      setStatus('Template silindi!');
      fetchTemplates();
    } catch (err: any) {
      setError(err.message || 'Template silinirken hata oluştu');
    }
  };

  const startEdit = (template: Template) => {
    setEditingId(template.id);
    setEditTemplate({
      name: template.name,
      backgroundImageUrl: template.backgroundImageUrl,
      soundUrl: template.soundUrl || '',
      thumbnailUrl: template.thumbnailUrl || '',
      description: template.description || '',
      isActive: template.isActive,
    });
  };

  if (error && !status) {
    return <div className="card">Hata: {error}</div>;
  }

  return (
    <div className="grid" style={{ gap: 24 }}>
      {status && (
        <div className="card" style={{ background: '#d4edda', color: '#155724' }}>
          {status}
        </div>
      )}

      <div className="card">
        <div className="page-title" style={{ marginBottom: 12 }}>
          Yeni Template Ekle
        </div>
        <div className="grid" style={{ gap: 12 }}>
          <input
            className="input"
            placeholder="Template Adı *"
            value={newTemplate.name}
            onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
          />
          <input
            className="input"
            placeholder="Background Image URL (R2) *"
            value={newTemplate.backgroundImageUrl}
            onChange={(e) =>
              setNewTemplate({ ...newTemplate, backgroundImageUrl: e.target.value })
            }
          />
          <input
            className="input"
            placeholder="Sound URL (R2) - Opsiyonel"
            value={newTemplate.soundUrl}
            onChange={(e) =>
              setNewTemplate({ ...newTemplate, soundUrl: e.target.value })
            }
          />
          <input
            className="input"
            placeholder="Thumbnail URL (R2) - Opsiyonel"
            value={newTemplate.thumbnailUrl}
            onChange={(e) =>
              setNewTemplate({ ...newTemplate, thumbnailUrl: e.target.value })
            }
          />
          <textarea
            className="input"
            placeholder="Açıklama - Opsiyonel"
            value={newTemplate.description}
            onChange={(e) =>
              setNewTemplate({ ...newTemplate, description: e.target.value })
            }
            rows={3}
            style={{ resize: 'vertical', minHeight: 80 }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={newTemplate.isActive}
              onChange={(e) =>
                setNewTemplate({ ...newTemplate, isActive: e.target.checked })
              }
            />
            Aktif
          </label>
          <button
            className="button"
            onClick={handleCreate}
            disabled={saving}
          >
            {saving ? 'Kaydediliyor...' : 'Template Ekle'}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="page-title" style={{ marginBottom: 12 }}>
          Template'ler ({templates.length})
        </div>
        {templates.length === 0 ? (
          <div className="muted">Henüz template bulunmuyor.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Ad</th>
                <th>Background Image</th>
                <th>Sound</th>
                <th>Thumbnail</th>
                <th>Aktif</th>
                <th>Oluşturulma</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => (
                <tr key={template.id}>
                  {editingId === template.id ? (
                    <>
                      <td>
                        <input
                          className="input"
                          value={editTemplate.name}
                          onChange={(e) =>
                            setEditTemplate({ ...editTemplate, name: e.target.value })
                          }
                          style={{ width: '100%', minWidth: 150 }}
                        />
                      </td>
                      <td>
                        <input
                          className="input"
                          value={editTemplate.backgroundImageUrl}
                          onChange={(e) =>
                            setEditTemplate({
                              ...editTemplate,
                              backgroundImageUrl: e.target.value,
                            })
                          }
                          style={{ width: '100%', minWidth: 200 }}
                        />
                      </td>
                      <td>
                        <input
                          className="input"
                          value={editTemplate.soundUrl}
                          onChange={(e) =>
                            setEditTemplate({ ...editTemplate, soundUrl: e.target.value })
                          }
                          style={{ width: '100%', minWidth: 200 }}
                        />
                      </td>
                      <td>
                        <input
                          className="input"
                          value={editTemplate.thumbnailUrl}
                          onChange={(e) =>
                            setEditTemplate({
                              ...editTemplate,
                              thumbnailUrl: e.target.value,
                            })
                          }
                          style={{ width: '100%', minWidth: 200 }}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={editTemplate.isActive}
                          onChange={(e) =>
                            setEditTemplate({
                              ...editTemplate,
                              isActive: e.target.checked,
                            })
                          }
                        />
                      </td>
                      <td>
                        {new Date(template.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            className="button"
                            onClick={() => handleUpdate(template.id)}
                            disabled={saving}
                            style={{ fontSize: 12, padding: '4px 8px' }}
                          >
                            Kaydet
                          </button>
                          <button
                            className="button secondary"
                            onClick={() => setEditingId(null)}
                            style={{ fontSize: 12, padding: '4px 8px' }}
                          >
                            İptal
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{template.name}</td>
                      <td>
                        <a
                          href={template.backgroundImageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#2563eb', textDecoration: 'underline' }}
                        >
                          Görüntüle
                        </a>
                      </td>
                      <td>
                        {template.soundUrl ? (
                          <a
                            href={template.soundUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#2563eb', textDecoration: 'underline' }}
                          >
                            Dinle
                          </a>
                        ) : (
                          <span className="muted">-</span>
                        )}
                      </td>
                      <td>
                        {template.thumbnailUrl ? (
                          <a
                            href={template.thumbnailUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#2563eb', textDecoration: 'underline' }}
                          >
                            Görüntüle
                          </a>
                        ) : (
                          <span className="muted">-</span>
                        )}
                      </td>
                      <td>{template.isActive ? '✅' : '❌'}</td>
                      <td>{new Date(template.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            className="button secondary"
                            onClick={() => startEdit(template)}
                            style={{ fontSize: 12, padding: '4px 8px' }}
                          >
                            Düzenle
                          </button>
                          <button
                            className="button"
                            onClick={() => handleDelete(template.id)}
                            style={{
                              fontSize: 12,
                              padding: '4px 8px',
                              backgroundColor: '#dc3545',
                              color: 'white',
                              border: 'none',
                            }}
                          >
                            Sil
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
