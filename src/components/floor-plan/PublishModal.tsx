import React, { useState, useEffect } from 'react';
import {
  X,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Send,
  Eye,
} from 'lucide-react';
import { PublishValidationResult } from '../../types/device';
import { publishApi } from '../../services/publish.api';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface PublishModalProps {
  houseId: string;
  isOpen: boolean;
  onClose: () => void;
  onStatusChanged: () => void;
}

export const PublishModal: React.FC<PublishModalProps> = ({
  houseId,
  isOpen,
  onClose,
  onStatusChanged,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [statusData, setStatusData] = useState<PublishValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await publishApi.getPublishStatus(houseId);
      setStatusData(res);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat status publikasi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && houseId) {
      fetchStatus();
    }
  }, [isOpen, houseId]);

  if (!isOpen) return null;

  const handlePublish = async () => {
    try {
      setActionLoading(true);
      await publishApi.publishHouse(houseId);
      await fetchStatus();
      onStatusChanged();
    } catch (err: any) {
      alert(err.message || 'Gagal mempublikasikan dashboard');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetPreview = async () => {
    try {
      setActionLoading(true);
      await publishApi.previewHouse(houseId);
      await fetchStatus();
      onStatusChanged();
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah ke preview');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnpublish = async () => {
    if (!window.confirm('Kembalikan denah ke status DRAFT? Client tidak akan dapat mengakses dashboard hingga dipublikasikan kembali.')) {
      return;
    }
    try {
      setActionLoading(true);
      await publishApi.unpublishHouse(houseId);
      await fetchStatus();
      onStatusChanged();
    } catch (err: any) {
      alert(err.message || 'Gagal unpublish dashboard');
    } finally {
      setActionLoading(false);
    }
  };

  const isPublished = statusData?.publishStatus === 'PUBLISHED';
  const isPreview = statusData?.publishStatus === 'PREVIEW';
  const isDraft = !statusData?.publishStatus || statusData?.publishStatus === 'DRAFT';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-purple-50 text-purple-700">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#181829]">
                Publikasi Dashboard Smart Home
              </h2>
              <p className="text-xs text-[#71758E]">
                Kelola siklus hidup dashboard dari Draft ke Published
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Current Status Pill Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Status Saat Ini
              </span>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant={
                    isPublished ? 'success' : isPreview ? 'purple' : 'default'
                  }
                  className="text-xs font-mono font-bold"
                >
                  {statusData?.publishStatus || 'DRAFT'}
                </Badge>
                {isPublished && statusData?.publishedAt && (
                  <span className="text-xs text-[#71758E]">
                    Dipublikasikan: {new Date(statusData.publishedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-500 block">Total Perangkat</span>
              <span className="text-base font-mono font-black text-[#181829]">
                {statusData?.totalDevices ?? 0}
              </span>
            </div>
          </div>

          {/* Validation Checklist */}
          {loading ? (
            <div className="text-center py-6 text-xs text-slate-400">
              Memeriksa kelengkapan konfigurasi...
            </div>
          ) : error ? (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
              {error}
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-[#181829] uppercase tracking-wider">
                Checklist Validasi Publikasi
              </h3>

              <div className="space-y-2">
                {/* 1. Gambar denah */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="font-medium text-[#181829]">
                    1. Gambar latar arsitektur denah terpasang
                  </span>
                  {statusData?.checks.hasFloorPlanImage ? (
                    <span className="flex items-center gap-1 font-bold text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" /> Lengkap
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 font-bold text-rose-600">
                      <AlertCircle className="w-4 h-4" /> Belum ada
                    </span>
                  )}
                </div>

                {/* 2. Minimal 1 perangkat */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="font-medium text-[#181829]">
                    2. Minimal 1 perangkat IoT ditempatkan
                  </span>
                  {statusData?.checks.hasDevices ? (
                    <span className="flex items-center gap-1 font-bold text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" /> Lengkap ({statusData.totalDevices})
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 font-bold text-rose-600">
                      <AlertCircle className="w-4 h-4" /> Belum ada
                    </span>
                  )}
                </div>

                {/* 3. Tipe perangkat valid */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="font-medium text-[#181829]">
                    3. Seluruh perangkat memiliki nama & tipe valid
                  </span>
                  {statusData?.checks.allDevicesHaveValidType ? (
                    <span className="flex items-center gap-1 font-bold text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" /> Valid
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 font-bold text-rose-600">
                      <AlertCircle className="w-4 h-4" /> Belum Valid
                    </span>
                  )}
                </div>
              </div>

              {/* Validation Errors */}
              {statusData?.validationErrors && statusData.validationErrors.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                    <AlertCircle className="w-4 h-4" />
                    <span>Harus diperbaiki sebelum dapat dipublikasikan:</span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-rose-700 space-y-0.5">
                    {statusData.validationErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings */}
              {statusData?.warnings && statusData.warnings.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Catatan Informasi:</span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-amber-700 space-y-0.5">
                    {statusData.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          {isPublished ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnpublish}
              disabled={actionLoading}
              className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Unpublish (Jadikan Draft)</span>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSetPreview}
              disabled={actionLoading}
              className="text-xs gap-1.5 text-purple-700 hover:bg-purple-100"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Jadikan Preview</span>
            </Button>
          )}

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose} className="text-xs">
              Tutup
            </Button>

            {!isPublished && (
              <Button
                variant="purple"
                size="sm"
                onClick={handlePublish}
                disabled={actionLoading || !statusData?.canPublish}
                className="text-xs gap-1.5 shadow-md shadow-purple-500/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publikasikan ke Client</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
