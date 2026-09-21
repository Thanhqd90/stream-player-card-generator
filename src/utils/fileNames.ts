import { SavedEvent } from "../types/event";

// Replaces only characters illegal in Windows/Mac filenames, trims trailing
// dots/spaces, and otherwise preserves case and spacing exactly as typed.
export function sanitizeFilename(name: string, fallback = "untitled"): string {
  const sanitized = name
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/, "");
  return sanitized || fallback;
}

export function generateEventJsonFileName(event: SavedEvent): string {
  return `${sanitizeFilename(event.name, "event")}-event.json`;
}

export function generateZipFileName(event: SavedEvent): string {
  return `${sanitizeFilename(event.name, "event")}-player-cards.zip`;
}

export function generatePlayerCardFileName(playerHandle: string): string {
  return `${sanitizeFilename(playerHandle, "player")}.png`;
}

// Appends " (2)", " (3)", etc. to keep filenames unique within a batch
// (e.g. a ZIP export) when two players share a handle after sanitization.
export function dedupeFileName(
  fileName: string,
  usedNames: Set<string>,
): string {
  if (!usedNames.has(fileName)) {
    usedNames.add(fileName);
    return fileName;
  }

  const dotIndex = fileName.lastIndexOf(".");
  const base = dotIndex === -1 ? fileName : fileName.slice(0, dotIndex);
  const ext = dotIndex === -1 ? "" : fileName.slice(dotIndex);

  let counter = 2;
  let candidate = `${base} (${counter})${ext}`;
  while (usedNames.has(candidate)) {
    counter += 1;
    candidate = `${base} (${counter})${ext}`;
  }
  usedNames.add(candidate);
  return candidate;
}
