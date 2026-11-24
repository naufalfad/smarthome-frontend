/**
 * PHASE 7: CUSTOMER SERVICE ORDER INTAKE MODAL
 *
 * Multi-step guided order submission workflow:
 * Step 1: Package & Contact Information
 * Step 2: Property & Scope Details
 * Step 3: Review, Commercial Scope Disclaimer & Submission
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Package,
  Home,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Loader2,
  FileText,
  MapPin,
  Phone,
  User,
} from 'lucide-react';
import { ServicePackage } from '../../types/service-package';
import { ServiceOrder, PropertyType } from '../../types/service-order';
import { serviceOrderApi } from '../../services/service-order.api';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface CustomerOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageItem: ServicePackage | null;
  onOrderSuccess?: (order: ServiceOrder) => void;
}

export const CustomerOrderModal: React.FC<CustomerOrderModalProps> = ({
  isOpen,
  onClose,
  packageItem,
  onOrderSuccess,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<ServiceOrder | null>(null);

  // Form Fields
  const [contactName, setContactName] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [propertyName, setPropertyName] = useState<string>('');
  const [propertyType, setPropertyType] = useState<PropertyType>('HOUSE');
  const [propertyAddress, setPropertyAddress] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [postalCode, setPostalCode] = useState<string>('');
  const [approximateAreaM2, setApproximateAreaM2] = useState<string>('');
  const [estimatedRooms, setEstimatedRooms] = useState<string>('');
  const [customerNotes, setCustomerNotes] = useState<string>('');
  const [agreedDisclaimer, setAgreedDisclaimer] = useState<boolean>(false);

  // Initialize defaults when modal opens or package changes
  useEffect(() => {
    if (isOpen && packageItem) {
      setStep(1);
      setSubmitting(false);
      setErrorMessage(null);
      setCompletedOrder(null);
      setContactName(user?.customerProfile?.fullName || user?.name || user?.username || '');
      setContactPhone(user?.customerProfile?.phone || user?.phone || '');
      setPropertyName(`Properti Smart Home - ${packageItem.name}`);
      setPropertyType('HOUSE');
      setPropertyAddress('');
      setCity('');
      setPostalCode('');
      setApproximateAreaM2('');
      setEstimatedRooms(packageItem.maxRooms ? String(packageItem.maxRooms) : '');
      setCustomerNotes('');
      setAgreedDisclaimer(false);
    }
  }, [isOpen, packageItem, user]);

  if (!isOpen || !packageItem) return null;

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!contactName.trim()) {
      setErrorMessage('Nama kontak pemesan wajib diisi.');
      return;
    }
    if (!contactPhone.trim() || contactPhone.trim().length < 8) {
      setErrorMessage('Nomor telepon / WhatsApp kontak yang valid wajib diisi (minimal 8 digit).');
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!propertyName.trim() || propertyName.trim().length < 2) {
      setErrorMessage('Nama properti wajib diisi (minimal 2 karakter).');
      return;
    }
    if (!propertyAddress.trim() || propertyAddress.trim().length < 5) {
      setErrorMessage('Alamat lengkap lokasi properti wajib diisi (minimal 5 karakter).');
      return;
    }
    if (approximateAreaM2 && (isNaN(Number(approximateAreaM2)) || Number(approximateAreaM2) <= 0)) {
      setErrorMessage('Perkiraan luas bangunan harus berupa angka positif yang valid.');
      return;
    }
    setStep(3);
  };

  const handleSubmitOrder = async () => {
    if (!agreedDisclaimer) {
      setErrorMessage('Silakan centang persetujuan ketentuan sebelum mengajukan pesanan.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);

      const created = await serviceOrderApi.submitOrder({
        packageId: packageItem.id,
        propertyName: propertyName.trim(),
        propertyType,
        propertyAddress: propertyAddress.trim(),
        city: city.trim() || null,
        postalCode: postalCode.trim() || null,
        approximateAreaM2: approximateAreaM2 ? Number(approximateAreaM2) : null,
        estimatedRooms: estimatedRooms ? parseInt(estimatedRooms, 10) : null,
        customerNotes: customerNotes.trim() || null,
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
      });

      setCompletedOrder(created);
      if (onOrderSuccess) {
        onOrderSuccess(created);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal mengajukan pesanan layanan. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl flex flex-col justify-between">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-[10px] uppercase font-bold">
                Pengajuan Pesanan Layanan
              </Badge>
              <span className="text-xs text-slate-400">Langkah {step} dari 3</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight mt-1">
              {packageItem.name}
            </h2>
            <div className="text-emerald-400 font-extrabold text-sm">
              {packageItem.formattedPrice || `Rp ${packageItem.price}`}
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Step Indicator Tabs */}
        {!completedOrder && (
          <div className="flex items-center justify-between mb-6 border-b border-slate-800/80 pb-3">
            <div
              className={`flex items-center gap-2 text-xs font-semibold ${
                step === 1 ? 'text-cyan-400' : step > 1 ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
                  step === 1
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : step > 1
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                1
              </div>
              <span>Paket & Kontak</span>
            </div>

            <div className="w-8 h-[1px] bg-slate-800" />

            <div
              className={`flex items-center gap-2 text-xs font-semibold ${
                step === 2 ? 'text-cyan-400' : step > 2 ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
                  step === 2
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : step > 2
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                2
              </div>
              <span>Rincian Properti</span>
            </div>

            <div className="w-8 h-[1px] bg-slate-800" />

            <div
              className={`flex items-center gap-2 text-xs font-semibold ${
                step === 3 ? 'text-cyan-400' : 'text-slate-500'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
                  step === 3
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                3
              </div>
              <span>Konfirmasi & Kirim</span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 1: PACKAGE CONFIRMATION & CONTACT INFO */}
        {/* ========================================================================= */}
        {step === 1 && !completedOrder && (
          <form onSubmit={handleNextStep1} className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">
                Paket Layanan Terpilih
              </span>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-white">{packageItem.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{packageItem.shortDescription}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Biaya Turnkey</span>
                  <span className="text-lg font-black text-emerald-400">
                    {packageItem.formattedPrice || `Rp ${packageItem.price}`}
                  </span>
                </div>
              </div>
              {packageItem.estimatedDuration && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400 pt-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Estimasi pengerjaan: {packageItem.estimatedDuration}</span>
                </div>
              )}
            </div>

            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Informasi Kontak Pemesan
              </h4>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">
                  Nama Lengkap Pemesan <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">
                  Nomor Telepon / WhatsApp Aktif <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Nomor ini akan digunakan tim teknis untuk koordinasi verifikasi dan jadwal survei.
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="text-xs border-slate-700 text-slate-300"
              >
                Batal
              </Button>
              <Button type="submit" className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-semibold">
                Lanjut ke Rincian Properti
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: PROPERTY & SCOPE DETAILS */}
        {/* ========================================================================= */}
        {step === 2 && !completedOrder && (
          <form onSubmit={handleNextStep2} className="space-y-4">
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5" />
              Identitas & Lokasi Properti
            </h4>

            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">
                Nama Properti / Bangunan <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
                placeholder="Contoh: Rumah Tinggal Pondok Indah"
                className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">
                  Tipe Properti <span className="text-red-400">*</span>
                </label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="HOUSE">Rumah Tinggal (House)</option>
                  <option value="APARTMENT">Apartemen (Apartment)</option>
                  <option value="VILLA">Villa</option>
                  <option value="OFFICE">Kantor (Office)</option>
                  <option value="SHOPHOUSE">Ruko / Shophouse</option>
                  <option value="OTHER">Lainnya (Other)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">
                  Kota / Kabupaten
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Contoh: Jakarta Selatan"
                  className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">
                Alamat Lengkap Lokasi Properti <span className="text-red-400">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={propertyAddress}
                onChange={(e) => setPropertyAddress(e.target.value)}
                placeholder="Jalan, No. Rumah, RT/RW, Kelurahan, Kecamatan"
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">
                  Kode Pos
                </label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="12340"
                  className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">
                  Perkiraan Luas (m²)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={approximateAreaM2}
                  onChange={(e) => setApproximateAreaM2(e.target.value)}
                  placeholder="Contoh: 150"
                  className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">
                  Perkiraan Ruangan
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={estimatedRooms}
                  onChange={(e) => setEstimatedRooms(e.target.value)}
                  placeholder="Contoh: 4"
                  className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">
                Catatan / Instruksi Khusus (Opsional)
              </label>
              <textarea
                rows={2}
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="Contoh: Akses lokasi hanya bisa mobil kecil, prefer survei saat akhir pekan."
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="text-xs border-slate-700 text-slate-300"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Kembali
              </Button>
              <Button type="submit" className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-semibold">
                Lanjut ke Peninjauan
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: REVIEW, DISCLAIMER & SUBMISSION */}
        {/* ========================================================================= */}
        {step === 3 && !completedOrder && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Ringkasan & Persetujuan Pemesanan
            </h4>

            {/* Summary Review Card */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3 text-xs">
              <div className="flex items-start justify-between border-b border-slate-800/80 pb-2.5">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Paket Dipilih</span>
                  <div className="text-sm font-bold text-white mt-0.5">{packageItem.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{packageItem.code}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Biaya Layanan</span>
                  <div className="text-base font-black text-emerald-400 mt-0.5">
                    {packageItem.formattedPrice || `Rp ${packageItem.price}`}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Kontak Pemesan</span>
                  <span className="font-semibold">{contactName}</span> ({contactPhone})
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Tipe & Nama Properti</span>
                  <span className="font-semibold">{propertyName}</span> ({propertyType})
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Alamat Pemasangan</span>
                <span className="text-slate-300 leading-relaxed">
                  {propertyAddress}
                  {city ? `, ${city}` : ''}
                  {postalCode ? ` ${postalCode}` : ''}
                </span>
              </div>

              {(approximateAreaM2 || estimatedRooms) && (
                <div className="flex gap-4 text-slate-300 pt-1">
                  {approximateAreaM2 && <span>Luas: {approximateAreaM2} m²</span>}
                  {estimatedRooms && <span>Estimasi Ruang: {estimatedRooms}</span>}
                </div>
              )}

              {customerNotes && (
                <div className="pt-1 text-slate-400 italic">
                  Catatan: &ldquo;{customerNotes}&rdquo;
                </div>
              )}
            </div>

            {/* Commercial Scope Transparency Disclaimer */}
            <div className="p-4 rounded-xl bg-cyan-950/25 border border-cyan-800/40 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-cyan-300 font-bold">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Ketentuan & Transparansi Alur Layanan
              </div>
              <ul className="space-y-1.5 text-slate-300 text-[11px] list-disc list-inside leading-relaxed">
                <li>
                  Pesanan yang diajukan akan masuk ke status <strong>MENUNGGU KONFIRMASI (PENDING)</strong> untuk ditinjau oleh Super Admin.
                </li>
                <li>
                  <strong>Tidak ada pemotongan saldo otomatis</strong> saat pengajuan pesanan ini.
                </li>
                <li>
                  Penjadwalan survei lokasi serta penugasan teknisi resmi akan dikoordinasikan setelah pesanan diverifikasi dan dikonfirmasi.
                </li>
                <li>
                  Anda dapat membatalkan pesanan secara mandiri selama status pesanan masih berada dalam status <strong>PENDING</strong>.
                </li>
              </ul>
            </div>

            {/* Checkbox Disclaimer */}
            <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/50 border border-slate-800 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreedDisclaimer}
                onChange={(e) => setAgreedDisclaimer(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-cyan-500 rounded bg-slate-900 border-slate-700 focus:ring-cyan-500 focus:ring-offset-slate-900"
              />
              <span className="text-xs text-slate-300 leading-relaxed">
                Saya telah memeriksa rincian data di atas dan setuju untuk mengajukan pesanan layanan ini sesuai ketentuan yang berlaku.
              </span>
            </label>

            <div className="pt-4 border-t border-slate-800 flex justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => setStep(2)}
                className="text-xs border-slate-700 text-slate-300"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Kembali
              </Button>
              <Button
                type="button"
                disabled={submitting || !agreedDisclaimer}
                onClick={handleSubmitOrder}
                className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-10 px-5 shadow-lg shadow-emerald-950/40"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Memproses Pesanan...
                  </>
                ) : (
                  <>
                    Konfirmasi & Ajukan Pesanan
                    <CheckCircle2 className="w-4 h-4 ml-1.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* COMPLETED SUCCESS STATE */}
        {/* ========================================================================= */}
        {completedOrder && (
          <div className="py-6 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">Pesanan Berhasil Diajukan!</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                Terima kasih atas kepercayaan Anda. Pesanan Anda telah tersimpan dan sedang menunggu konfirmasi dari Super Admin.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 max-w-sm mx-auto text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Nomor Pesanan</span>
              <span className="text-xl font-mono font-black text-cyan-400 mt-0.5 block tracking-wider">
                {completedOrder.orderNumber}
              </span>
              <Badge className="mt-2 bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">
                Status: MENUNGGU KONFIRMASI (PENDING)
              </Badge>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-center gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="text-xs border-slate-700 text-slate-300"
              >
                Tutup
              </Button>
              <Button
                onClick={() => {
                  onClose();
                  navigate('/orders');
                }}
                className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
              >
                Buka Riwayat Pesanan Saya
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
