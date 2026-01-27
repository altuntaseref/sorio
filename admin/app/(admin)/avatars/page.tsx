'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../../lib/api';

type Avatar = {
  id: string;
  name: string;
  imageUrl: string;
  videoUrl?: string | null;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function AvatarsPage() {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newAvatar, setNewAvatar] = useState({
    name: '',
    imageUrl: '',
    videoUrl: '',
    description: '',
    isActive: true,
  });

  const [editAvatar, setEditAvatar] = useState({
    name: '',
    imageUrl: '',
    videoUrl: '',
    description: '',
    isActive: true,
  });

  useEffect(() => {
    fetchAvatars();
  }, []);

  const fetchAvatars = () => {
    apiFetch<Avatar[]>('/admin/avatars')
      .then(setAvatars)
      .catch((err) => setError(err.message));
  };

  const handleCreate = async () => {
    if (!newAvatar.name || !newAvatar.imageUrl) {
      setError('Name ve Image URL zorunludur');
      return;
    }

    setSaving(true);
    setError('');
    setStatus('');

    try {
      await apiFetch('/admin/avatars', {
        method: 'POST',
        body: JSON.stringify({
          name: newAvatar.name,
          imageUrl: newAvatar.imageUrl,
          videoUrl: newAvatar.videoUrl || undefined,
          description: newAvatar.description || undefined,
          isActive: newAvatar.isActive,
        }),
      });

      setStatus('Avatar oluşturuldu!');
      setNewAvatar({
        name: '',
        imageUrl: '',
        videoUrl: '',
        description: '',
        isActive: true,
      });
      fetchAvatars();
    } catch (err: any) {
      setError(err.message || 'Avatar oluşturulurken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string) => {
    setSaving(true);
    setError('');
    setStatus('');

    try {
      await apiFetch(`/admin/avatars/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editAvatar.name,
          imageUrl: editAvatar.imageUrl,
          videoUrl: editAvatar.videoUrl || undefined,
          description: editAvatar.description || undefined,
          isActive: editAvatar.isActive,
        }),
      });

      setStatus('Avatar güncellendi!');
      setEditingId(null);
      fetchAvatars();
    } catch (err: any) {
      setError(err.message || 'Avatar güncellenirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu avatar\'ı silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      await apiFetch(`/admin/avatars/${id}`, {
        method: 'DELETE',
      });

      setStatus('Avatar silindi!');
      fetchAvatars();
    } catch (err: any) {
      setError(err.message || 'Avatar silinirken hata oluştu');
    }
  };

  const startEdit = (avatar: Avatar) => {
    setEditingId(avatar.id);
    setEditAvatar({
      name: avatar.name,
      imageUrl: avatar.imageUrl,
      videoUrl: avatar.videoUrl || '',
      description: avatar.description || '',
      isActive: avatar.isActive,
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
          Yeni Avatar Ekle
        </div>
        <div className="grid" style={{ gap: 12 }}>
          <input
            className="input"
            placeholder="Avatar Adı *"
            value={newAvatar.name}
            onChange={(e) => setNewAvatar({ ...newAvatar, name: e.target.value })}
          />
          <input
            className="input"
            placeholder="Image URL (R2) *"
            value={newAvatar.imageUrl}
            onChange={(e) =>
              setNewAvatar({ ...newAvatar, imageUrl: e.target.value })
            }
          />
          <input
            className="input"
            placeholder="Video URL (R2) - Opsiyonel"
            value={newAvatar.videoUrl}
            onChange={(e) =>
              setNewAvatar({ ...newAvatar, videoUrl: e.target.value })
            }
          />
          <textarea
            className="input"
            placeholder="Açıklama - Opsiyonel"
            value={newAvatar.description}
            onChange={(e) =>
              setNewAvatar({ ...newAvatar, description: e.target.value })
            }
            rows={3}
            style={{ resize: 'vertical', minHeight: 80 }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={newAvatar.isActive}
              onChange={(e) =>
                setNewAvatar({ ...newAvatar, isActive: e.target.checked })
              }
            />
            Aktif
          </label>
          <button
            className="button"
            onClick={handleCreate}
            disabled={saving}
          >
            {saving ? 'Kaydediliyor...' : 'Avatar Ekle'}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="page-title" style={{ marginBottom: 12 }}>
          Avatar'lar ({avatars.length})
        </div>
        {avatars.length === 0 ? (
          <div className="muted">Henüz avatar bulunmuyor.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Ad</th>
                <th>Image Preview</th>
                <th>Video Preview</th>
                <th>Açıklama</th>
                <th>Aktif</th>
                <th>Oluşturulma</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {avatars.map((avatar) => (
                <tr key={avatar.id}>
                  {editingId === avatar.id ? (
                    <>
                      <td>
                        <input
                          className="input"
                          value={editAvatar.name}
                          onChange={(e) =>
                            setEditAvatar({ ...editAvatar, name: e.target.value })
                          }
                          style={{ width: '100%', minWidth: 150 }}
                        />
                      </td>
                      <td>
                        <input
                          className="input"
                          value={editAvatar.imageUrl}
                          onChange={(e) =>
                            setEditAvatar({
                              ...editAvatar,
                              imageUrl: e.target.value,
                            })
                          }
                          style={{ width: '100%', minWidth: 200 }}
                        />
                        {editAvatar.imageUrl && (
                          <img
                            src={editAvatar.imageUrl}
                            alt="Preview"
                            style={{
                              width: 60,
                              height: 60,
                              objectFit: 'cover',
                              borderRadius: 4,
                              marginTop: 4,
                            }}
                          />
                        )}
                      </td>
                      <td>
                        <input
                          className="input"
                          value={editAvatar.videoUrl}
                          onChange={(e) =>
                            setEditAvatar({ ...editAvatar, videoUrl: e.target.value })
                          }
                          style={{ width: '100%', minWidth: 200 }}
                        />
                        {editAvatar.videoUrl && (
                          <video
                            src={editAvatar.videoUrl}
                            controls
                            style={{
                              width: 120,
                              height: 120,
                              objectFit: 'cover',
                              borderRadius: 4,
                              marginTop: 4,
                            }}
                          />
                        )}
                      </td>
                      <td>
                        <textarea
                          className="input"
                          value={editAvatar.description}
                          onChange={(e) =>
                            setEditAvatar({
                              ...editAvatar,
                              description: e.target.value,
                            })
                          }
                          rows={2}
                          style={{ width: '100%', minWidth: 150 }}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={editAvatar.isActive}
                          onChange={(e) =>
                            setEditAvatar({
                              ...editAvatar,
                              isActive: e.target.checked,
                            })
                          }
                        />
                      </td>
                      <td>
                        {new Date(avatar.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            className="button"
                            onClick={() => handleUpdate(avatar.id)}
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
                      <td>{avatar.name}</td>
                      <td>
                        {avatar.imageUrl ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <img
                              src={avatar.imageUrl}
                              alt={avatar.name}
                              style={{
                                width: 60,
                                height: 60,
                                objectFit: 'cover',
                                borderRadius: 4,
                              }}
                            />
                            <a
                              href={avatar.imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#2563eb', textDecoration: 'underline', fontSize: 12 }}
                            >
                              Görüntüle
                            </a>
                          </div>
                        ) : (
                          <span className="muted">-</span>
                        )}
                      </td>
                      <td>
                        {avatar.videoUrl ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <video
                              src={avatar.videoUrl}
                              controls
                              style={{
                                width: 120,
                                height: 120,
                                objectFit: 'cover',
                                borderRadius: 4,
                              }}
                            />
                            <a
                              href={avatar.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#2563eb', textDecoration: 'underline', fontSize: 12 }}
                            >
                              İzle
                            </a>
                          </div>
                        ) : (
                          <span className="muted">-</span>
                        )}
                      </td>
                      <td>
                        {avatar.description ? (
                          <span style={{ fontSize: 12 }}>{avatar.description}</span>
                        ) : (
                          <span className="muted">-</span>
                        )}
                      </td>
                      <td>{avatar.isActive ? '✅' : '❌'}</td>
                      <td>{new Date(avatar.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            className="button secondary"
                            onClick={() => startEdit(avatar)}
                            style={{ fontSize: 12, padding: '4px 8px' }}
                          >
                            Düzenle
                          </button>
                          <button
                            className="button"
                            onClick={() => handleDelete(avatar.id)}
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
