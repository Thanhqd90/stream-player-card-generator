import React, { useRef, useState } from "react";
import { themeClasses } from "../utils/themeClasses";
import {
  compressImageDataUrl,
  getDataUrlSizeKB,
} from "../utils/imageCompression";

interface BackgroundUploaderProps {
  backgroundImage?: string;
  onBackgroundChange: (imageDataUrl: string | undefined) => void;
}

const BackgroundUploader: React.FC<BackgroundUploaderProps> = ({
  backgroundImage,
  onBackgroundChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image file size must be less than 5MB");
      return;
    }

    setIsCompressing(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const originalDataUrl = e.target?.result as string;
        const originalSizeKB = getDataUrlSizeKB(originalDataUrl);

        // Compress the image
        const compressedDataUrl = await compressImageDataUrl(
          originalDataUrl,
          1200, // max width
          1200, // max height
          0.7, // quality (0-1, lower = more compression)
        );

        const compressedSizeKB = getDataUrlSizeKB(compressedDataUrl);
        const compressionRatio = (
          (1 - compressedSizeKB / originalSizeKB) *
          100
        ).toFixed(0);

        console.log(
          `Image compressed: ${originalSizeKB}KB → ${compressedSizeKB}KB (${compressionRatio}% reduction)`,
        );

        onBackgroundChange(compressedDataUrl);
      } catch (error) {
        alert(
          `Failed to compress image: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      } finally {
        setIsCompressing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    onBackgroundChange(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={`${themeClasses.panel} rounded-lg shadow-md p-6`}>
      <h3 className="text-lg font-semibold mb-4 text-slate-950 dark:text-slate-100">
        Card Background
      </h3>

      <div className="space-y-4">
        {/* Current Background Preview */}
        {backgroundImage && (
          <div>
            <h4 className={`font-medium mb-2 ${themeClasses.label}`}>
              Current Background
            </h4>
            <div className="relative inline-block">
              <img
                src={backgroundImage}
                alt="Card background"
                className="max-w-48 max-h-32 border border-slate-300 dark:border-slate-600 rounded shadow-sm"
              />
              <button
                onClick={handleRemove}
                className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-700"
                title="Remove background"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Upload Controls */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={isCompressing}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isCompressing}
            className={`px-4 py-2 rounded hover:bg-blue-700 mr-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${themeClasses.button.primary}`}
          >
            {isCompressing
              ? "Compressing..."
              : backgroundImage
                ? "Change Background"
                : "Upload Background"}
          </button>
          {backgroundImage && (
            <button
              onClick={handleRemove}
              disabled={isCompressing}
              className={`px-4 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${themeClasses.button.secondary}`}
            >
              Remove Background
            </button>
          )}
        </div>

        <div className={`text-sm ${themeClasses.muted}`}>
          <p>Supported formats: JPG, PNG, GIF, WebP</p>
          <p>Maximum file size: 5MB (will be compressed for storage)</p>
          <p>The background will be scaled to fit the card dimensions.</p>
        </div>
      </div>
    </div>
  );
};

export default BackgroundUploader;
