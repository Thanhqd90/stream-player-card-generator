import React from "react";
import { TemplateElement } from "../types/template";
import { Player } from "../types/player";

export const applyOpacityToColor = (
  color?: string,
  opacity?: number,
): string | undefined => {
  if (!color) return undefined;
  const alpha = opacity ?? 1;
  const rgbaMatch = color.match(
    /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/,
  );
  const hexMatch = color.match(/^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/);

  if (rgbaMatch) {
    const [, r, g, b] = rgbaMatch;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  if (alpha >= 1) return color;
  if (!hexMatch) return color;

  const clean = hexMatch[1];
  let r = 0;
  let g = 0;
  let b = 0;

  if (clean.length === 6) {
    r = parseInt(clean.slice(0, 2), 16);
    g = parseInt(clean.slice(2, 4), 16);
    b = parseInt(clean.slice(4, 6), 16);
  } else {
    r = parseInt(clean[0] + clean[0], 16);
    g = parseInt(clean[1] + clean[1], 16);
    b = parseInt(clean[2] + clean[2], 16);
  }

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Box style shared by the live card render (PlayerCard) and the editor canvas,
// so the editor is a true preview of what gets exported.
export function getElementBoxStyle(
  element: TemplateElement,
): React.CSSProperties {
  return {
    position: "absolute",
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
    zIndex: element.zIndex ?? 0,
    opacity: element.opacity ?? 1,
    fontSize: element.fontSize,
    color: element.color,
    backgroundColor: applyOpacityToColor(
      element.backgroundColor,
      element.backgroundOpacity,
    ),
    borderColor: element.borderColor,
    borderWidth: element.borderWidth ?? 0,
    borderStyle: element.borderStyle || "solid",
    borderRadius:
      element.type === "shape" && element.shapeType === "ellipse"
        ? "50%"
        : element.borderRadius,
    padding: element.padding,
    fontWeight: element.fontWeight,
    fontStyle: element.fontStyle || "normal",
    textAlign: element.textAlign,
    lineHeight: element.lineHeight,
    letterSpacing: element.letterSpacing,
    textTransform: element.textTransform || "none",
    fontFamily: element.fontFamily,
    display: "flex",
    alignItems: element.type === "image" ? "center" : "flex-start",
    justifyContent:
      element.textAlign === "center"
        ? "center"
        : element.textAlign === "right"
          ? "flex-end"
          : "flex-start",
    overflow: "hidden",
  };
}

export function getElementImageSrc(
  element: TemplateElement,
  player?: Player | null,
): string {
  if (element.fieldId) {
    return player?.values[element.fieldId] || "";
  }
  return element.staticImageSrc || "";
}

export function getElementDisplayValue(
  element: TemplateElement,
  player?: Player | null,
): string {
  if (element.fieldId) {
    return player?.values[element.fieldId] || "";
  }
  if (element.id.includes("location")) return "Location";
  if (element.id.includes("achievements")) return "Achievements";
  if (element.id.includes("funfact")) return "Fun Fact";
  return "";
}

interface CardElementContentProps {
  element: TemplateElement;
  player?: Player | null;
  /** Render generic placeholder content instead of real/empty data. */
  placeholder?: boolean;
}

export const CardElementContent: React.FC<CardElementContentProps> = ({
  element,
  player,
  placeholder,
}) => {
  if (element.type === "shape") {
    // Fill/stroke/radius are already applied via getElementBoxStyle - a
    // shape has no inner content.
    return null;
  }

  if (element.type === "image") {
    const src = placeholder ? "" : getElementImageSrc(element, player);

    if (!src) {
      return placeholder ? (
        <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs text-slate-500 dark:text-slate-400">
          [Image: {element.fieldId || "static"}]
        </div>
      ) : null;
    }

    return (
      <img
        src={src}
        alt={element.fieldId || "image"}
        crossOrigin="anonymous"
        style={{
          width: "100%",
          height: "100%",
          objectFit: element.objectFit || "cover",
          objectPosition: element.objectPosition || "center",
        }}
      />
    );
  }

  const value = placeholder
    ? element.type === "textarea"
      ? "Sample\nText"
      : "Sample Text"
    : getElementDisplayValue(element, player);

  return (
    <div
      className={
        element.type === "textarea" ? "whitespace-pre-line" : undefined
      }
      style={{ width: "100%" }}
    >
      {value}
    </div>
  );
};
