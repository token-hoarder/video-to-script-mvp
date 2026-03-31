'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileVideo, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export function UploadZone({ onFileSelect, disabled }: UploadZoneProps) {
  const [file, setFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      onFileSelect(selectedFile);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/mp4': ['.mp4'],
      'video/quicktime': ['.mov'],
    },
    maxFiles: 1,
    disabled: disabled || Boolean(file)
  });

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
  }

  return (
    <Card className={`border-dashed border-2 overflow-hidden transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-zinc-800 bg-zinc-950'} ${file || disabled ? 'opacity-50' : 'hover:border-zinc-600 hover:bg-zinc-900 cursor-pointer'}`}>
      <div {...getRootProps()} className="w-full h-64 flex flex-col items-center justify-center p-6 text-center focus:outline-none relative">
        <input {...getInputProps()} />
        {file ? (
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-zinc-900 rounded-full">
              <FileVideo className="w-10 h-10 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{file.name}</p>
              <p className="text-xs text-zinc-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
            {!disabled && (
              <Button variant="ghost" size="icon" onClick={clearFile} className="absolute top-2 right-2 rounded-full hover:bg-zinc-800 text-zinc-400">
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="p-4 bg-zinc-900 rounded-full mb-4">
              <UploadCloud className={`w-8 h-8 ${isDragActive ? 'text-primary' : 'text-zinc-400'}`} />
            </div>
            <p className="text-sm font-medium text-zinc-300 mb-1">
              {isDragActive ? "Drop video here" : "Drag & drop a video, or click to browse"}
            </p>
            <p className="text-xs text-zinc-500">
              Supports .mp4 and .mov (Max size handling depends on storage limits)
            </p>
          </>
        )}
      </div>
    </Card>
  );
}
