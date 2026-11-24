import React, { useState, useRef } from 'react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { UploadCloud, Image, AlertCircle, FileCheck, Trash2 } from 'lucide-react';

interface UploadBackgroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
  existingImagePath?: string | null;
  onDelete?: () => Promise<void>;
}

export const UploadBackgroundModal: React.FC<UploadBackgroundModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  existingImagePath,
  onDelete,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setError(null);
      setIsDeleting(false);
    }
  }, [isOpen]);

  const handleFileChange = (file: File) => {
    setError(null);
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!validTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.svg')) {
      setError('Hanya format file PNG, JPG, JPEG, atau SVG yang didukung.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError('Ukuran file maksimal 15 MB.');
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError('Pilih file denah terlebih dahulu.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onUpload(selectedFile);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal mengunggah denah latar belakang.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    const confirmDelete = window.confirm(
      'Apakah Anda yakin ingin menghapus gambar denah pada lantai ini? Objek furnitur & perangkat IoT tetap aman pada posisinya.'
    );
    if (!confirmDelete) return;

    try {
      setIsDeleting(true);
      setError(null);
      await onDelete();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus gambar denah.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingImagePath ? 'Ganti Denah Latar Belakang' : 'Unggah Denah Latar Belakang'}
      description="Unggah gambar arsitektur rumah (PNG/JPG) sebagai referensi visual. Objek yang sudah diletakkan tidak akan terhapus."
      footer={
        <div className="flex items-center justify-between w-full">
          {existingImagePath && onDelete ? (
            <Button
              variant="ghost"
              size="sm"
              pill
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting || isDeleting}
              className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDeleting ? 'Menghapus...' : 'Hapus Denah Ini'}</span>
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" pill onClick={onClose} disabled={isSubmitting || isDeleting}>
              Batal
            </Button>
            <Button
              variant="purple"
              size="sm"
              pill
              onClick={handleSubmit}
              disabled={!selectedFile || isSubmitting || isDeleting}
              className="gap-1.5"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Mengunggah...' : 'Terapkan Denah'}</span>
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 py-2">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all ${
            previewUrl
              ? 'border-purple-300 bg-purple-50/20'
              : 'border-slate-200 hover:border-purple-400 bg-slate-50/50 hover:bg-purple-50/10'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
            accept=".png,.jpg,.jpeg,image/png,image/jpeg"
            className="hidden"
          />

          {previewUrl ? (
            <div className="space-y-3">
              <div className="relative max-h-48 overflow-hidden rounded-2xl border border-purple-200 bg-white shadow-xs">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-auto object-contain max-h-48 mx-auto"
                />
              </div>
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-purple-700">
                <FileCheck className="w-4 h-4" />
                <span>{selectedFile?.name}</span>
                <span className="text-[11px] text-slate-500 font-normal">
                  ({((selectedFile?.size || 0) / (1024 * 1024)).toFixed(2)} MB)
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Klik atau geser gambar lain untuk mengganti</p>
            </div>
          ) : (
            <div className="space-y-2 py-4">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-purple-100/70 text-[#8B5CF6] flex items-center justify-center">
                <UploadCloud className="w-6 h-6" />
              </div>
              <h4 className="text-xs font-bold text-[#181829]">
                Klik untuk memilih file atau seret gambar ke sini
              </h4>
              <p className="text-[11px] text-[#71758E]">
                Format yang didukung: PNG, JPG, JPEG (Maksimal 15 MB)
              </p>
            </div>
          )}
        </div>

        {existingImagePath && !selectedFile && (
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-800 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <Image className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Lantai ini sudah memiliki gambar denah latar belakang.</p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Anda dapat memilih file baru untuk menggantinya, atau menghapusnya jika ingin denah kosong.
                </p>
              </div>
            </div>
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                pill
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting || isDeleting}
                className="shrink-0 text-xs border-rose-300 text-rose-600 hover:bg-rose-50 hover:border-rose-400 gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Denah</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

