import { useDropzone } from "react-dropzone";
import { UploadCloud } from "lucide-react";

export default function ImageDropzone({ preview, setPreview, setImage }) {

  const onDrop = (files) => {

    const file = files[0];

    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: { "image/*": [] }
  });

  return (

    <div
      {...getRootProps()}
      className={`
        h-20
        flex items-center justify-center

        rounded-xl
        text-gray-500
        cursor-pointer
        transition

        bg-gray-100 dark:bg-[#141414]

        shadow-[inset_5px_5px_10px_#d1d5db,inset_-5px_-5px_10px_#ffffff]
        dark:shadow-[inset_5px_5px_10px_#050505,inset_-5px_-5px_10px_#1f1f1f]
      `}
    >

      <input {...getInputProps()} />

      {/* CONTENT */}

      <div className="flex flex-col items-center">

        <UploadCloud
          size={22}
          className="mb-1 text-gray-400"
        />

        <p className="text-sm">

          {isDragActive
            ? "Drop the image here..."
            : "Drag & drop product image here"}

        </p>

      </div>


      {/* IMAGE PREVIEW */}

      {preview && (

        <div
          className="
          absolute mt-32
          w-full
          flex justify-center
          "
        >

          <img
            src={preview}
            className="
            h-40
            rounded-xl
            object-cover

            bg-gray-100 dark:bg-[#141414]

            shadow-[inset_5px_5px_10px_#d1d5db,inset_-5px_-5px_10px_#ffffff]
            dark:shadow-[inset_5px_5px_10px_#050505,inset_-5px_-5px_#1f1f1f]
            "
          />

        </div>

      )}

    </div>

  );

}