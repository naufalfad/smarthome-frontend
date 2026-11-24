import React, { useState, useEffect } from 'react';
import {
  X,
  Home,
  Layers,
  Zap,
  Wifi,
  Camera,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Calendar,
  Save,
  Send,
  Info,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { AuthenticatedImage } from '../common/AuthenticatedImage';
import { fieldSurveyApi } from '../../services/field-survey.api';
import {
  FieldSurvey,
  FieldSurveyStatus,
  SurveyPhotoCategory,
  RoomType,
  SurveyRoomItemInput,
  SaveSurveyDraftPayload,
} from '../../types/field-survey';
import { TechnicianWorkAssignment } from '../../types/service-order';

interface TechnicianSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: TechnicianWorkAssignment;
  onSurveySubmitted?: () => void;
}

export const TechnicianSurveyModal: React.FC<TechnicianSurveyModalProps> = ({
  isOpen,
  onClose,
  assignment,
  onSurveySubmitted,
}) => {
  const [activeTab, setActiveTab] = useState<'BUILDING' | 'ROOMS' | 'AUDIT' | 'PHOTOS'>('BUILDING');
  const [survey, setSurvey] = useState<FieldSurvey | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [savingSchedule, setSavingSchedule] = useState<boolean>(false);

  // Building details
  const [buildingType, setBuildingType] = useState<string>('Rumah Tinggal');
  const [totalFloors, setTotalFloors] = useState<number>(1);
  const [estimatedAreaM2, setEstimatedAreaM2] = useState<string>('');
  const [wallStructureMaterial, setWallStructureMaterial] = useState<string>('Bata Merah');
  const [ceilingHeightMeters, setCeilingHeightMeters] = useState<string>('3.0');

  // Rooms list
  const [rooms, setRooms] = useState<SurveyRoomItemInput[]>([]);

  // Electrical audit
  const [mainBreakerAmps, setMainBreakerAmps] = useState<string>('');
  const [mainsVoltageVolts, setMainsVoltageVolts] = useState<string>('220.0');
  const [groundingStatus, setGroundingStatus] = useState<string>('Baik');
  const [hasSubPanels, setHasSubPanels] = useState<boolean>(false);
  const [subPanelLocations, setSubPanelLocations] = useState<string>('');
  const [electricalNotes, setElectricalNotes] = useState<string>('');

  // Network audit
  const [ispProvider, setIspProvider] = useState<string>('');
  const [connectionType, setConnectionType] = useState<string>('Fiber Optik');
  const [measuredDownloadSpeed, setMeasuredDownloadSpeed] = useState<string>('');
  const [measuredUploadSpeed, setMeasuredUploadSpeed] = useState<string>('');
  const [mainRouterLocation, setMainRouterLocation] = useState<string>('');
  const [wifiCoverageRating, setWifiCoverageRating] = useState<string>('Cukup');
  const [networkNotes, setNetworkNotes] = useState<string>('');

  // Notes
  const [customerSpecialRequests, setCustomerSpecialRequests] = useState<string>('');
  const [installationObstacles, setInstallationObstacles] = useState<string>('');
  const [technicianNotes, setTechnicianNotes] = useState<string>('');

  // Photo upload form
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [photoCategory, setPhotoCategory] = useState<SurveyPhotoCategory>('MAIN_PANEL');
  const [photoTitle, setPhotoTitle] = useState<string>('');
  const [photoCaption, setPhotoCaption] = useState<string>('');
  const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);

  // Load Survey
  useEffect(() => {
    if (!isOpen || !assignment) return;

    const loadSurveyData = async () => {
      try {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        const data = await fieldSurveyApi.getOrCreateSurvey(assignment.assignmentId);
        setSurvey(data);

        // Populate form fields from survey
        if (data.scheduledDate) {
          setScheduledDate(new Date(data.scheduledDate).toISOString().slice(0, 16));
        } else {
          setScheduledDate('');
        }

        setBuildingType(data.buildingType || 'Rumah Tinggal');
        setTotalFloors(data.totalFloors || 1);
        setEstimatedAreaM2(
          data.estimatedAreaM2 !== null && data.estimatedAreaM2 !== undefined
            ? String(data.estimatedAreaM2)
            : assignment.serviceOrder.approximateAreaM2
            ? String(assignment.serviceOrder.approximateAreaM2)
            : ''
        );
        setWallStructureMaterial(data.wallStructureMaterial || 'Bata Merah');
        setCeilingHeightMeters(
          data.ceilingHeightMeters !== null && data.ceilingHeightMeters !== undefined
            ? String(data.ceilingHeightMeters)
            : '3.0'
        );

        // Rooms
        if (data.rooms && data.rooms.length > 0) {
          setRooms(
            data.rooms.map((r) => ({
              id: r.id,
              roomName: r.roomName,
              roomType: r.roomType,
              floorLevel: r.floorLevel,
              lengthMeters: r.lengthMeters !== null ? String(r.lengthMeters) : '',
              widthMeters: r.widthMeters !== null ? String(r.widthMeters) : '',
              heightMeters: r.heightMeters !== null ? String(r.heightMeters) : '',
              wallOutletsCount: r.wallOutletsCount,
              lightSwitchesCount: r.lightSwitchesCount,
              existingAcUnits: r.existingAcUnits,
              acUnitModel: r.acUnitModel || '',
              notes: r.notes || '',
              displayOrder: r.displayOrder,
            }))
          );
        } else {
          // Initialize with default Living Room
          setRooms([
            {
              roomName: 'Ruang Tamu',
              roomType: 'LIVING_ROOM' as RoomType,
              floorLevel: 1,
              lengthMeters: '4.0',
              widthMeters: '3.5',
              heightMeters: '3.0',
              wallOutletsCount: 2,
              lightSwitchesCount: 1,
              existingAcUnits: 0,
              acUnitModel: '',
              notes: '',
              displayOrder: 0,
            },
          ]);
        }

        // Electrical
        setMainBreakerAmps(data.mainBreakerAmps ? String(data.mainBreakerAmps) : '16');
        setMainsVoltageVolts(
          data.mainsVoltageVolts !== null && data.mainsVoltageVolts !== undefined
            ? String(data.mainsVoltageVolts)
            : '220.0'
        );
        setGroundingStatus(data.groundingStatus || 'Baik');
        setHasSubPanels(Boolean(data.hasSubPanels));
        setSubPanelLocations(data.subPanelLocations || '');
        setElectricalNotes(data.electricalNotes || '');

        // Network
        setIspProvider(data.ispProvider || '');
        setConnectionType(data.connectionType || 'Fiber Optik');
        setMeasuredDownloadSpeed(
          data.measuredDownloadSpeed !== null && data.measuredDownloadSpeed !== undefined
            ? String(data.measuredDownloadSpeed)
            : ''
        );
        setMeasuredUploadSpeed(
          data.measuredUploadSpeed !== null && data.measuredUploadSpeed !== undefined
            ? String(data.measuredUploadSpeed)
            : ''
        );
        setMainRouterLocation(data.mainRouterLocation || '');
        setWifiCoverageRating(data.wifiCoverageRating || 'Cukup');
        setNetworkNotes(data.networkNotes || '');

        // Qualitative Notes
        setCustomerSpecialRequests(data.customerSpecialRequests || '');
        setInstallationObstacles(data.installationObstacles || '');
        setTechnicianNotes(data.technicianNotes || '');
      } catch (err: any) {
        setError(err?.message || 'Gagal memuat formulir survei');
      } finally {
        setLoading(false);
      }
    };

    loadSurveyData();
  }, [isOpen, assignment]);

  if (!isOpen) return null;

  const isEditable =
    survey?.status === 'DRAFT' || survey?.status === 'REVISION_REQUIRED';

  const maxPackageRooms =
    survey?.packageSnapshot?.maxRooms ||
    assignment.serviceOrder.packageSnapshot?.maxRooms ||
    null;

  // Add Room handler
  const handleAddRoom = () => {
    setRooms((prev) => [
      ...prev,
      {
        roomName: `Ruangan ${prev.length + 1}`,
        roomType: 'BEDROOM' as RoomType,
        floorLevel: 1,
        lengthMeters: '3.0',
        widthMeters: '3.0',
        heightMeters: '3.0',
        wallOutletsCount: 2,
        lightSwitchesCount: 1,
        existingAcUnits: 0,
        acUnitModel: '',
        notes: '',
        displayOrder: prev.length,
      },
    ]);
  };

  // Remove Room handler
  const handleRemoveRoom = (index: number) => {
    setRooms((prev) => prev.filter((_, i) => i !== index));
  };

  // Update Room field
  const handleUpdateRoom = (index: number, field: keyof SurveyRoomItemInput, val: any) => {
    setRooms((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  // Save Schedule Visit
  const handleSaveSchedule = async () => {
    if (!scheduledDate) {
      setError('Pilih tanggal dan jam jadwal kunjungan survei');
      return;
    }
    try {
      setSavingSchedule(true);
      setError(null);
      const updated = await fieldSurveyApi.scheduleSurveyVisit(
        assignment.assignmentId,
        new Date(scheduledDate).toISOString()
      );
      setSurvey((prev) => (prev ? { ...prev, scheduledDate: updated.scheduledDate } : updated));
      setSuccessMessage('Jadwal kunjungan survei berhasil diperbarui.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Gagal memperbarui jadwal kunjungan');
    } finally {
      setSavingSchedule(false);
    }
  };

  // Collect Payload
  const getDraftPayload = (): SaveSurveyDraftPayload => ({
    buildingType,
    totalFloors: Number(totalFloors) || 1,
    estimatedAreaM2: estimatedAreaM2 ? Number(estimatedAreaM2) : null,
    wallStructureMaterial,
    ceilingHeightMeters: ceilingHeightMeters ? Number(ceilingHeightMeters) : null,
    mainBreakerAmps: mainBreakerAmps ? Number(mainBreakerAmps) : null,
    mainsVoltageVolts: mainsVoltageVolts ? Number(mainsVoltageVolts) : null,
    groundingStatus,
    hasSubPanels,
    subPanelLocations: hasSubPanels ? subPanelLocations : null,
    electricalNotes,
    ispProvider,
    connectionType,
    measuredDownloadSpeed: measuredDownloadSpeed ? Number(measuredDownloadSpeed) : null,
    measuredUploadSpeed: measuredUploadSpeed ? Number(measuredUploadSpeed) : null,
    mainRouterLocation,
    wifiCoverageRating,
    networkNotes,
    customerSpecialRequests,
    installationObstacles,
    technicianNotes,
    rooms: rooms.map((r, i) => ({
      roomName: r.roomName.trim(),
      roomType: r.roomType,
      floorLevel: Number(r.floorLevel) || 1,
      lengthMeters: r.lengthMeters ? Number(r.lengthMeters) : null,
      widthMeters: r.widthMeters ? Number(r.widthMeters) : null,
      heightMeters: r.heightMeters ? Number(r.heightMeters) : null,
      wallOutletsCount: Number(r.wallOutletsCount) || 0,
      lightSwitchesCount: Number(r.lightSwitchesCount) || 0,
      existingAcUnits: Number(r.existingAcUnits) || 0,
      acUnitModel: r.acUnitModel || null,
      notes: r.notes || null,
      displayOrder: i,
    })),
  });

  // Save Draft
  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);
      const payload = getDraftPayload();
      const updated = await fieldSurveyApi.saveSurveyDraft(assignment.assignmentId, payload);
      setSurvey(updated);
      setSuccessMessage('Draf survei berhasil disimpan.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan draf survei');
    } finally {
      setSaving(false);
    }
  };

  // Upload Photo
  const handleUploadPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPhotoFile) {
      setPhotoUploadError('Pilih berkas foto terlebih dahulu');
      return;
    }

    try {
      setUploadingPhoto(true);
      setPhotoUploadError(null);
      const newPhoto = await fieldSurveyApi.uploadSurveyPhoto(
        assignment.assignmentId,
        selectedPhotoFile,
        photoCategory,
        photoTitle,
        photoCaption
      );

      // Append to survey photos state
      setSurvey((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          photos: [newPhoto, ...(prev.photos || [])],
        };
      });

      setSelectedPhotoFile(null);
      setPhotoTitle('');
      setPhotoCaption('');
      setSuccessMessage('Foto survei berhasil diunggah.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setPhotoUploadError(err?.message || 'Gagal mengunggah foto survei');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Delete Photo
  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus foto ini?')) return;
    try {
      await fieldSurveyApi.deleteSurveyPhoto(assignment.assignmentId, photoId);
      setSurvey((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          photos: prev.photos.filter((p) => p.id !== photoId),
        };
      });
      setSuccessMessage('Foto berhasil dihapus.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Gagal menghapus foto survei');
    }
  };

  // Submit Completed Survey
  const handleSubmitSurvey = async () => {
    // Client-side validations
    if (rooms.length === 0) {
      setError('Minimal 1 ruangan wajib diinventarisasi sebelum mengirim survei.');
      setActiveTab('ROOMS');
      return;
    }

    if (!mainBreakerAmps || !mainsVoltageVolts) {
      setError('Spesifikasi kelistrikan (Kapasitas MCB dan Tegangan Listrik) wajib diisi.');
      setActiveTab('AUDIT');
      return;
    }

    if (!survey?.photos || survey.photos.length === 0) {
      setError('Minimal 1 foto dokumentasi survei wajib diunggah.');
      setActiveTab('PHOTOS');
      return;
    }

    const confirmSubmit = confirm(
      'Apakah Anda yakin data survei lapangan sudah lengkap dan siap diajukan untuk verifikasi Super Admin?'
    );
    if (!confirmSubmit) return;

    try {
      setSubmitting(true);
      setError(null);
      // Ensure draft is saved first
      await fieldSurveyApi.saveSurveyDraft(assignment.assignmentId, getDraftPayload());
      // Submit
      const submitted = await fieldSurveyApi.submitSurvey(assignment.assignmentId);
      setSurvey(submitted);
      setSuccessMessage('Survei lapangan berhasil diajukan untuk verifikasi!');
      if (onSurveySubmitted) onSurveySubmitted();
    } catch (err: any) {
      setError(err?.message || 'Gagal mengajukan hasil survei');
    } finally {
      setSubmitting(false);
    }
  };

  // Status Badge Helper
  const renderStatusBadge = (status?: FieldSurveyStatus) => {
    switch (status) {
      case 'DRAFT':
        return (
          <Badge className="bg-slate-100 text-slate-700 border-slate-300 text-xs font-bold">
            Draf Survei
          </Badge>
        );
      case 'SUBMITTED':
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-300 text-xs font-bold flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Menunggu Verifikasi Admin
          </Badge>
        );
      case 'REVISION_REQUIRED':
        return (
          <Badge className="bg-rose-50 text-rose-700 border-rose-300 text-xs font-bold flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Perlu Perbaikan (Revisi)
          </Badge>
        );
      case 'VERIFIED':
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 text-xs font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Terverifikasi (Properti Dibuat)
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-black text-indigo-600">
                {assignment.serviceOrder.orderNumber}
              </span>
              {renderStatusBadge(survey?.status)}
            </div>
            <h3 className="text-lg font-black text-slate-900 mt-1">
              Survei Lapangan: {assignment.serviceOrder.propertyName}
            </h3>
            <p className="text-xs text-slate-500">
              Paket: <span className="font-bold">{assignment.serviceOrder.packageName}</span> •{' '}
              {assignment.serviceOrder.propertyAddress}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMessage && (
          <div className="mx-6 mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Super Admin Revision Alert */}
        {survey?.status === 'REVISION_REQUIRED' && survey.revisionReason && (
          <div className="mx-6 mt-4 p-4 bg-amber-50/90 border border-amber-300 rounded-2xl text-xs text-amber-900 space-y-1.5">
            <div className="font-black flex items-center gap-1.5 text-amber-800 text-sm">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              Catatan Permintaan Perbaikan dari Super Admin:
            </div>
            <p className="pl-5 leading-relaxed font-semibold text-slate-800 bg-white/70 p-2.5 rounded-xl border border-amber-200">
              {survey.revisionReason}
            </p>
            {survey.adminReviewNotes && (
              <p className="pl-5 text-slate-600 text-[11px] italic">
                Catatan review tambahan: &ldquo;{survey.adminReviewNotes}&rdquo;
              </p>
            )}
          </div>
        )}

        {/* Schedule Visit Strip */}
        <div className="px-6 py-3 bg-indigo-50/50 border-b border-indigo-100/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-indigo-900 font-bold">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>Jadwal Kunjungan Lapangan:</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="datetime-local"
              disabled={!isEditable}
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="px-3 py-1.5 text-xs border border-indigo-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium"
            />
            {isEditable && (
              <Button
                size="sm"
                variant="outline"
                disabled={savingSchedule}
                onClick={handleSaveSchedule}
                className="text-xs h-8 border-indigo-300 text-indigo-700 hover:bg-indigo-100/50 font-bold"
              >
                {savingSchedule ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Simpan Jadwal'}
              </Button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 flex items-center gap-2 border-b border-slate-200 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('BUILDING')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'BUILDING'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Home className="w-4 h-4" />
            Struktur Bangunan
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ROOMS')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'ROOMS'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            Inventaris Ruangan ({rooms.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('AUDIT')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'AUDIT'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Zap className="w-4 h-4" />
            Audit Listrik & Jaringan
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PHOTOS')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'PHOTOS'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Camera className="w-4 h-4" />
            Dokumentasi Foto ({survey?.photos?.length || 0})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-xs font-semibold">Memuat data survei...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: BUILDING STRUCTURE */}
              {activeTab === 'BUILDING' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tipe Bangunan
                      </label>
                      <select
                        disabled={!isEditable}
                        value={buildingType}
                        onChange={(e) => setBuildingType(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="Rumah Tinggal">Rumah Tinggal (Tapak)</option>
                        <option value="Ruko / Shophouse">Ruko / Shophouse</option>
                        <option value="Apartemen / Kondominium">Apartemen / Kondominium</option>
                        <option value="Villa">Villa</option>
                        <option value="Kantor / Komersial">Kantor / Komersial</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Jumlah Lantai
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        disabled={!isEditable}
                        value={totalFloors}
                        onChange={(e) => setTotalFloors(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Estimasi Luas Bangunan (m²)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        disabled={!isEditable}
                        value={estimatedAreaM2}
                        onChange={(e) => setEstimatedAreaM2(e.target.value)}
                        placeholder="Contoh: 120"
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Material Struktur Dinding
                      </label>
                      <select
                        disabled={!isEditable}
                        value={wallStructureMaterial}
                        onChange={(e) => setWallStructureMaterial(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="Bata Merah">Bata Merah</option>
                        <option value="Hebel / Bata Ringan">Hebel / Bata Ringan</option>
                        <option value="Beton Bertulang">Beton Bertulang</option>
                        <option value="Partisi Gypsum / GRC">Partisi Gypsum / GRC</option>
                        <option value="Kayu / Papan">Kayu / Papan</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tinggi Plafon Rata-rata (meter)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        disabled={!isEditable}
                        value={ceilingHeightMeters}
                        onChange={(e) => setCeilingHeightMeters(e.target.value)}
                        placeholder="Contoh: 3.2"
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ROOM INVENTORY */}
              {activeTab === 'ROOMS' && (
                <div className="space-y-4">
                  {/* Quota Counter Strip */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-bold text-slate-800">
                        Total Ruangan Diinventarisasi: <span className="text-indigo-600 font-black">{rooms.length}</span>
                      </span>
                      {maxPackageRooms !== null && (
                        <span className="text-slate-500 ml-2">
                          (Batas Kuota Paket: <span className="font-bold">{maxPackageRooms}</span> ruang)
                        </span>
                      )}
                    </div>
                    {isEditable && (
                      <Button
                        size="sm"
                        onClick={handleAddRoom}
                        className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-8"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Tambah Ruangan
                      </Button>
                    )}
                  </div>

                  {/* Quota Warning Alert */}
                  {maxPackageRooms !== null && rooms.length > maxPackageRooms && (
                    <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
                      <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold">Jumlah Ruangan Melebihi Kuota Paket</div>
                        <p className="text-[11px] text-amber-800 mt-0.5">
                          Paket ini mencakup {maxPackageRooms} ruangan. Saat ini Anda telah mencatat{' '}
                          {rooms.length} ruangan. Super Admin akan mengevaluasi kebutuhan add-on saat verifikasi.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Room Items List */}
                  <div className="space-y-3">
                    {rooms.map((room, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 inline-flex items-center justify-center font-bold text-[11px]">
                              {idx + 1}
                            </span>
                            Informasi Ruangan
                          </span>
                          {isEditable && rooms.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveRoom(idx)}
                              className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                              title="Hapus Ruangan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              Nama Ruangan
                            </label>
                            <input
                              type="text"
                              disabled={!isEditable}
                              value={room.roomName}
                              onChange={(e) => handleUpdateRoom(idx, 'roomName', e.target.value)}
                              placeholder="Contoh: Kamar Tidur Utama"
                              className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              Kategori Ruang
                            </label>
                            <select
                              disabled={!isEditable}
                              value={room.roomType}
                              onChange={(e) => handleUpdateRoom(idx, 'roomType', e.target.value as RoomType)}
                              className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                              <option value="LIVING_ROOM">Ruang Tamu / Keluarga</option>
                              <option value="BEDROOM">Kamar Tidur</option>
                              <option value="KITCHEN">Dapur</option>
                              <option value="DINING_ROOM">Ruang Makan</option>
                              <option value="BATHROOM">Kamar Mandi</option>
                              <option value="WORKSPACE">Ruang Kerja / Kantor</option>
                              <option value="GARAGE">Garasi / Carport</option>
                              <option value="OTHER">Lainnya</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              Tingkat Lantai
                            </label>
                            <input
                              type="number"
                              min="1"
                              max={totalFloors}
                              disabled={!isEditable}
                              value={room.floorLevel}
                              onChange={(e) => handleUpdateRoom(idx, 'floorLevel', parseInt(e.target.value, 10) || 1)}
                              className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              Dimensi: P x L x T (m)
                            </label>
                            <div className="grid grid-cols-3 gap-1">
                              <input
                                type="number"
                                step="0.1"
                                placeholder="P"
                                disabled={!isEditable}
                                value={room.lengthMeters || ''}
                                onChange={(e) => handleUpdateRoom(idx, 'lengthMeters', e.target.value)}
                                className="w-full text-xs px-1.5 py-1.5 border border-slate-300 rounded-lg text-center"
                              />
                              <input
                                type="number"
                                step="0.1"
                                placeholder="L"
                                disabled={!isEditable}
                                value={room.widthMeters || ''}
                                onChange={(e) => handleUpdateRoom(idx, 'widthMeters', e.target.value)}
                                className="w-full text-xs px-1.5 py-1.5 border border-slate-300 rounded-lg text-center"
                              />
                              <input
                                type="number"
                                step="0.1"
                                placeholder="T"
                                disabled={!isEditable}
                                value={room.heightMeters || ''}
                                onChange={(e) => handleUpdateRoom(idx, 'heightMeters', e.target.value)}
                                className="w-full text-xs px-1.5 py-1.5 border border-slate-300 rounded-lg text-center"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              Stop Kontak & Saklar
                            </label>
                            <div className="grid grid-cols-2 gap-1.5">
                              <input
                                type="number"
                                min="0"
                                placeholder="Stop Kontak"
                                disabled={!isEditable}
                                value={room.wallOutletsCount}
                                onChange={(e) => handleUpdateRoom(idx, 'wallOutletsCount', parseInt(e.target.value, 10) || 0)}
                                className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded-lg"
                                title="Jumlah Stop Kontak"
                              />
                              <input
                                type="number"
                                min="0"
                                placeholder="Saklar"
                                disabled={!isEditable}
                                value={room.lightSwitchesCount}
                                onChange={(e) => handleUpdateRoom(idx, 'lightSwitchesCount', parseInt(e.target.value, 10) || 0)}
                                className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded-lg"
                                title="Jumlah Saklar Lampu"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              Unit AC & Model
                            </label>
                            <div className="grid grid-cols-3 gap-1.5">
                              <input
                                type="number"
                                min="0"
                                placeholder="AC"
                                disabled={!isEditable}
                                value={room.existingAcUnits}
                                onChange={(e) => handleUpdateRoom(idx, 'existingAcUnits', parseInt(e.target.value, 10) || 0)}
                                className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded-lg text-center"
                                title="Jumlah AC"
                              />
                              <input
                                type="text"
                                placeholder="Model AC (opsional)"
                                disabled={!isEditable}
                                value={room.acUnitModel || ''}
                                onChange={(e) => handleUpdateRoom(idx, 'acUnitModel', e.target.value)}
                                className="col-span-2 w-full text-xs px-2 py-1.5 border border-slate-300 rounded-lg"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <input
                            type="text"
                            placeholder="Catatan khusus ruangan (posisi outlet, material plafon, kendala penempatan sensor)"
                            disabled={!isEditable}
                            value={room.notes || ''}
                            onChange={(e) => handleUpdateRoom(idx, 'notes', e.target.value)}
                            className="w-full text-[11px] px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50/50"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: ELECTRICAL & NETWORK AUDIT */}
              {activeTab === 'AUDIT' && (
                <div className="space-y-6">
                  {/* Electrical Section */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-600" />
                      Audit Kelistrikan (Wajib untuk Verifikasi)
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Kapasitas MCB Utama (Ampere) <span className="text-rose-500">*</span>
                        </label>
                        <select
                          disabled={!isEditable}
                          value={mainBreakerAmps}
                          onChange={(e) => setMainBreakerAmps(e.target.value)}
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                        >
                          <option value="">Pilih Kapasitas MCB</option>
                          <option value="6">6 A (1.300 VA)</option>
                          <option value="10">10 A (2.200 VA)</option>
                          <option value="16">16 A (3.500 VA)</option>
                          <option value="25">25 A (5.500 VA)</option>
                          <option value="32">32 A (7.700 VA)</option>
                          <option value="40">40 A (8.800 VA)</option>
                          <option value="50">50 A (11.000 VA)</option>
                          <option value="63">63 A (13.800+ VA)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Tegangan Terukur (Volt) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          disabled={!isEditable}
                          value={mainsVoltageVolts}
                          onChange={(e) => setMainsVoltageVolts(e.target.value)}
                          placeholder="Contoh: 220.5"
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Status Sistem Grounding
                        </label>
                        <select
                          disabled={!isEditable}
                          value={groundingStatus}
                          onChange={(e) => setGroundingStatus(e.target.value)}
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="Baik">Baik (&lt; 5 Ohm terukur)</option>
                          <option value="Kurang Baik">Kurang Baik (&gt; 5 Ohm)</option>
                          <option value="Tidak Ada">Tidak Ada / Belum Terpasang</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="hasSubPanels"
                          disabled={!isEditable}
                          checked={hasSubPanels}
                          onChange={(e) => setHasSubPanels(e.target.checked)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor="hasSubPanels" className="text-xs font-bold text-slate-700 cursor-pointer">
                          Memiliki Panel Sekunder / Sub-Panel MCB Tambahan
                        </label>
                      </div>
                      {hasSubPanels && (
                        <input
                          type="text"
                          disabled={!isEditable}
                          value={subPanelLocations}
                          onChange={(e) => setSubPanelLocations(e.target.value)}
                          placeholder="Sebutkan lokasi sub-panel (misal: Lantai 2 lorong belakang)"
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Catatan Teknis Kelistrikan
                      </label>
                      <textarea
                        rows={2}
                        disabled={!isEditable}
                        value={electricalNotes}
                        onChange={(e) => setElectricalNotes(e.target.value)}
                        placeholder="Contoh: Jalur kabel netral tersedia di saklar utama; panel MCB rapi."
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Network Section */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Wifi className="w-4 h-4 text-indigo-600" />
                      Audit Jaringan & Wi-Fi
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Provider Internet (ISP)
                        </label>
                        <input
                          type="text"
                          disabled={!isEditable}
                          value={ispProvider}
                          onChange={(e) => setIspProvider(e.target.value)}
                          placeholder="IndiHome, Biznet, dll"
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Tipe Koneksi
                        </label>
                        <select
                          disabled={!isEditable}
                          value={connectionType}
                          onChange={(e) => setConnectionType(e.target.value)}
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="Fiber Optik">Fiber Optik (FTTH)</option>
                          <option value="Kabel Koaksial">Kabel Koaksial / TV Kabel</option>
                          <option value="Wireless / Radio">Wireless / Radio Microwave</option>
                          <option value="Seluler 4G/5G">Seluler 4G/5G Modem</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Kualitas Sinyal Wi-Fi
                        </label>
                        <select
                          disabled={!isEditable}
                          value={wifiCoverageRating}
                          onChange={(e) => setWifiCoverageRating(e.target.value)}
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="Sangat Baik">Sangat Baik (Menjangkau Seluruh Ruangan)</option>
                          <option value="Cukup">Cukup (Sinyal stabil di lantai 1)</option>
                          <option value="Lemah">Lemah (Banyak Blindspot / Tembok Tebal)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Download Terukur (Mbps)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          disabled={!isEditable}
                          value={measuredDownloadSpeed}
                          onChange={(e) => setMeasuredDownloadSpeed(e.target.value)}
                          placeholder="Misal: 50.5"
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Upload Terukur (Mbps)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          disabled={!isEditable}
                          value={measuredUploadSpeed}
                          onChange={(e) => setMeasuredUploadSpeed(e.target.value)}
                          placeholder="Misal: 25.0"
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Posisi Router Utama
                        </label>
                        <input
                          type="text"
                          disabled={!isEditable}
                          value={mainRouterLocation}
                          onChange={(e) => setMainRouterLocation(e.target.value)}
                          placeholder="Misal: Ruang Kerja Lantai 1"
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Qualitative Notes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Permintaan Khusus Pelanggan
                      </label>
                      <textarea
                        rows={2}
                        disabled={!isEditable}
                        value={customerSpecialRequests}
                        onChange={(e) => setCustomerSpecialRequests(e.target.value)}
                        placeholder="Contoh: Sensor gerak dipasang dekat pintu masuk samping."
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Kendala / Hambatan Instalasi
                      </label>
                      <textarea
                        rows={2}
                        disabled={!isEditable}
                        value={installationObstacles}
                        onChange={(e) => setInstallationObstacles(e.target.value)}
                        placeholder="Contoh: Tidak ada lubang ducting dari lantai 1 ke lantai 2."
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: SURVEY PHOTOS */}
              {activeTab === 'PHOTOS' && (
                <div className="space-y-6">
                  {/* Upload Form */}
                  {isEditable && (
                    <form
                      onSubmit={handleUploadPhoto}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3"
                    >
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-indigo-600" />
                        Unggah Foto Dokumentasi Lapangan
                      </h4>

                      {photoUploadError && (
                        <div className="p-2.5 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-xl">
                          {photoUploadError}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Pilih Berkas Foto (.jpg, .png)
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setSelectedPhotoFile(e.target.files[0]);
                                if (!photoTitle) {
                                  setPhotoTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ''));
                                }
                              }
                            }}
                            className="w-full text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Kategori Foto
                          </label>
                          <select
                            value={photoCategory}
                            onChange={(e) => setPhotoCategory(e.target.value as SurveyPhotoCategory)}
                            className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                          >
                            <option value="MAIN_PANEL">Panel MCB Utama</option>
                            <option value="SUB_PANEL">Sub-Panel / MCB Sekunder</option>
                            <option value="ELECTRICITY_METER">Meteran Listrik PLN</option>
                            <option value="ROUTER_WIFI">Router &amp; Jaringan Wi-Fi</option>
                            <option value="ROOM_OVERVIEW">Kondisi Ruangan</option>
                            <option value="WALL_OUTLET">Stop Kontak / Saklar</option>
                            <option value="CEILING_OBSTACLE">Plafon / Hambatan Teknis</option>
                            <option value="OTHER">Lainnya</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Judul Foto
                          </label>
                          <input
                            type="text"
                            placeholder="Contoh: MCB Box Lantai 1"
                            value={photoTitle}
                            onChange={(e) => setPhotoTitle(e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-1">
                        <input
                          type="text"
                          placeholder="Keterangan singkat / caption foto (opsional)"
                          value={photoCaption}
                          onChange={(e) => setPhotoCaption(e.target.value)}
                          className="flex-1 text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                        />
                        <Button
                          type="submit"
                          size="sm"
                          disabled={uploadingPhoto || !selectedPhotoFile}
                          className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-8 flex-shrink-0"
                        >
                          {uploadingPhoto ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                              Mengunggah...
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5 mr-1" />
                              Unggah Foto
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* Photos Grid */}
                  {survey?.photos && survey.photos.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {survey.photos.map((photo) => (
                        <div
                          key={photo.id}
                          className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between"
                        >
                          <div className="relative aspect-video bg-slate-100 overflow-hidden">
                            <AuthenticatedImage
                              photoId={photo.id}
                              alt={photo.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 left-2">
                              <Badge className="bg-slate-900/80 text-white text-[10px] backdrop-blur-xs">
                                {photo.category}
                              </Badge>
                            </div>
                            {isEditable && (
                              <button
                                type="button"
                                onClick={() => handleDeletePhoto(photo.id)}
                                className="absolute top-2 right-2 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm transition-colors cursor-pointer"
                                title="Hapus Foto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <div className="p-3">
                            <h5 className="font-bold text-xs text-slate-900 truncate">
                              {photo.title}
                            </h5>
                            {photo.caption && (
                              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                                {photo.caption}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 border border-dashed border-slate-300 rounded-2xl text-center p-6 space-y-2">
                      <Camera className="w-10 h-10 text-slate-400 mx-auto" />
                      <h4 className="text-xs font-bold text-slate-700">Belum Ada Foto Dokumentasi</h4>
                      <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                        Minimal 1 foto dokumentasi survei wajib diunggah sebelum survei dapat diajukan ke Super Admin.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs border-slate-200 font-bold"
          >
            Tutup
          </Button>

          {isEditable && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={saving || submitting}
                onClick={handleSaveDraft}
                className="text-xs border-slate-300 font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Simpan Draf</span>
              </Button>

              <Button
                size="sm"
                disabled={saving || submitting}
                onClick={handleSubmitSurvey}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 shadow-xs"
              >
                {submitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Ajukan Survei ke Admin</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
