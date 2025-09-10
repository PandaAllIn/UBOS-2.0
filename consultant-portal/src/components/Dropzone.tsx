import { useCallback, useState } from 'react';
import { useAppStore } from '@store/useAppStore';

type Props = {
  onFilesAccepted?: (files: File[]) => void;
};

function Dropzone({ onFilesAccepted }: Props) {
  const setFiles = useAppStore((s) => s.setFiles);
  const [isDragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      setError(null);
      if (!fileList || fileList.length === 0) return;
      const files = Array.from(fileList);
      const uploaded = files.map((f) => ({ name: f.name, size: f.size, type: f.type }));
      setFiles(uploaded);
      onFilesAccepted?.(files);
    },
    [onFilesAccepted, setFiles]
  );

  return (
    <div>
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging ? 'border-eufm-primary bg-sky-50' : 'border-gray-300 bg-white'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          try {
            handleFiles(e.dataTransfer.files);
          } catch (err) {
            setError('Failed to process dropped files.');
          }
        }}
      >
        <p className="mb-3 text-gray-700">Drag & drop documents here</p>
        <p className="text-xs text-gray-500 mb-4">PDF, DOCX, or TXT. Max 10MB each.</p>
        <label className="inline-block">
          <span className="px-4 py-2 bg-eufm-primary text-white rounded cursor-pointer hover:bg-sky-600">Browse files</span>
          <input
            type="file"
            className="hidden"
            multiple
            onChange={(e) => {
              try {
                handleFiles(e.target.files);
                e.currentTarget.value = '';
              } catch (err) {
                setError('Failed to process selected files.');
              }
            }}
          />
        </label>
      </div>
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </div>
  );
}

export default Dropzone;

