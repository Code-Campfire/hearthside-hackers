import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface ReceiptUploaderProps {
  onFileSelected: (file: File) => void;
  isProcessing: boolean;
}

export function ReceiptUploader({ onFileSelected, isProcessing }: ReceiptUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        onFileSelected(file);
      }
    },
    [onFileSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isProcessing,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />

        {preview ? (
          <div className="space-y-4">
            <img
              src={preview}
              alt="Receipt preview"
              className="max-h-64 mx-auto rounded"
            />
            {!isProcessing && (
              <p className="text-sm text-gray-600">
                Drop a different image or click to change
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-4xl">📄</div>
            <p className="text-lg font-semibold text-gray-700">
              {isDragActive ? 'Drop receipt here' : 'Upload Receipt'}
            </p>
            <p className="text-sm text-gray-500">
              Drag & drop or click to select
            </p>
            <p className="text-xs text-gray-400">
              JPG, PNG, or PDF (max 10MB)
            </p>
          </div>
        )}
      </div>

      {isProcessing && (
        <div className="flex items-center justify-center space-x-2 text-blue-600">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span>Analyzing receipt...</span>
        </div>
      )}
    </div>
  );
}
