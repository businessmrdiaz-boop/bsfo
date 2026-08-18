'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

type Role = 'company' | 'driver';
type Mode = 'login' | 'register';

export default function LoginPage() {
  const router = useRouter();

  const [role, setRole] = useState<Role>('company');
  const [mode, setMode] = useState<Mode>('login');
  const [companyName, setCompanyName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRoleChange = (nextRole: Role) => {
    setRole(nextRole);
    setTermsAccepted(false);
    setError('');
    setNotice('');
  };

  const handleModeChange = (nextMode: Mode) => {
    setMode(nextMode);
    setTermsAccepted(false);
    setError('');
    setNotice('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setNotice('');

    if (!email.trim() || !password) {
      setError('Please complete the email and password fields.');
      return;
    }

    if (mode === 'register' && !termsAccepted) {
      setError('You must accept the Terms & Conditions before registering.');
      return;
    }

    if (role === 'company' && mode === 'register') {
      if (!companyName.trim() || !logoUrl.trim()) {
        setError('Please complete the company name and logo URL.');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) throw signInError;

        if (!data.user) {
          throw new Error('No user was returned from Supabase.');
        }

        router.push('/dashboard');
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data:
            role === 'company'
              ? {
                  role: 'company',
                  company_name: companyName.trim(),
                  logo_url: logoUrl.trim(),
                }
              : {
                  role: 'driver',
                },
        },
      });

      if (signUpError) throw signUpError;

      if (!data.user) {
        throw new Error('Unable to create your account.');
      }

      if (data.session) {
        router.push('/dashboard');
        return;
      }

      setNotice(
        role === 'company'
          ? 'Your company account was created. Please check your email to confirm it before signing in.'
          : 'Your driver account was created. Please check your email to confirm it before signing in.'
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to complete authentication.';
      setError(message);
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="relative isolate min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),transparent_30%),linear-gradient(180deg,#020817_0%,#0f172a_100%)] px-4 py-10 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="absolute bottom-[-6rem] right-[-6rem] h-80 w-80 rounded-full bg-sky-500/10 blur-3xl" />
        </div>

        <section className="mx-auto max-w-3xl rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/20 backdrop-blur-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Choose Your Role</p>
              <h1 className="mt-3 text-3xl font-semibold text-white">Driver or Company Access</h1>
              <p className="mt-3 text-sm text-slate-400">
                {role === 'driver'
                  ? 'Drivers can log in to view only their assigned trips and report delivery status.'
                  : 'Companies can register or log in to manage fleet operations, billing, and drivers.'}
              </p>
            </div>

            <div className="flex gap-2 rounded-3xl bg-slate-950/90 p-2">
              <button
                type="button"
                onClick={() => handleRoleChange('company')}
                className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                  role === 'company'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                I am a Company
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange('driver')}
                className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                  role === 'driver'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                I am a Driver
              </button>
            </div>
          </div>

          <div className="mt-8 flex gap-2 rounded-3xl bg-slate-950/90 p-2">
            <button
              type="button"
              onClick={() => handleModeChange('login')}
              className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                mode === 'login' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('register')}
              className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                mode === 'register' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          <form className="mt-8 grid gap-6" onSubmit={handleSubmit}>
            {role === 'company' && mode === 'register' && (
              <>
                <label className="block text-sm font-medium text-slate-300">
                  Business Name
                  <input
                    value={companyName}
                    onChange={(event) => setCompanyName(event.target.value)}
                    placeholder="Your company name"
                    className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-500"
                  />
                </label>

                <label className="block text-sm font-medium text-slate-300">
                  Company Logo URL
                  <input
                    value={logoUrl}
                    onChange={(event) => setLogoUrl(event.target.value)}
                    placeholder="https://..."
                    className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-500"
                  />
                </label>
              </>
            )}

            <label className="block text-sm font-medium text-slate-300">
              {role === 'driver' ? 'Driver Email' : 'Admin Email'}
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={role === 'driver' ? 'driver@example.com' : 'admin@company.com'}
                className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-500"
              />
            </label>

            <label className="block text-sm font-medium text-slate-300">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter a secure password"
                className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-500"
              />
            </label>

            {mode === 'register' && (
              <div className="space-y-3">
                <div className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/80 p-3">
                  <input
                    id="terms-acceptance"
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(event) => setTermsAccepted(event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500"
                  />
                  <label htmlFor="terms-acceptance" className="text-sm leading-6 text-slate-200">
                    I agree to the Terms & Conditions and Release of Liability
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="text-sm font-medium text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline"
                >
                  Read terms
                </button>
              </div>
            )}

            {error && <p className="text-sm text-rose-400">{error}</p>}
            {notice && <p className="text-sm text-emerald-400">{notice}</p>}

            <button
              type="submit"
              disabled={loading || (mode === 'register' && !termsAccepted)}
              className={`rounded-2xl px-6 py-3 text-sm font-semibold text-slate-950 transition ${
                loading || (mode === 'register' && !termsAccepted)
                  ? 'cursor-not-allowed bg-slate-600 opacity-60'
                  : 'bg-cyan-500 hover:bg-cyan-400'
              }`}
            >
              {loading
                ? 'Processing...'
                : role === 'driver'
                  ? 'Driver Sign In'
                  : mode === 'login'
                    ? 'Company Sign In'
                    : 'Register Company'}
            </button>
          </form>
        </section>
      </div>

      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[2rem] border border-slate-700 bg-slate-900 p-6 shadow-2xl shadow-slate-950/50">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold text-white">Terms & Conditions</h2>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:border-slate-500 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="mt-4 max-h-[60vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950/70 p-5 text-sm leading-7 text-slate-300">
              <p>
                BSFO is provided on an as-is basis. The platform, its software, infrastructure, and related services are
                offered without warranties of any kind, whether express or implied, including warranties of
                merchantability, fitness for a particular purpose, availability, performance, or error-free operation.
              </p>

              <p className="mt-4">
                By using BSFO, users acknowledge and accept that software errors, system outages, operational delays,
                data inaccuracies, communication failures, and other disruptions may occur. In no event shall the
                platform, its creators, operators, affiliates, or contributors be liable for any direct, indirect,
                incidental, consequential, special, or punitive damages, including loss of revenue, delayed shipments,
                business interruption, equipment damage, or other losses arising from platform use or reliance on the
                service.
              </p>

              <p className="mt-4">
                Users release the platform and its creators from any liability related to software failures, delays,
                operational issues, damages, or losses connected with the use of BSFO, including claims resulting from
                missed deadlines, misrouting, inaccurate status updates, or service interruptions.
              </p>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setTermsAccepted(true);
                  setShowTermsModal(false);
                }}
                className="rounded-2xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
              >
                I agree
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
