/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Scissors, Mail, Lock, Loader2, AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if already logged in and redirect accordingly
  useEffect(() => {
    async function checkActiveSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setLoading(true);
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            if (profile.role === 'super_admin') {
              router.replace('/admin');
            } else if (profile.role === 'barber') {
              router.replace('/dashboard');
            }
          }
        } catch (err) {
          console.error('Error auto-redirecting:', err);
        } finally {
          setLoading(false);
        }
      }
    }
    checkActiveSession();
  }, [supabase, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw new Error(authError.message === 'Invalid login credentials' 
          ? 'Credenciales inválidas. Verifica tu correo y contraseña.' 
          : authError.message
        );
      }

      if (!authData?.session) {
        throw new Error('No se pudo establecer la sesión.');
      }

      const userId = authData.session.user.id;

      // 2. Fetch user profile role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, barbershop_id')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        console.error('Login profile error details:', profileError);
        // Sign out if no profile associated to protect security
        await supabase.auth.signOut();
        throw new Error('Tu usuario no tiene un perfil configurado en el sistema.');
      }

      // 3. Redirect based on role
      if (profile.role === 'super_admin') {
        router.push('/admin');
      } else if (profile.role === 'barber') {
        router.push('/dashboard');
      } else {
        await supabase.auth.signOut();
        throw new Error('Rol de usuario no autorizado.');
      }

    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado al iniciar sesión.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text-primary flex items-center justify-center p-4 relative overflow-hidden font-inter">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gold/5 blur-[120px] pointer-events-none -z-10" />

      {/* Back button */}
      <div className="absolute top-6 left-6 z-20">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-text-secondary hover:text-gold transition-colors text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Inicio
        </Link>
      </div>

      {/* Login Card */}
      <div className="max-w-md w-full glass border border-white/5 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Top card accent */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />

        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-4">
            <Scissors className="w-6 h-6 text-gold rotate-90" />
          </div>
          <h1 className="font-sora text-2xl font-bold tracking-tight">Bienvenido de nuevo</h1>
          <p className="text-xs text-text-secondary mt-1.5 font-medium">Ingresa tus credenciales para acceder</p>
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger/20 rounded-2xl p-4 flex gap-3 items-start mb-6 text-sm text-danger animate-fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          {/* Email field */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs text-text-secondary font-medium pl-1">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                required
                disabled={loading}
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="w-full bg-surface-dark border border-white/5 text-text-primary text-sm rounded-xl pl-10 pr-4 py-3.5 focus:outline-none focus:border-gold transition-colors font-medium disabled:opacity-50"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="password" className="text-xs text-text-secondary font-medium">
                Contraseña
              </label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                required
                disabled={loading}
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-surface-dark border border-white/5 text-text-primary text-sm rounded-xl pl-10 pr-12 py-3.5 focus:outline-none focus:border-gold transition-colors font-medium disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-text-secondary hover:text-text-primary transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Login button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold hover:bg-gold-hover text-background font-bold py-4 rounded-xl transition-all shadow-lg shadow-gold/10 hover:shadow-gold/20 text-sm flex items-center justify-center gap-2 hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-background" />
                Iniciando sesión...
              </>
            ) : (
              'Entrar al Panel'
            )}
          </button>
        </form>

        <div className="text-center mt-8 pt-6 border-t border-white/5">
          <p className="text-xs text-text-secondary">
            ¿No tienes una cuenta?{' '}
            <span className="text-gold font-semibold">
              Tu administrador debe registrarte
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
