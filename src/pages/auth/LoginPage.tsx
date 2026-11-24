import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  User,
  Wrench,
  Lock,
  Eye,
  EyeOff,
  Home,
  ArrowRight,
  AlertCircle,
  Mail,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { resolvePostLoginRoute } from '../../utils/route-access';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, authNotice, clearAuthNotice } = useAuth();

  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fromPath = (location.state as any)?.from?.pathname as string | undefined;

  const handleSubmit = async (e?: React.FormEvent, customIdentifier?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setError(null);
    clearAuthNotice();

    const idToSubmit = (customIdentifier !== undefined ? customIdentifier : identifier).trim();
    const passToSubmit = customPass !== undefined ? customPass : password;

    if (!idToSubmit || !passToSubmit) {
      setError('Email / username dan kata sandi wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      const loggedUser = await login(idToSubmit, passToSubmit);
      const dest = resolvePostLoginRoute(loggedUser.role, fromPath, loggedUser.houseId);
      navigate(dest, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Gagal masuk. Periksa kembali kredensial Anda.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (presetId: string, presetPass: string) => {
    setError(null);
    clearAuthNotice();
    setLoading(true);
    setIdentifier(presetId);
    setPassword(presetPass);
    try {
      const loggedUser = await login(presetId, presetPass);
      navigate(resolvePostLoginRoute(loggedUser.role, null, loggedUser.houseId), { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Gagal masuk.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Card Container */}
      <div className="w-full max-w-lg bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
        {/* App Logo & Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-lg shadow-purple-500/30 text-white mb-3">
            <Home className="w-7 h-7" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            <span>SMART HOME 2D</span>
            <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/30 border border-purple-400/30 text-purple-200">
              PLATFORM
            </span>
          </h1>
          <p className="text-xs text-purple-200/80 mt-1">
            Pilih akun pengujian manual di bawah ini atau masuk dengan kredensial
          </p>
        </div>

        {/* Quick-Login Preset Buttons for Manual Testing */}
        <div className="mb-5">
          <div className="text-[11px] font-bold text-purple-200/90 uppercase tracking-wider mb-2 text-center">
            Pilih Akun Skenario Uji (1-Klik)
          </div>
          
          {/* Row 1: Super Admin & Customers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
            {/* 1. SUPER_ADMIN */}
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin('admin', 'admin123')}
              className="flex flex-col items-center gap-1 p-2.5 rounded-2xl bg-purple-500/15 hover:bg-purple-500/30 border border-purple-400/30 hover:border-purple-300/60 transition-all text-center group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-white">Super Admin</p>
                <p className="text-[10px] text-purple-200/70">Semua Properti</p>
              </div>
            </button>

            {/* 2. CUSTOMER A (A1 & A2) */}
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin('customer.a@smarthome.id', 'customer123')}
              className="flex flex-col items-center gap-1 p-2.5 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-400/30 hover:border-emerald-300/60 transition-all text-center group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-white">Customer A</p>
                <p className="text-[10px] text-emerald-200/70">Rumah A1 & A2</p>
              </div>
            </button>

            {/* 3. CUSTOMER B (B1) */}
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin('customer.b@smarthome.id', 'customer123')}
              className="flex flex-col items-center gap-1 p-2.5 rounded-2xl bg-teal-500/15 hover:bg-teal-500/30 border border-teal-400/30 hover:border-teal-300/60 transition-all text-center group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-white">Customer B</p>
                <p className="text-[10px] text-teal-200/70">Rumah B1</p>
              </div>
            </button>
          </div>

          {/* Row 2: Technicians & Dev Account */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* 4. TECHNICIAN X */}
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin('technician.x@smarthome.id', 'tech123')}
              className="flex items-center gap-2.5 p-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/30 border border-indigo-400/30 hover:border-indigo-300/60 transition-all group cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                <Wrench className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white leading-tight">Technician X</p>
                <p className="text-[10px] text-indigo-200/70">Tanpa Assignment</p>
              </div>
            </button>

            {/* 5. TECHNICIAN Y */}
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin('technician.y@smarthome.id', 'tech123')}
              className="flex items-center gap-2.5 p-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/30 border border-indigo-400/30 hover:border-indigo-300/60 transition-all group cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                <Wrench className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white leading-tight">Technician Y</p>
                <p className="text-[10px] text-indigo-200/70">Tanpa Assignment</p>
              </div>
            </button>
          </div>
        </div>

        <div className="relative flex py-2 items-center mb-4">
          <div className="flex-grow border-t border-white/15"></div>
          <span className="flex-shrink mx-3 text-[10px] font-bold uppercase tracking-wider text-white/40">
            Atau masuk manual dengan kredensial
          </span>
          <div className="flex-grow border-t border-white/15"></div>
        </div>

        {/* Auth Notice / Error Banner */}
        {(error || authNotice) && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-100 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-300 mt-0.5" />
            <span>{error || authNotice}</span>
          </div>
        )}

        {/* Unified Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-purple-200/90 uppercase tracking-wider mb-1.5">
              Email (Customer) atau Username (Staf Internal)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-purple-300/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="customer@email.com atau admin / teknisi"
                autoComplete="username"
                disabled={loading}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-purple-200/90 uppercase tracking-wider mb-1.5">
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-purple-300/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={loading}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span>Memproses...</span>
            ) : (
              <>
                <span>Masuk ke Aplikasi</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Customer Registration CTA & Credential Helpers */}
        <div className="mt-5 pt-4 border-t border-white/10 text-center space-y-3">
          <Link
            to="/register"
            className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <UserPlus className="w-4 h-4 text-emerald-300" />
            <span>Belum punya akun Customer? Daftar Sekarang</span>
          </Link>
          <div className="text-[10px] text-white/50 space-y-1 text-left bg-white/5 p-3 rounded-xl border border-white/10">
            <p>
              <strong className="text-purple-300">Super Admin:</strong> <code className="text-white">admin / admin123</code>
            </p>
            <p>
              <strong className="text-emerald-300">Customer A (A1 & A2):</strong> <code className="text-white">customer.a@smarthome.id / customer123</code>
            </p>
            <p>
              <strong className="text-teal-300">Customer B (B1):</strong> <code className="text-white">customer.b@smarthome.id / customer123</code>
            </p>
            <p>
              <strong className="text-indigo-300">Technician X & Y:</strong> <code className="text-white">technician.x@smarthome.id / tech123</code> (atau Y)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
