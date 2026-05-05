export interface Player {
  id: string;
  values: Record<string, string>;
}

export interface FieldDefinition {
  id: string;
  label: string;
  type: "text" | "textarea" | "image" | "number";
  required?: boolean;
}
