import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  ImageIcon, 
  X, 
  UploadCloud, 
  CheckCircle, 
  AlertCircle,
  FileImage,
  Eye,
  EyeOff,
  Trash2,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ImagePickerProps {
  onImageSelect: (file: File | null) => void;
  currentImage?: string;
  label?: string;
  description?: string;
  aspectRatio?: 'square' | 'video' | 'banner' | 'portrait' | 'custom';
  className?: string;
  required?: boolean;
  disabled?: boolean;
  maxSizeMB?: number;
  accept?: string;
  showPreview?: boolean;
  clearCurrentImage?: () => void;
  boxClassName?: string; // For custom Tailwind classes
  containerHeight?: string; // For custom height (e.g., "300px", "50vh")
  size?: 'sm' | 'md' | 'lg' | 'xl'; // Predefined sizes
}

const ImagePicker = ({ 
  onImageSelect, 
  currentImage, 
  label = "Upload Image",
  description = "JPG, PNG, or WebP. Max 5MB.",
  aspectRatio = 'square',
  className,
  required = false,
  disabled = false,
  maxSizeMB = 5,
  accept = "image/*",
  showPreview = true,
  clearCurrentImage,
  boxClassName,
  containerHeight,
  size = 'md'
}: ImagePickerProps) => {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string } | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const hasRemovedImage = useRef(false);


  // Update preview when currentImage changes
  useEffect(() => {
    // Reset removal flag when currentImage becomes null/undefined
    if (!currentImage) {
      hasRemovedImage.current = false;
      setPreview(null);
      setFileInfo(null);
    } else if (currentImage && !hasRemovedImage.current) {
      // Only set preview if we haven't removed the image
      setPreview(currentImage);
    }
  }, [currentImage]);

  const validateFile = (file: File): boolean => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, WebP)');
      return false;
    }

    // Validate file size
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return false;
    }

    return true;
  };

  const processFile = (file: File) => {
    setError(null);
    hasRemovedImage.current = false;

    if (!validateFile(file)) {
      return;
    }

    // Simulate upload progress
    setUploading(true);
    setUploadProgress(0);
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          return 100;
        }
        return prev + 20;
      });
    }, 100);

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
    
    // Set file info
    setFileInfo({
      name: file.name.length > 20 ? `${file.name.substring(0, 20)}...` : file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
    });

    // Call parent handler
    onImageSelect(file);

    // Clean up interval
    return () => clearInterval(interval);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    if (disabled || uploading) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      processFile(file);
    }
  }, [disabled, uploading]);

  const removeImage = () => {
    // Revoke object URL to prevent memory leaks
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    
    setPreview(null);
    setFileInfo(null);
    setError(null);
    hasRemovedImage.current = true;
    onImageSelect(null);
    if (clearCurrentImage) {
      clearCurrentImage();
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileSelector = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };


  const sizeClasses = {
    sm: '!max-h-[150px]',
    md: 'min-h-[200px]',
    lg: 'min-h-[250px]',
    xl: 'min-h-[300px]'
  };

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'video': return 'aspect-video';
      case 'banner': return 'aspect-[21/9]';
      case 'portrait': return 'aspect-[3/4]';
      case 'custom': return 'aspect-auto';
      default: return 'aspect-square';
    }
  };

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  return (
    <div className={cn("space-y-0", className)}>
      {(label || description) && (
        <div className="space-y-1 mb-3">
          {label && (
            <Label className="text-sm font-medium">
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </Label>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept={accept}
        disabled={disabled || uploading}
      />

      <Card className={cn(
        "overflow-hidden border-2 transition-all",
        isDragging ? "border-primary bg-primary/5" : "border-dashed",
        preview ? "border-primary/20" : "border-muted",
        disabled && "opacity-50 cursor-not-allowed",
        !preview && "cursor-pointer hover:border-primary/40",
        boxClassName
      )}
      onClick={!preview && !disabled && !uploading ? openFileSelector : undefined}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      >
        <CardContent className="p-4">
          <div 
            className={cn(
              "relative rounded-lg bg-muted/30 flex items-center justify-center overflow-hidden",
              getAspectRatioClass(),
              !preview && sizeClasses[size]
            )}
              style={
              !preview && containerHeight 
                ? { minHeight: containerHeight } 
                : undefined
            }
          >
            {preview ? (
              <>
                <img 
                  src={preview} 
                  alt="Preview" 
                  className="h-full w-full object-contain p-2"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPreviewOpen(true);
                    }}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="h-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage();
                    }}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Remove
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center p-6 text-center">
                {uploading ? (
                  <>
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                    <span className="text-sm font-medium">Uploading...</span>
                    <span className="text-xs mt-1 text-muted-foreground">Please wait</span>
                  </>
                ) : (
                  <>
                    <div className={cn(
                      "h-12 w-12 rounded-full flex items-center justify-center mb-3 transition-colors",
                      isDragging ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      {isDragging ? (
                        <UploadCloud className="h-6 w-6" />
                      ) : (
                        <ImageIcon className="h-6 w-6" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm font-medium">
                        {isDragging ? "Drop image here" : "Click to upload or drag & drop"}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        SVG, PNG, JPG or WebP
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openFileSelector();
                      }}
                      disabled={disabled}
                      className="mt-4 gap-2"
                    >
                      <UploadCloud className="h-3 w-3" />
                      Browse Files
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>

          {uploading && (
            <div className="mt-4 space-y-2">
              <Progress value={uploadProgress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
            </div>
          )}

          {fileInfo && !uploading && preview && (
            <div className="mt-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <FileImage className="h-3 w-3 text-green-500" />
                <span className="font-medium">{fileInfo.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">{fileInfo.size}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    openFileSelector();
                  }}
                  disabled={disabled}
                >
                  <UploadCloud className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive p-2 rounded-md !mt-3">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Full Screen Preview Modal */}
      {isPreviewOpen && preview && (
        <div 
          className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img 
              src={preview} 
              alt="Preview" 
              className="max-h-[70vh] max-w-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 bg-black/50 text-white hover:bg-black/70"
              onClick={() => setIsPreviewOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Controls for when image is selected */}
      {preview && !uploading && (
        <div className='!mt-3'>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openFileSelector}
              disabled={disabled}
              className="gap-2"
            >
              <UploadCloud className="h-3 w-3" />
              Change Image
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPreviewOpen(true)}
              disabled={disabled}
              className="gap-2"
            >
              <Eye className="h-3 w-3" />
              Preview
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={removeImage}
              disabled={disabled}
              className="gap-2"
            >
              <Trash2 className="h-3 w-3" />
              Remove
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImagePicker;