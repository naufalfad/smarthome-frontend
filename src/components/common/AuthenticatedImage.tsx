import React, { useState, useEffect } from 'react';
import { Loader2, ImageOff } from 'lucide-react';
import { fieldSurveyApi } from '../../services/field-survey.api';

interface AuthenticatedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  photoId: string;
  fallbackText?: string;
}

export const AuthenticatedImage: React.FC<AuthenticatedImageProps> = ({
  photoId,
  fallbackText = 'Gagal memuat gambar',
  className = '',
  alt = 'Foto Survei',
  ...rest
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    let url: string | null = null;

    const loadImage = async () => {
      try {
        setLoading(true);
        setError(false);
        const blob = await fieldSurveyApi.fetchPhotoBlob(photoId);
        if (!active) return;
        url = URL.createObjectURL(blob);
        setBlobUrl(url);
      } catch (err) {
        if (!active) return;
        console.error('Failed to load authenticated survey photo:', err);
        setError(true);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadImage();

    return () => {
      active = false;
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [photoId]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 text-slate-400 ${className}`}>
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  if (error || !blobUrl) {
    return (
      <div className={`flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-2 text-center text-xs ${className}`}>
        <ImageOff className="w-5 h-5 mb-1" />
        <span className="text-[10px]">{fallbackText}</span>
      </div>
    );
  }

  return <img src={blobUrl} alt={alt} className={className} {...rest} />;
};
