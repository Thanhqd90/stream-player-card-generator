import React, { useEffect, useRef, useState, useCallback } from "react";
import { themeClasses } from "../utils/themeClasses";

interface ImageCropperProps {
  imageSrc: string;
  aspectRatio: number; // width / height
  onCancel: () => void;
  onCropComplete: (dataUrl: string) => void;
}

const FRAME_SIZE = 320;
const OUTPUT_SIZE = 800;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const clampPosition = (
  pos: { x: number; y: number },
  displayWidth: number,
  displayHeight: number,
  frameWidth: number,
  frameHeight: number,
) => {
  const minX = Math.min(0, frameWidth - displayWidth);
  const minY = Math.min(0, frameHeight - displayHeight);
  return { x: clamp(pos.x, minX, 0), y: clamp(pos.y, minY, 0) };
};

const ImageCropper: React.FC<ImageCropperProps> = ({
  imageSrc,
  aspectRatio,
  onCancel,
  onCropComplete,
}) => {
  const frameWidth = aspectRatio >= 1 ? FRAME_SIZE : FRAME_SIZE * aspectRatio;
  const frameHeight = aspectRatio >= 1 ? FRAME_SIZE / aspectRatio : FRAME_SIZE;

  const [naturalSize, setNaturalSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{
    startX: number;
    startY: number;
    startPos: { x: number; y: number };
  } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      const scale = Math.max(frameWidth / width, frameHeight / height);
      setNaturalSize({ width, height });
      setZoom(1);
      setPosition({
        x: (frameWidth - width * scale) / 2,
        y: (frameHeight - height * scale) / 2,
      });
    };
    img.src = imageSrc;
  }, [imageSrc, frameWidth, frameHeight]);

  const baseScale = naturalSize
    ? Math.max(frameWidth / naturalSize.width, frameHeight / naturalSize.height)
    : 1;

  const handleZoomChange = (newZoom: number) => {
    if (naturalSize) {
      const scale = baseScale * newZoom;
      const width = naturalSize.width * scale;
      const height = naturalSize.height * scale;
      setPosition((prev) =>
        clampPosition(prev, width, height, frameWidth, frameHeight),
      );
    }
    setZoom(newZoom);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!naturalSize) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, startPos: position };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || !naturalSize) return;
    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;
    const scale = baseScale * zoom;
    const width = naturalSize.width * scale;
    const height = naturalSize.height * scale;
    setPosition(
      clampPosition(
        {
          x: dragRef.current.startPos.x + deltaX,
          y: dragRef.current.startPos.y + deltaY,
        },
        width,
        height,
        frameWidth,
        frameHeight,
      ),
    );
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  const handleApply = useCallback(() => {
    if (!naturalSize || !imgRef.current) return;

    const scale = baseScale * zoom;
    const cropX = -position.x / scale;
    const cropY = -position.y / scale;
    const cropWidth = frameWidth / scale;
    const cropHeight = frameHeight / scale;

    const outputWidth =
      aspectRatio >= 1 ? OUTPUT_SIZE : Math.round(OUTPUT_SIZE * aspectRatio);
    const outputHeight =
      aspectRatio >= 1 ? Math.round(OUTPUT_SIZE / aspectRatio) : OUTPUT_SIZE;

    const canvas = document.createElement("canvas");
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(
      imgRef.current,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      outputWidth,
      outputHeight,
    );
    onCropComplete(canvas.toDataURL("image/jpeg", 0.9));
  }, [naturalSize, baseScale, zoom, position, frameWidth, frameHeight, aspectRatio, onCropComplete]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onCancel}
    >
      <div
        className={`${themeClasses.panel} rounded-lg shadow-xl p-4 max-w-sm w-full`}
        onClick={(e) => e.stopPropagation()}
      >
        <h4 className="font-semibold mb-3 text-slate-950 dark:text-slate-100">
          Adjust Photo Crop
        </h4>

        <div
          className="relative mx-auto overflow-hidden rounded border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 touch-none select-none cursor-grab active:cursor-grabbing"
          style={{ width: frameWidth, height: frameHeight }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {naturalSize && (
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop preview"
              draggable={false}
              style={{
                position: "absolute",
                left: position.x,
                top: position.y,
                width: naturalSize.width * baseScale * zoom,
                height: naturalSize.height * baseScale * zoom,
                maxWidth: "none",
                pointerEvents: "none",
              }}
            />
          )}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span className={`text-sm ${themeClasses.label}`}>Zoom</span>
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
            className="flex-1"
          />
        </div>
        <p className={`mt-1 text-xs ${themeClasses.muted}`}>
          Drag the photo to reposition it, use the slider to zoom in.
        </p>

        <div className="mt-4 flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className={`px-4 py-2 rounded transition-colors ${themeClasses.button.secondary}`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!naturalSize}
            className={`px-4 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${themeClasses.button.primary}`}
          >
            Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
