import { toPng } from "html-to-image";
import { Player } from "../types/player";
import { CardTemplate } from "../types/template";

export async function exportCardAsPng(
  element: HTMLElement,
  player: Player,
  template: CardTemplate,
): Promise<void> {
  try {
    const dataUrl = await toPng(element, {
      width: template.width,
      height: template.height,
      backgroundColor: "#ffffff",
    });

    const link = document.createElement("a");
    link.download = generateFileName(player);
    link.href = dataUrl;
    link.click();
  } catch (error) {
    throw new Error(`Failed to export card as PNG: ${error}`);
  }
}

export async function exportCardAsPngDataUrl(
  element: HTMLElement,
  template: CardTemplate,
): Promise<string> {
  try {
    return await toPng(element, {
      width: template.width,
      height: template.height,
      backgroundColor: "#ffffff",
    });
  } catch (error) {
    throw new Error(`Failed to generate PNG data URL: ${error}`);
  }
}

function generateFileName(player: Player): string {
  const sanitizedHandle = (player.values.handle || "player")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .toLowerCase();
  const sanitizedSeed = (player.values.seed || "00")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .toLowerCase();
  return `seed-${sanitizedSeed}-${sanitizedHandle}.png`;
}
