import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, Crop, Loader2 } from "lucide-react";
import imageCompression from "browser-image-compression";
import ImageCropModal from "./ImageCropModal";

const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 800,
  useWebWorker: true,
};

export default function ImageDropzone({ preview, setPreview, setImage }) {
  const [cropSrc,     setCropSrc]     = useState(null);
  const [compressing, setCompressing] = useState(false);

  const openCrop = (file) => {
    const url = URL.createObjectURL(file);
    setCropSrc(url);
  };

  const handleCropDone = async (blob, croppedUrl) => {
    setCropSrc(null);
    setCompressing(true);
    try {
      const file       = new File([blob], "product.jpg", { type: "image/jpeg" });
      const compressed = await imageCompression(file, COMPRESSION_OPTIONS);
      setImage(compressed);
      setPreview(URL.createObjectURL(compressed));
    } catch {
      setImage(blob);
      setPreview(croppedUrl);
    } finally {
      setCompressing(false);
    }
  };

  const onDrop = useCallback((files) => {
    const file = files[0];
    if (file) openCrop(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: { "image/*": [] },
  });

  return (
    <>
      <div
        {...getRootProps()}
        className={`
          h-20 flex items-center justify-center rounded-xl
          text-gray-500 cursor-pointer transition
          bg-gray-100 dark:bg-[#141414]
          shadow-[inset_5px_5px_10px_#d1d5db,inset_-5px_-5px_10px_#ffffff]
          dark:shadow-[inset_5px_5px_10px_#050505,inset_-5px_-5px_10px_#1f1f1f]
          ${isDragActive ? "ring-2 ring-blue-400 dark:ring-blue-500" : ""}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-1">
          {compressing ? (
            <>
              <Loader2 size={22} className="text-blue-400 animate-spin"/>
              <p className="text-xs text-blue-500">Compressing…</p>
            </>
          ) : (
            <>
              <UploadCloud size={22} className="text-gray-400"/>
              <p className="text-sm">
                {isDragActive ? "Drop the image here…" : "Drag & drop or click to upload"}
              </p>
              {preview && (
                <p className="text-[11px] text-blue-500 flex items-center gap-1">
                  <Crop size={10}/> Crop & compress on upload
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {cropSrc && (
        <ImageCropModal
          src={cropSrc}
          onDone={handleCropDone}
          onCancel={() => setCropSrc(null)}
        />
      )}
    </>
  );
}
