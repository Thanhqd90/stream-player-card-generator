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
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
  textAlign?: "left" | "center" | "right";
  lineHeight?: number;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number;
  visible: boolean;
}
