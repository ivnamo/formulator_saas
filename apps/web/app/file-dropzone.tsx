"use client";

import { Upload } from "lucide-react";
import { useRef, useState } from "react";

type FileDropzoneProps = {
  accept: string;
  disabled?: boolean;
  fileName?: string;
  helper: string;
  label: string;
  onFile: (file: File | null) => void | Promise<void>;
};

export function FileDropzone({
  accept,
  disabled = false,
  fileName,
  helper,
  label,
  onFile,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const selectFile = (file: File | null) => {
    setIsDragging(false);
    void onFile(file);
  };

  return (
    <label
      className="fileDropzone"
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      data-dragging={isDragging}
      data-disabled={disabled}
      onKeyDown={(event) => {
        if (disabled || (event.key !== "Enter" && event.key !== " ")) {
          return;
        }
        event.preventDefault();
        inputRef.current?.click();
      }}
      onDragEnter={(event) => {
        event.preventDefault();
        if (!disabled) {
          setIsDragging(true);
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setIsDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        if (disabled) {
          setIsDragging(false);
          return;
        }
        selectFile(event.dataTransfer.files?.[0] ?? null);
      }}
    >
      <span className="fileDropzoneLabel">{label}</span>
      <input
        ref={inputRef}
        className="fileDropzoneInput"
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={(event) => {
          selectFile(event.target.files?.[0] ?? null);
          event.currentTarget.value = "";
        }}
      />
      <span className="fileDropzoneBox">
        <Upload size={18} />
        <strong>{fileName || "Arrastra aqui o pincha para abrir"}</strong>
        <small>{helper}</small>
      </span>
    </label>
  );
}
