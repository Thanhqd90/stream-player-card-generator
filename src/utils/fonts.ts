import { ImportedFont } from "../types/event";

const FONT_LINK_ATTR = "data-imported-font-url";

export const BUILTIN_FONTS = [
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Courier New",
  "Georgia",
  "Verdana",
  "Tahoma",
  "Trebuchet MS",
  "Inter",
  "Roboto",
  "Poppins",
];

export function isValidFontUrl(url: string): boolean {
  if (typeof url !== "string") return false;

  try {
    const parsed = new URL(url);
    const isCssFile = parsed.pathname.endsWith(".css");
    const isGoogleFontsUrl = parsed.hostname.includes("fonts.googleapis.com");
    return (
      (parsed.protocol === "http:" || parsed.protocol === "https:") &&
      (isCssFile || isGoogleFontsUrl)
    );
  } catch {
    return false;
  }
}

export function updateImportedFontLinks(fonts: ImportedFont[]): void {
  if (typeof document === "undefined") return;

  const head = document.head;
  const existingLinks = Array.from(
    head.querySelectorAll<HTMLLinkElement>(`link[${FONT_LINK_ATTR}]`),
  );
  const importedUrls = fonts.map((font) => font.url);

  existingLinks.forEach((link) => {
    const existingUrl = link.getAttribute(FONT_LINK_ATTR);
    if (!existingUrl || !importedUrls.includes(existingUrl)) {
      link.remove();
    }
  });

  fonts.forEach((font) => {
    const alreadyLoaded = existingLinks.some(
      (link) => link.getAttribute(FONT_LINK_ATTR) === font.url,
    );

    if (!alreadyLoaded) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = font.url;
      link.type = "text/css";
      link.setAttribute(FONT_LINK_ATTR, font.url);
      head.appendChild(link);
    }
  });
}

export async function ensureImportedFontsLoaded(
  fonts: ImportedFont[],
): Promise<void> {
  if (typeof document === "undefined") return;

  updateImportedFontLinks(fonts);

  if (typeof document.fonts === "undefined") return;

  await document.fonts.ready;
}
