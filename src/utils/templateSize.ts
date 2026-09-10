import { CardTemplate, TemplateElement } from "../types/template";

// Clamp an element's position/size to fit within the given canvas bounds.
export function clampElementToBounds(
  element: TemplateElement,
  boundsWidth: number,
  boundsHeight: number,
): TemplateElement {
  return {
    ...element,
    x: Math.max(0, Math.min(element.x, boundsWidth - element.width)),
    y: Math.max(0, Math.min(element.y, boundsHeight - element.height)),
    width: Math.max(20, Math.min(element.width, boundsWidth - element.x)),
    height: Math.max(20, Math.min(element.height, boundsHeight - element.y)),
  };
}

// Resize a template's canvas, re-clamping every element into the new bounds.
export function resizeTemplateCanvas(
  template: CardTemplate,
  width: number,
  height: number,
): CardTemplate {
  const safeWidth = Math.max(50, Math.round(width));
  const safeHeight = Math.max(50, Math.round(height));
  return {
    ...template,
    width: safeWidth,
    height: safeHeight,
    elements: template.elements.map((el) =>
      clampElementToBounds(el, safeWidth, safeHeight),
    ),
  };
}

// Read the natural pixel dimensions of an image from a data URL.
export function getImageDimensions(
  dataUrl: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () =>
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Failed to read image dimensions"));
    img.src = dataUrl;
  });
}
