import React, { useState, useRef } from 'react';
import { UploadCloud, FileCode2, X, AlertCircle, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { formatBytes } from '../../lib/utils';
import { houseModelApi } from '../../services/house-model.api';
import { HouseModel } from '../../types/house-model';

export interface UploadModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (model: HouseModel) => void;
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

export const UploadModelModal: React.FC<UploadModelModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successModel, setSuccessModel] = useState<HouseModel | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setName('');
    setDescription('');
    setSelectedFile(null);
    setUploadProgress(null);
    setIsUploading(false);
    setError(null);
    setSuccessModel(null);
  };

  const handleClose = () => {
    if (isUploading) return;
    resetForm();
    onClose();
  };

  const validateAndSelectFile = (file: File) => {
    setError(null);

    // Validate .glb extension
    if (!file.name.toLowerCase().endsWith('.glb')) {
      setError("Invalid file format. Only binary 3D models with the '.glb' extension are supported.");
      return;
    }

    // Validate file size limit
    if (file.size > MAX_FILE_SIZE) {
      setError(`File size exceeds 100 MB limit (Current: ${formatBytes(file.size)}).`);
      return;
    }

    setSelectedFile(file);

    // Auto-fill model name from filename if empty
    if (!name.trim()) {
      const cleanName = file.name
        .replace(/\.glb$/i, '')
        .replace(/[_-]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      setName(cleanName);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a Model Name');
      return;
    }
    if (!selectedFile) {
      setError('Please select a .glb 3D model file');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const createdModel = await houseModelApi.uploadHouseModel(
        name.trim(),
        description.trim(),
        selectedFile,
        (percent) => {
          setUploadProgress(percent);
        }
      );

      setSuccessModel(createdModel);
      setIsUploading(false);
      onSuccess(createdModel);

      // Auto close after 1.5 seconds on success
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err: any) {
      setIsUploading(false);
      setUploadProgress(null);
      setError(err?.message || 'Failed to upload GLB model');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Upload 3D House Model"
      description="Import a unified .GLB dollhouse model representing the entire residential building"
      footer={
        successModel ? null : (
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button
              type="button"
              variant="secondary"
              pill
              size="sm"
              onClick={handleClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="dark"
              pill
              size="sm"
              disabled={isUploading || !name.trim() || !selectedFile}
              onClick={handleSubmit}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing & Inspecting...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload & Inspect GLB</span>
                </>
              )}
            </Button>
          </div>
        )
      }
    >
      {successModel ? (
        <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-[#181829]">
            Model Uploaded & Inspected!
          </h3>
          <p className="text-xs text-[#71758E] max-w-sm">
            <strong>{successModel.name}</strong> was stored and parsed successfully.
            Detected{' '}
            <span className="font-bold text-[#8B5CF6]">
              {successModel.modelMetadata?.summary.totalNodes || 0} nodes
            </span>{' '}
            and{' '}
            <span className="font-bold text-[#8B5CF6]">
              {successModel.modelMetadata?.summary.totalMeshes || 0} meshes
            </span>
            .
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Upload Failed</p>
                <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {/* Model Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#181829]">
              Model Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Modern Two-Story Villa"
              disabled={isUploading}
              className="w-full px-4 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-[#181829] placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-400/40 transition-all"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#181829]">
              Description <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the architectural layout or floorplan..."
              disabled={isUploading}
              className="w-full px-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-[#181829] placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-400/40 transition-all resize-none"
            />
          </div>

          {/* Dropzone / File Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#181829]">
              3D GLB Dollhouse File <span className="text-rose-500">*</span>
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept=".glb"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {!selectedFile ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-2.5 ${
                  isDragging
                    ? 'border-[#8B5CF6] bg-purple-50/60 scale-[0.99]'
                    : 'border-slate-200 hover:border-purple-300 bg-slate-50/60 hover:bg-slate-50'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-purple-100/70 text-[#8B5CF6] flex items-center justify-center shadow-xs">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#181829]">
                    Click to browse or drag & drop your 3D model
                  </p>
                  <p className="text-[11px] text-[#71758E] mt-0.5">
                    Binary glTF container (<code className="text-[#8B5CF6] font-mono">.glb</code>) up to 100 MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl border border-purple-200 bg-purple-50/50 flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-[#8B5CF6] text-white shrink-0 shadow-xs">
                    <FileCode2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#181829] truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-[#71758E] font-mono">
                      {formatBytes(selectedFile.size)}
                    </p>
                  </div>
                </div>

                {!isUploading && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedFile(null)}
                    className="text-slate-400 hover:text-slate-700 rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#181829] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6] animate-pulse" />
                  {uploadProgress === 100
                    ? 'Executing GLB Scene Graph Inspection...'
                    : 'Uploading GLB asset to server...'}
                </span>
                <span className="font-mono text-[11px] text-[#8B5CF6] font-bold">
                  {uploadProgress || 0}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] transition-all duration-300"
                  style={{ width: `${uploadProgress || 0}%` }}
                />
              </div>
            </div>
          )}
        </form>
      )}
    </Modal>
  );
};

