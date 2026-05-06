import { Player, FieldDefinition } from "./player";
import { CardTemplate } from "./template";

export interface ImportedFont {
  name: string;
  url: string;
}

export interface SavedEvent {
  version: number;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  fields: FieldDefinition[];
  template: CardTemplate;
  players: Player[];
  fonts: ImportedFont[];
  selectedPlayerId?: string;
}
