import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Camera, Loader2 } from 'lucide-react';
import { useSettings } from '../../../contexts/SettingsContext';
import { useAutoSave } from '../../../hooks/useAutoSave';
import { getInitials, stringToColor } from '../../../lib/gravatar';
import { tw } from '../../../styles/settings';

interface AvatarUploadProps {
  onUploadComplete?: (url: string) => void;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

export function AvatarUpload({ onUploadComplete }: AvatarUploadProps) {
  const { getSetting } = useSettings();
  const { save } = useAutoSave();

  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get user data from settings
  const avatarUrl = getSetting('profile.avatarUrl', '') as string;
  const firstName = getSetting('profile.firstName', '') as string;
  const lastName = getSetting('profile.lastName', '') as string;
  const email = getSetting('profile.email', '') as string;
  const useGravatar = getSetting('profile.useGravatar', false) as boolean;

  const displayUrl = previewUrl || avatarUrl;
  const initials = getInitials(firstName, lastName);
  const bgColor = stringToColor(email || firstName || 'user');

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Please upload a JPG, PNG, or GIF image';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 2MB';
    }
    return null;
  };

  const processFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      // TODO: Upload to Supabase Storage
      // For now, simulate upload and store as data URL
      await new Promise(resolve => setTimeout(resolve, 1000));

      const dataUrl = await new Promise<string>((resolve) => {
        const fr = new FileReader();
        fr.onloadend = () => resolve(fr.result as string);
        fr.readAsDataURL(file);
      });

      // Save avatar URL
      save('profile.avatarUrl', dataUrl, true);
      save('profile.useGravatar', false, true);

      onUploadComplete?.(dataUrl);
    } catch (err) {
      setError('Failed to upload avatar');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }, []);

  const handleRemoveAvatar = () => {
    setPreviewUrl(null);
    save('profile.avatarUrl', '', true);
    setError(null);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex items-start gap-6">
      {/* Avatar Preview */}
      <div className="relative group">
        <div
          className={`w-24 h-24 rounded-full overflow-hidden flex items-center justify-center text-2xl font-semibold text-white ${
            isDragging ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#0f1419]' : ''
          }`}
          style={{ backgroundColor: !displayUrl ? bgColor : undefined }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isUploading ? (
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          ) : displayUrl ? (
            <img
              src={displayUrl}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>

        {/* Overlay on hover */}
        {!isUploading && (
          <button
            onClick={handleClick}
            className="absolute inset-0 w-24 h-24 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
          >
            <Camera className="w-6 h-6 text-white" />
          </button>
        )}

        {/* Remove button */}
        {displayUrl && !isUploading && (
          <button
            onClick={handleRemoveAvatar}
            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        )}
      </div>

      {/* Upload Controls */}
      <div className="flex-1">
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />

        <button
          onClick={handleClick}
          disabled={isUploading}
          className={`${tw.buttonSecondary} inline-flex items-center gap-2`}
        >
          <Upload className="w-4 h-4" />
          {isUploading ? 'Uploading...' : 'Upload Photo'}
        </button>

        <p className="mt-2 text-xs text-gray-500">
          JPG, PNG, or GIF. Max 2MB.
        </p>

        {error && (
          <p className="mt-2 text-xs text-red-400">{error}</p>
        )}
      </div>
    </div>
  );
}

export default AvatarUpload;
