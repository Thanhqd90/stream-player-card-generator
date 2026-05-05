import { Player, FieldDefinition } from "./player";
import { CardTemplate } from "./template";

export interface SavedEvent {
  version: number;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  fields: FieldDefinition[];
  template: CardTemplate;
  players: Player[];
  selectedPlayerId?: string;
}
