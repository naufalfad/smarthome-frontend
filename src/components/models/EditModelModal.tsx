import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { HouseModel, ModelStatus } from '../../types/house-model';
import { houseModelApi } from '../../services/house-model.api';
import { Loader2, AlertCircle } from 'lucide-react';

export interface EditModelModalProps {
  model: HouseModel | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: HouseModel) => void;
}

export const EditModelModal: React.FC<EditModelModalProps> = ({
  model,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ModelStatus>('DRAFT');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (model) {
      setName(model.name);
      setDescription(model.description || '');
      setStatus(model.status);
      setError(null);
    }
  }, [model]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!model || !name.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const updated = await houseModelApi.updateHouseModel(model.id, {
        name: name.trim(),
        description: description.trim(),
        status,
      });

      setIsSubmitting(false);
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err?.message || 'Failed to update model');
    }
  };

  if (!model) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Model Information"
      description={`Update metadata and lifecycle status for ${model.name}`}
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button
            type="button"
            variant="secondary"
            pill
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="dark"
            pill
            size="sm"
            disabled={isSubmitting || !name.trim()}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#181829]">
            Model Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
            className="w-full px-4 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-[#181829] focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-400/40 transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#181829]">
            Description <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
            className="w-full px-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-[#181829] focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-400/40 transition-all resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#181829]">
            Asset Lifecycle Status
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['DRAFT', 'PUBLISHED', 'ARCHIVED'] as ModelStatus[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  status === s
                    ? 'border-[#8B5CF6] bg-purple-50 text-[#7C3AED] shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-[#71758E] mt-1">
            * Note: Status indicates internal asset readiness in the library.
          </p>
        </div>
      </form>
    </Modal>
  );
};

