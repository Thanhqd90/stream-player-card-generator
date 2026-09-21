import { toPng } from "html-to-image";
import { Player } from "../types/player";
import { CardTemplate } from "../types/template";
import { generatePlayerCardFileName } from "./fileNames";

async function waitForDocumentFonts(): Promise<void> {
  if (
    typeof document === "undefined" ||
    typeof document.fonts === "undefined"
  ) {
    return;
  }

  await document.fonts.ready;
}

async function waitForImagesToLoad(element: HTMLElement): Promise<void> {
  const images = Array.from(element.querySelectorAll<HTMLImageElement>("img"));

  await Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve, reject) => {
          if (image.complete) {
            return image.naturalWidth !== 0
              ? resolve()
              : reject(new Error(`Image failed to load: ${image.src}`));
          }

          const onLoad = () => {
            cleanup();
            resolve();
          };
          const onError = () => {
            cleanup();
            reject(new Error(`Image failed to load: ${image.src}`));
          };
          const cleanup = () => {
            image.removeEventListener("load", onLoad);
            image.removeEventListener("error", onError);
          };

          image.addEventListener("load", onLoad);
          image.addEventListener("error", onError);
        }),
    ),
  );
}

function formatExportError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const err = error as { type?: string };
    return err.type ? `Event: ${err.type}` : JSON.stringify(error);
  }
  return String(error);
}

export async function exportCardAsPng(
  element: HTMLElement,
  player: Player,
  template: CardTemplate,
): Promise<void> {
  try {
    await waitForDocumentFonts();
    await waitForImagesToLoad(element);
    const dataUrl = await toPng(element, {
      width: template.width,
      height: template.height,
      cacheBust: true,
      pixelRatio: 2,
    });

    const link = document.createElement("a");
    link.download = generatePlayerCardFileName(player.values.handle || "player");
    link.href = dataUrl;
    link.click();
  } catch (error) {
    throw new Error(
      `Failed to export card as PNG: ${formatExportError(error)}`,
    );
  }
}

export async function exportCardAsPngDataUrl(
  element: HTMLElement,
  template: CardTemplate,
): Promise<string> {
  try {
    await waitForDocumentFonts();
    await waitForImagesToLoad(element);
    return await toPng(element, {
      width: template.width,
      height: template.height,
      cacheBust: true,
      pixelRatio: 2,
    });
  } catch (error) {
    throw new Error(
      `Failed to generate PNG data URL: ${formatExportError(error)}`,
    );
  }
}
