'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  return (
    <div className="container" style={{ maxWidth: 480, marginTop: 80 }}>
      <div className="card">
        <h1 style={{ fontSize: 22, marginBottom: 12 }}>Admin Girişi</h1>
        <p className="muted" style={{ marginBottom: 16 }}>
          Admin paneline erişim için yönetici token girin.
        </p>
        <input
          className="input"
          placeholder="ADMIN_API_TOKEN"
          value={token}
          onChange={(event) => setToken(event.target.value)}
        />
        {error ? (
          <div style={{ color: 'var(--danger)', marginTop: 8 }}>{error}</div>
        ) : null}
        <button
          className="button"
          style={{ marginTop: 12, width: '100%' }}
          onClick={() => {
            if (!token.trim()) {
              setError('Token gerekli');
              return;
            }
            window.localStorage.setItem('adminToken', token.trim());
            router.push('/dashboard');
          }}
        >
          Giriş Yap
        </button>
      </div>
    </div>
  );
}
