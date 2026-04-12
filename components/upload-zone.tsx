'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileVideo, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  progress?: number | null; // 0 to 100
}

export function UploadZone({ onFileSelect, disabled, progress }: UploadZoneProps) {
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
    <Card className={`border-dashed border-2 overflow-hidden transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-border bg-card'} ${file || disabled ? 'opacity-50' : 'hover:border-primary/50 hover:bg-muted cursor-pointer'}`}>
      <div {...getRootProps()} className="w-full h-64 flex flex-col items-center justify-center p-6 text-center focus:outline-none relative">
        <input {...getInputProps()} />
        {file ? (
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-muted rounded-full">
              <FileVideo className="w-10 h-10 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>

            {/* Linear Progress Bar */}
            {progress !== undefined && progress !== null && (
               <div className="w-64 max-w-full space-y-2 animate-in fade-in zoom-in duration-300">
                  <div className="flex justify-between text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                     <span>{progress < 100 ? 'Uploading to storage...' : 'Finalizing...'}</span>
                     <span className="tabular-nums">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden border border-border/50">
                     <div 
                        className="h-full bg-primary transition-all duration-300 ease-out shadow-[0_0_8px_rgba(var(--primary),0.4)]"
                        style={{ width: `${progress}%` }}
                     />
                  </div>
               </div>
            )}
            {!disabled && (
              <Button variant="ghost" size="icon" onClick={clearFile} className="absolute top-2 right-2 rounded-full hover:bg-muted text-muted-foreground">
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="p-4 bg-muted rounded-full mb-4">
              <UploadCloud className={`w-8 h-8 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              {isDragActive ? 'Drop video here' : 'Drag & drop a video, or click to browse'}
            </p>
            <p className="text-xs text-muted-foreground">
              Supports .mp4 and .mov (Max size handling depends on storage limits)
            </p>
          </>
        )}
      </div>
    </Card>
  );
}
