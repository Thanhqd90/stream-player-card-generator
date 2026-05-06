export interface CardTemplate {
  id: string;
  name: string;
  width: number;
  height: number;
  backgroundImage?: string;
  elements: TemplateElement[];
}

export interface TemplateElement {
  id: string;
  fieldId: string;
  type: "text" | "textarea" | "image" | "shape";

  // Position and size (shared)
  x: number;
  y: number;
  width: number;
  height: number;

  // Visibility and layering (shared)
  visible: boolean;
  locked?: boolean;
  zIndex?: number;

  // Opacity (shared)
  opacity?: number; // 0-1

  // Background (shared)
  backgroundColor?: string;
  backgroundOpacity?: number; // 0-1

  // Border (shared)
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: "solid" | "dashed" | "dotted";
  borderRadius?: number;

  // Spacing (shared)
  padding?: number;

  // Text styles (text, textarea)
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: "normal" | "italic";
  color?: string;
  textAlign?: "left" | "center" | "right";
  lineHeight?: number;
  letterSpacing?: number;
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";

  // Image styles (image)
  objectFit?: "cover" | "contain" | "fill";
  objectPosition?: "center";
}
