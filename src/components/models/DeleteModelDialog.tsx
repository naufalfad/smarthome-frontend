import React, { useState } from 'react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { HouseModel } from '../../types/house-model';
import { houseModelApi } from '../../services/house-model.api';
import { AlertTriangle, Loader2 } from 'lucide-react';

export interface DeleteModelDialogProps {
  model: HouseModel | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (deletedId: string) => void;
}

export const DeleteModelDialog: React.FC<DeleteModelDialogProps> = ({
  model,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!model) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await houseModelApi.deleteHouseModel(model.id);
      setIsDeleting(false);
      onSuccess(model.id);
      onClose();
    } catch (err: any) {
      setIsDeleting(false);
      setError(err?.message || 'Failed to delete model');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete 3D House Model"
      description="This action will permanently delete the model from PostgreSQL and storage"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button
            type="button"
            variant="secondary"
            pill
            size="sm"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            pill
            size="sm"
            disabled={isDeleting}
            onClick={handleDelete}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deleting Asset...</span>
              </>
            ) : (
              <span>Confirm Delete</span>
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}

        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <p className="font-bold">Are you sure you want to delete this model?</p>
            <p className="mt-1">
              Model <strong className="underline">{model.name}</strong> ({model.fileName})
              will be permanently removed from disk storage and the database.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

