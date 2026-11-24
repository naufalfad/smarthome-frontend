import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Home,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getDefaultRouteForRole } from '../../utils/route-access';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validateClientForm = (): string | null => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (trimmedName.length < 2) {
      return 'Nama lengkap minimal terdiri dari 2 karakter.';
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return 'Masukkan alamat email yang valid (contoh: nama@email.com).';
    }
    if (password.length < 8) {
      return 'Kata sandi minimal 8 karakter.';
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      return 'Kata sandi harus mengandung kombinasi huruf dan angka.';
    }
    if (password !== confirmPassword) {
      return 'Konfirmasi kata sandi tidak cocok.';
    }
    if (phone.trim() && !/^[0-9+\-\s()]{7,25}$/.test(phone.trim())) {
      return 'Format nomor telepon tidak valid.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const validationError = validateClientForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const registeredUser = await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim() || undefined,
      });

      setSuccessMessage('Pendaftaran berhasil! Mengarahkan ke portal Customer...');
      const dest = getDefaultRouteForRole(registeredUser.role, registeredUser.houseId);
      setTimeout(() => {
        navigate(dest, { replace: true });
      }, 600);
    } catch (err: any) {
      setError(err?.message || 'Gagal mendaftarkan akun. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30 text-white mb-3">
            <UserPlus className="w-7 h-7" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            <span>Daftar Akun Customer</span>
          </h1>
          <p className="text-xs text-purple-200/80 mt-1">
            Buat akun pemilik properti untuk menggunakan platform Smart Home
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-100 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-300 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-100 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-300 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
          {/* Name */}
          <div>
            <label className="block text-[11px] font-bold text-purple-200/90 uppercase tracking-wider mb-1">
              Nama Lengkap *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-purple-300/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Budi Santoso"
                autoComplete="name"
                disabled={loading}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-[11px] font-bold text-purple-200/90 uppercase tracking-wider mb-1">
              Alamat Email *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-purple-300/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@email.com"
                autoComplete="email"
                disabled={loading}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Optional Phone */}
          <div>
            <label className="block text-[11px] font-bold text-purple-200/90 uppercase tracking-wider mb-1">
              Nomor Telepon <span className="text-white/40 font-normal normal-case">(Opsional)</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-purple-300/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+62 812-3456-7890"
                autoComplete="tel"
                disabled={loading}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[11px] font-bold text-purple-200/90 uppercase tracking-wider mb-1">
              Kata Sandi *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-purple-300/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter (huruf & angka)"
                autoComplete="new-password"
                disabled={loading}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                aria-label="Toggle visibility kata sandi"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-purple-200/60 mt-1">
              Gunakan minimal 8 karakter dengan kombinasi huruf dan angka.
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-[11px] font-bold text-purple-200/90 uppercase tracking-wider mb-1">
              Konfirmasi Kata Sandi *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-purple-300/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi kata sandi"
                autoComplete="new-password"
                disabled={loading}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                aria-label="Toggle visibility konfirmasi kata sandi"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer mt-2"
          >
            {loading ? (
              <span>Mendaftarkan akun...</span>
            ) : (
              <>
                <span>Daftar Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-white/10 text-center space-y-2">
          <p className="text-xs text-purple-200/80">
            Sudah memiliki akun?{' '}
            <Link to="/login" className="font-bold text-white hover:text-purple-300 underline underline-offset-2">
              Masuk di sini
            </Link>
          </p>
          <p className="text-[10px] text-white/40 flex items-center justify-center gap-1">
            <Home className="w-3 h-3" />
            <span>Pendaftaran publik khusus untuk akun Customer pemilik properti.</span>
          </p>
        </div>
      </div>
    </div>
  );
};
