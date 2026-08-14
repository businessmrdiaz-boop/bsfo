'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function AuthPage() {
  const router = useRouter();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function waitForDriverRecord(authId: string, maxAttempts = 10, baseDelayMs = 300) {
    let attempt = 0;

    while (attempt < maxAttempts) {
      attempt += 1;

      try {
        const { data, error, status } = await supabase
          .from('drivers')
          .select('id, company_id, full_name, email')
          .or(`auth_id.eq.${authId},user_id.eq.${authId}`)
          .limit(1)
          .maybeSingle();

        if (data) {
          return data;
        }

        if (error && status !== 404) {
          console.warn('waitForDriverRecord error', error);
        }
      } catch (e) {
        console.warn('waitForDriverRecord exception', e);
      }

      await new Promise((resolve) => setTimeout(resolve, baseDelayMs * attempt));
    }

    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setNotice(null);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // data: { company: 'ByMe', full_name: 'Nombre Apellido' },
          },
        });

        if (error) throw error;

        if (!data?.user) {
          setNotice('Revisa tu correo para confirmar el enlace de registro (magic link).');
          setLoading(false);
          return;
        }

        const authId = data.user.id;
        await waitForDriverRecord(authId);
        router.push('/dashboard');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        const userId = data?.user?.id;
        if (userId) {
          await waitForDriverRecord(userId);
          router.push('/dashboard');
        } else {
          setNotice('Inicio de sesión iniciado. Si no redirige, revisa tu correo.');
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error en autenticación';
      setErrorMsg(message);
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</h1>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 8, maxWidth: 420 }}>
        <label>
          <span>Email</span>
          <input
            aria-label="email"
            type="email"
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%' }}
          />
        </label>

        <label>
          <span>Contraseña</span>
          <input
            aria-label="password"
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%' }}
          />
        </label>

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" disabled={loading}>
            {loading ? 'Procesando...' : mode === 'login' ? 'Entrar' : 'Registrarme'}
          </button>

          <button
            type="button"
            onClick={() => setMode((m) => (m === 'login' ? 'signup' : 'login'))}
          >
            {mode === 'login' ? 'Crear cuenta' : 'Ir a login'}
          </button>
        </div>

        {notice && <div style={{ color: 'green' }}>{notice}</div>}
        {errorMsg && <div style={{ color: 'red' }}>{errorMsg}</div>}
      </form>

      <hr style={{ margin: '24px 0' }} />

      <small>
        Integración y notas rápidas:
        <ul>
          <li>
            Asegúrate de definir en tu entorno: NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.
          </li>
          <li>
            Si prefieres centralizar el polling/redirección, crea un AuthListener global y monta en app/layout.tsx.
          </li>
          <li>
            Ajusta la ruta de redirect (&quot;/dashboard&quot;) si tu dashboard está en otra ruta.
          </li>
          <li>
            Verifica que la tabla <code>drivers</code> tenga la columna <code>auth_id</code> o <code>user_id</code>.
          </li>
        </ul>
      </small>
    </main>
  );
}
