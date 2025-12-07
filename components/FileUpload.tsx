import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, X, Image as ImageIcon } from 'lucide-react';
import { UploadedFile, FileType } from '../types';

interface FileUploadProps {
  onFileSelect: (file: UploadedFile | null) => void;
  selectedFile: UploadedFile | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, selectedFile }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      const mimeType = file.type;
      
      let type = FileType.NONE;
      if (mimeType.startsWith('image/')) type = FileType.IMAGE;
      else if (mimeType === 'application/pdf') type = FileType.PDF;

      onFileSelect({
        data: base64,
        mimeType,
        type,
        previewUrl: result
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-slate-700 mb-2">
        Upload Medical Record / Scan
      </label>
      
      {!selectedFile ? (
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 ease-in-out text-center cursor-pointer
            ${dragActive ? 'border-medical-500 bg-medical-50' : 'border-slate-300 hover:border-medical-400 hover:bg-slate-50'}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,application/pdf"
            onChange={handleChange}
          />
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="bg-white p-3 rounded-full shadow-sm">
              <UploadCloud className="h-8 w-8 text-medical-600" />
            </div>
            <div className="text-sm text-slate-600">
              <span className="font-semibold text-medical-600">Click to upload</span> or drag and drop
            </div>
            <p className="text-xs text-slate-400">
              Supports: PNG, JPG, PDF (Max 10MB)
            </p>
          </div>
        </div>
      ) : (
        <div className="relative border border-slate-200 rounded-xl p-4 bg-white shadow-sm flex items-center space-x-4">
          <div className="flex-shrink-0 h-16 w-16 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center">
            {selectedFile.type === FileType.IMAGE ? (
              <img src={selectedFile.previewUrl} alt="Preview" className="h-full w-full object-cover" />
            ) : (
              <FileText className="h-8 w-8 text-slate-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              Medical_Document_Upload
            </p>
            <p className="text-xs text-slate-500">
              Ready for analysis
            </p>
          </div>
          <button
            onClick={removeFile}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
};