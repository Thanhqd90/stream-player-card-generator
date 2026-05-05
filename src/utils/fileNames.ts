import { SavedEvent } from "../types/event";

export function generateEventJsonFileName(event: SavedEvent): string {
  const sanitizedName = event.name
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .toLowerCase();
  return `${sanitizedName}-event.json`;
}

export function generateZipFileName(event: SavedEvent): string {
  const sanitizedName = event.name
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .toLowerCase();
  return `${sanitizedName}-player-cards.zip`;
}

export function generatePlayerCardFileName(
  playerHandle: string,
  playerSeed: string,
): string {
  const sanitizedHandle = playerHandle
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .toLowerCase();
  const sanitizedSeed = playerSeed
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .toLowerCase();
  return `seed-${sanitizedSeed}-${sanitizedHandle}.png`;
}
