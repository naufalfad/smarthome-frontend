import React, { useState, useEffect } from 'react';
import {
  X,
  Home,
  Layers,
  Zap,
  Wifi,
  Camera,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Wrench,
  User,
  Phone,
  Mail,
  Calendar,
  AlertTriangle,
  ExternalLink,
  History,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { AuthenticatedImage } from '../common/AuthenticatedImage';
import { fieldSurveyApi } from '../../services/field-survey.api';
import { FieldSurvey, VerifySurveyResult } from '../../types/field-survey';

interface AdminSurveyReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
  orderNumber?: string | null;
  onSurveyVerified?: () => void;
}

export const AdminSurveyReviewModal: React.FC<AdminSurveyReviewModalProps> = ({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  onSurveyVerified,
}) => {
  const [survey, setSurvey] = useState<FieldSurvey | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Super Admin action states
  const [verifying, setVerifying] = useState<boolean>(false);
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [verifyResult, setVerifyResult] = useState<VerifySurveyResult | null>(null);

  // Revision state
  const [showRevisionForm, setShowRevisionForm] = useState<boolean>(false);
  const [revisionReason, setRevisionReason] = useState<string>('');
  const [requestingRevision, setRequestingRevision] = useState<boolean>(false);

  // Zoomed photo modal
  const [zoomedPhotoId, setZoomedPhotoId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !orderId) return;

    const fetchSurvey = async () => {
      try {
        setLoading(true);
        setError(null);
        setVerifyResult(null);
        setShowRevisionForm(false);
        const data = await fieldSurveyApi.getSurveyForAdmin(orderId);
        setSurvey(data);
      } catch (err: any) {
        setError(err?.message || 'Gagal memuat hasil survei lapangan untuk pesanan ini');
      } finally {
        setLoading(false);
      }
    };

    fetchSurvey();
  }, [isOpen, orderId]);

  if (!isOpen || !orderId) return null;

  // Handle Verify & Create House
  const handleVerify = async () => {
    const confirmed = confirm(
      'Verifikasi hasil survei ini dan ciptakan entitas Properti (House) secara otomatis? Status properti akan diinisialisasi sebagai CONFIGURING.'
    );
    if (!confirmed) return;

    try {
      setVerifying(true);
      setError(null);
      const res = await fieldSurveyApi.verifySurveyAndCreateHouse(orderId, adminNotes.trim() || undefined);
      setVerifyResult(res);
      setSurvey(res.survey);
      if (onSurveyVerified) onSurveyVerified();
    } catch (err: any) {
      setError(err?.message || 'Gagal memverifikasi survei');
    } finally {
      setVerifying(false);
    }
  };

  // Handle Request Revision
  const handleRequestRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionReason || revisionReason.trim().length < 5) {
      setError('Alasan perbaikan survei wajib diisi minimal 5 karakter non-whitespace.');
      return;
    }

    try {
      setRequestingRevision(true);
      setError(null);
      const res = await fieldSurveyApi.requestSurveyRevision(
        orderId,
        revisionReason.trim(),
        adminNotes.trim() || undefined
      );
      setSurvey(res);
      setShowRevisionForm(false);
      setRevisionReason('');
    } catch (err: any) {
      setError(err?.message || 'Gagal mengirim permintaan perbaikan survei');
    } finally {
      setRequestingRevision(false);
    }
  };

  const maxPackageRooms = survey?.serviceOrder?.packageSnapshot?.maxRooms || null;
  const isRoomsExceeded = maxPackageRooms !== null && (survey?.rooms?.length || 0) > maxPackageRooms;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans text-slate-100">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between bg-slate-950/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-black text-cyan-400">
                {orderNumber || survey?.serviceOrder?.orderNumber}
              </span>
              {survey?.status === 'SUBMITTED' && (
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Menunggu Verifikasi Super Admin
                </Badge>
              )}
              {survey?.status === 'VERIFIED' && (
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Survei Terverifikasi (Properti Dibuat)
                </Badge>
              )}
              {survey?.status === 'REVISION_REQUIRED' && (
                <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/40 text-xs font-bold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Dalam Proses Revisi Teknisi
                </Badge>
              )}
              {survey?.status === 'DRAFT' && (
                <Badge className="bg-slate-700 text-slate-300 border-slate-600 text-xs font-bold">
                  Draf Teknisi (Belum Diajukan)
                </Badge>
              )}
            </div>
            <h3 className="text-lg font-black text-white mt-1">
              Tinjauan Survei Lapangan: {survey?.serviceOrder?.propertyName}
            </h3>
            <p className="text-xs text-slate-400">
              Paket: <span className="text-slate-200 font-bold">{survey?.serviceOrder?.packageName}</span> •{' '}
              {survey?.serviceOrder?.propertyAddress}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-950/60 border border-rose-800/80 rounded-2xl flex items-center gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Verification Success Result Banner */}
        {verifyResult && (
          <div className="mx-6 mt-4 p-4 bg-emerald-950/60 border border-emerald-700/80 rounded-2xl space-y-1 text-xs text-emerald-300">
            <div className="font-black flex items-center gap-1.5 text-emerald-200 text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Properti Kanonikal Berhasil Dibuat!
            </div>
            <p className="text-slate-300 leading-relaxed pl-5">
              Entitas Properti: <span className="font-bold text-white">{verifyResult.house.name}</span>{' '}
              (ID: <span className="font-mono text-cyan-400">{verifyResult.house.id}</span>). Inisialisasi status:{' '}
              <span className="font-mono font-bold text-amber-300">{verifyResult.house.setupStatus}</span> dengan{' '}
              {verifyResult.house.floors?.length || 0} tingkat lantai dan denah otomatis.
            </p>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              <p className="text-xs font-semibold">Mengambil data survei lapangan...</p>
            </div>
          ) : !survey ? (
            <div className="py-20 text-center text-slate-400 space-y-2">
              <AlertCircle className="w-10 h-10 text-slate-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-300">Survei Belum Diinisialisasi</h4>
              <p className="text-xs max-w-sm mx-auto">
                Teknisi yang ditugaskan belum mulai mengisi formulir draf survei lapangan untuk pesanan ini.
              </p>
            </div>
          ) : (
            <>
              {/* Technician Info Strip */}
              {survey.technicianProfile && (
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-800/80 flex items-center justify-center text-cyan-400">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Teknisi Lapangan
                      </span>
                      <span className="font-bold text-white">
                        {survey.technicianProfile.user?.name || 'Teknisi'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-slate-300">
                    {survey.technicianProfile.user?.phone && (
                      <span className="flex items-center gap-1.5 text-cyan-400 font-medium">
                        <Phone className="w-3.5 h-3.5" />
                        {survey.technicianProfile.user.phone}
                      </span>
                    )}
                    {survey.technicianProfile.user?.email && (
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        {survey.technicianProfile.user.email}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Revision Required Alert in Super Admin View */}
              {survey.status === 'REVISION_REQUIRED' && survey.revisionReason && (
                <div className="p-4 bg-amber-950/40 border border-amber-800/70 rounded-2xl text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-300">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    Permintaan Revisi Terakhir Dikirim ke Teknisi:
                  </div>
                  <p className="pl-5 text-slate-200">{survey.revisionReason}</p>
                </div>
              )}

              {/* SECTION 1: BUILDING SPECS */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Home className="w-4 h-4 text-cyan-400" />
                  Spesifikasi &amp; Struktur Bangunan
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/40 p-4 rounded-2xl border border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Tipe Bangunan</span>
                    <span className="font-bold text-white">{survey.buildingType || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Jumlah Lantai</span>
                    <span className="font-bold text-white">{survey.totalFloors || 1} Lantai</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Estimasi Luas</span>
                    <span className="font-bold text-white">
                      {survey.estimatedAreaM2 ? `${survey.estimatedAreaM2} m²` : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Tinggi Plafon</span>
                    <span className="font-bold text-white">
                      {survey.ceilingHeightMeters ? `${survey.ceilingHeightMeters} m` : '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: ROOM INVENTORY */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    Inventarisasi Ruangan ({survey.rooms?.length || 0})
                  </h4>
                  {isRoomsExceeded && (
                    <Badge className="bg-amber-950/80 text-amber-300 border-amber-700 text-[10px] font-bold">
                      Melebihi Kuota Paket ({survey.rooms.length}/{maxPackageRooms})
                    </Badge>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/40">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 uppercase text-[10px] font-bold">
                        <th className="py-2.5 px-3">No</th>
                        <th className="py-2.5 px-3">Nama Ruangan</th>
                        <th className="py-2.5 px-3">Kategori</th>
                        <th className="py-2.5 px-3">Lantai</th>
                        <th className="py-2.5 px-3">Dimensi (m)</th>
                        <th className="py-2.5 px-3">Outlet / Saklar</th>
                        <th className="py-2.5 px-3">AC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {survey.rooms && survey.rooms.length > 0 ? (
                        survey.rooms.map((room, i) => (
                          <tr key={room.id} className="hover:bg-slate-800/30">
                            <td className="py-2.5 px-3 font-mono text-slate-500">{i + 1}</td>
                            <td className="py-2.5 px-3 font-bold text-white">{room.roomName}</td>
                            <td className="py-2.5 px-3 text-slate-300">{room.roomType}</td>
                            <td className="py-2.5 px-3 text-slate-300">Lantai {room.floorLevel}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-400">
                              {room.lengthMeters && room.widthMeters
                                ? `${room.lengthMeters} × ${room.widthMeters} m`
                                : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-300">
                              {room.wallOutletsCount} stop kontak • {room.lightSwitchesCount} saklar
                            </td>
                            <td className="py-2.5 px-3 text-slate-300">
                              {room.existingAcUnits > 0
                                ? `${room.existingAcUnits} Unit ${room.acUnitModel ? `(${room.acUnitModel})` : ''}`
                                : '-'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-slate-500 italic">
                            Belum ada ruangan yang dicatat oleh teknisi.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 3: ELECTRICAL & NETWORK AUDIT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Electrical specs */}
                <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-800 space-y-3 text-xs">
                  <h4 className="font-bold text-amber-400 flex items-center gap-1.5">
                    <Zap className="w-4 h-4" />
                    Spesifikasi Kelistrikan
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500 block">Kapasitas MCB Utama</span>
                      <span className="font-bold text-white">
                        {survey.mainBreakerAmps ? `${survey.mainBreakerAmps} Ampere` : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Tegangan Terukur</span>
                      <span className="font-bold text-white">
                        {survey.mainsVoltageVolts ? `${survey.mainsVoltageVolts} Volt` : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Sistem Grounding</span>
                      <span className="font-bold text-white">{survey.groundingStatus || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Sub-Panel MCB</span>
                      <span className="font-bold text-white">
                        {survey.hasSubPanels ? `Ada (${survey.subPanelLocations || 'Tersedia'})` : 'Tidak Ada'}
                      </span>
                    </div>
                  </div>
                  {survey.electricalNotes && (
                    <div className="pt-2 border-t border-slate-800 text-slate-400 text-[11px]">
                      Catatan: &ldquo;{survey.electricalNotes}&rdquo;
                    </div>
                  )}
                </div>

                {/* Network specs */}
                <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-800 space-y-3 text-xs">
                  <h4 className="font-bold text-cyan-400 flex items-center gap-1.5">
                    <Wifi className="w-4 h-4" />
                    Spesifikasi Jaringan &amp; Wi-Fi
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500 block">Provider Internet (ISP)</span>
                      <span className="font-bold text-white">{survey.ispProvider || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Kualitas Wi-Fi</span>
                      <span className="font-bold text-white">{survey.wifiCoverageRating || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Kecepatan DL / UL</span>
                      <span className="font-bold text-white">
                        {survey.measuredDownloadSpeed ? `${survey.measuredDownloadSpeed} Mbps` : '-'} /{' '}
                        {survey.measuredUploadSpeed ? `${survey.measuredUploadSpeed} Mbps` : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Posisi Router</span>
                      <span className="font-bold text-white">{survey.mainRouterLocation || '-'}</span>
                    </div>
                  </div>
                  {survey.networkNotes && (
                    <div className="pt-2 border-t border-slate-800 text-slate-400 text-[11px]">
                      Catatan: &ldquo;{survey.networkNotes}&rdquo;
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 4: SURVEY PHOTOS GALLERY */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-cyan-400" />
                  Foto Dokumentasi Lapangan ({survey.photos?.length || 0})
                </h4>

                {survey.photos && survey.photos.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {survey.photos.map((photo) => (
                      <div
                        key={photo.id}
                        onClick={() => setZoomedPhotoId(photo.id)}
                        className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden cursor-pointer hover:border-cyan-500 transition-all group"
                      >
                        <div className="relative aspect-video bg-slate-900 overflow-hidden">
                          <AuthenticatedImage
                            photoId={photo.id}
                            alt={photo.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute top-1.5 left-1.5">
                            <Badge className="bg-slate-950/80 text-cyan-300 text-[9px] border-slate-700">
                              {photo.category}
                            </Badge>
                          </div>
                        </div>
                        <div className="p-2.5">
                          <div className="font-bold text-xs text-white truncate">{photo.title}</div>
                          {photo.caption && (
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">{photo.caption}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 border border-dashed border-slate-800 rounded-2xl text-center p-4 text-xs text-slate-500">
                    Tidak ada foto dokumentasi yang diunggah.
                  </div>
                )}
              </div>

              {/* SECTION 5: AUDIT TRAIL HISTORY */}
              {survey.history && survey.history.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-slate-500" />
                    Riwayat Status Survei Lapangan
                  </h4>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {survey.history.map((h) => (
                      <div
                        key={h.id}
                        className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 text-[11px] flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-cyan-400 font-bold">{h.newStatus}</span>
                          <span className="text-slate-400">• {h.actionNote}</span>
                        </div>
                        <span className="text-slate-500 text-[10px]">
                          {new Date(h.createdAt).toLocaleString('id-ID')} ({h.actorRole})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* REVISION FORM (If Super Admin clicked "Minta Perbaikan") */}
              {showRevisionForm && (
                <form
                  onSubmit={handleRequestRevision}
                  className="p-4 bg-rose-950/30 border border-rose-800/80 rounded-2xl space-y-3 text-xs animate-in fade-in"
                >
                  <div className="font-bold text-rose-300 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    Formulir Permintaan Perbaikan Survei ke Teknisi
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Alasan / Instruksi Perbaikan (Minimal 5 Karakter) <span className="text-rose-400">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={revisionReason}
                      onChange={(e) => setRevisionReason(e.target.value)}
                      placeholder="Contoh: Foto MCB utama buram; mohon ukur ulang tegangan pada lantai 2."
                      className="w-full text-xs px-3 py-2 border border-rose-900 rounded-xl bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setShowRevisionForm(false)}
                      className="text-xs border-slate-700 text-slate-300 h-8"
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={requestingRevision || revisionReason.trim().length < 5}
                      className="text-xs bg-rose-600 hover:bg-rose-500 text-white font-bold h-8"
                    >
                      {requestingRevision ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                      ) : null}
                      Kirim Instruksi Revisi
                    </Button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs border-slate-700 text-slate-300 hover:bg-slate-800 font-bold"
          >
            Tutup
          </Button>

          {survey?.status === 'SUBMITTED' && !showRevisionForm && (
            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRevisionForm(true)}
                className="text-xs border-amber-700/80 text-amber-300 hover:bg-amber-950/40 font-bold h-9"
              >
                <ShieldAlert className="w-3.5 h-3.5 mr-1.5" />
                Minta Perbaikan
              </Button>

              <Button
                size="sm"
                disabled={verifying}
                onClick={handleVerify}
                className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-9 flex items-center gap-1.5 shadow-md shadow-emerald-900/30"
              >
                {verifying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                <span>Verifikasi &amp; Buat Properti</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Zoom Photo Lightbox Modal */}
      {zoomedPhotoId && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm cursor-pointer"
          onClick={() => setZoomedPhotoId(null)}
        >
          <div className="max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl relative" onClick={(e) => e.stopPropagation()}>
            <AuthenticatedImage
              photoId={zoomedPhotoId}
              alt="Foto Zoom"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl"
            />
            <button
              type="button"
              onClick={() => setZoomedPhotoId(null)}
              className="absolute top-3 right-3 p-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
