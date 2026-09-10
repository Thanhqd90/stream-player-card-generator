import React, { useRef, useState } from "react";
import { themeClasses } from "../utils/themeClasses";
import {
  compressImageDataUrl,
  getDataUrlSizeKB,
} from "../utils/imageCompression";
import { getImageDimensions } from "../utils/templateSize";
import { PLACEHOLDER_BACKGROUNDS } from "../utils/placeholderBackgrounds";

const MAX_MATCHED_DIMENSION = 2400;

interface BackgroundUploaderProps {
  backgroundImage?: string;
  backgroundColor?: string;
  templateSize: { width: number; height: number };
  onBackgroundChange: (imageDataUrl: string | undefined) => void;
  onBackgroundColorChange: (color: string | undefined) => void;
  onMatchCanvasSize: (width: number, height: number) => void;
}

const BackgroundUploader: React.FC<BackgroundUploaderProps> = ({
  backgroundImage,
  backgroundColor,
  templateSize,
  onBackgroundChange,
  onBackgroundColorChange,
  onMatchCanvasSize,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [detectedSize, setDetectedSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

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
    setDetectedSize(null);

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

        try {
          const dimensions = await getImageDimensions(originalDataUrl);
          setDetectedSize(dimensions);
        } catch {
          // Non-critical - just skip offering the "match size" action
        }
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
    setDetectedSize(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleMatchSize = () => {
    if (!detectedSize) return;
    const { width, height } = detectedSize;
    const longestSide = Math.max(width, height);
    const scale =
      longestSide > MAX_MATCHED_DIMENSION
        ? MAX_MATCHED_DIMENSION / longestSide
        : 1;
    onMatchCanvasSize(Math.round(width * scale), Math.round(height * scale));
  };

  const sizeAlreadyMatches =
    detectedSize &&
    detectedSize.width === templateSize.width &&
    detectedSize.height === templateSize.height;

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

        {detectedSize && !sizeAlreadyMatches && (
          <div
            className={`flex items-center justify-between gap-3 rounded border border-slate-200 dark:border-slate-700 p-3 text-sm ${themeClasses.muted}`}
          >
            <span>
              Uploaded image is {detectedSize.width} × {detectedSize.height}
              px. Card is currently {templateSize.width} ×{" "}
              {templateSize.height}px.
            </span>
            <button
              onClick={handleMatchSize}
              className={`px-3 py-1.5 rounded text-sm whitespace-nowrap ${themeClasses.button.secondary}`}
              type="button"
            >
              Match card to image size
            </button>
          </div>
        )}

        <div className={`text-sm ${themeClasses.muted}`}>
          <p>Supported formats: JPG, PNG, GIF, WebP</p>
          <p>Maximum file size: 5MB (will be compressed for storage)</p>
          <p>The background will be scaled to fit the card dimensions.</p>
        </div>

        {/* Placeholder Background */}
        <div className="border-t pt-4">
          <h4 className={`font-medium mb-2 ${themeClasses.label}`}>
            Placeholder Background
          </h4>
          <p className={`text-sm mb-3 ${themeClasses.muted}`}>
            Shown behind the card whenever no background image is uploaded.
          </p>
          <div className="flex flex-wrap gap-2">
            {PLACEHOLDER_BACKGROUNDS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                title={preset.name}
                onClick={() => onBackgroundColorChange(preset.value)}
                className={`w-12 h-12 rounded border-2 transition-transform hover:scale-105 ${
                  backgroundColor === preset.value
                    ? "border-blue-500 dark:border-blue-400"
                    : "border-slate-300 dark:border-slate-600"
                }`}
                style={{ background: preset.value }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackgroundUploader;
