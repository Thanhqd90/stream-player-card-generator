import React, { useState, useRef } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { Player } from "../types/player";
import { CardTemplate } from "../types/template";
import { SavedEvent } from "../types/event";
import { exportCardAsPng, exportCardAsPngDataUrl } from "../utils/exportCard";
import {
  generateZipFileName,
  generatePlayerCardFileName,
} from "../utils/fileNames";
import PlayerCard from "./PlayerCard";
import { themeClasses } from "../utils/themeClasses";

interface ExportButtonsProps {
  selectedPlayer: Player | null;
  players: Player[];
  template: CardTemplate;
  event: SavedEvent;
}

const ExportButtons: React.FC<ExportButtonsProps> = ({
  selectedPlayer,
  players,
  template,
  event,
}) => {
  const [isExportingSingle, setIsExportingSingle] = useState(false);
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleExportSingleCard = async () => {
    if (!selectedPlayer || !cardRef.current) {
      alert("Please select a player first");
      return;
    }

    setIsExportingSingle(true);
    try {
      await exportCardAsPng(cardRef.current, selectedPlayer, template);
    } catch (error) {
      alert(
        `Export failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsExportingSingle(false);
    }
  };

  const handlePreviewCard = async () => {
    if (!selectedPlayer || !cardRef.current) {
      alert("Please select a player first");
      return;
    }

    setIsPreviewing(true);
    try {
      const dataUrl = await exportCardAsPngDataUrl(cardRef.current, template);
      // Open the data URL in a new tab
      const newTab = window.open();
      if (newTab) {
        newTab.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Player Card Preview - ${selectedPlayer.values.handle || "Player"}</title>
              <style>
                body {
                  margin: 0;
                  padding: 20px;
                  background: #f3f4f6;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  font-family: system-ui, -apple-system, sans-serif;
                }
                .container {
                  text-align: center;
                }
                img {
                  max-width: 100%;
                  height: auto;
                  border-radius: 8px;
                  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
                }
                .title {
                  margin-bottom: 20px;
                  color: #374151;
                  font-size: 24px;
                  font-weight: 600;
                }
                .close-hint {
                  margin-top: 20px;
                  color: #6b7280;
                  font-size: 14px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h1 class="title">Player Card Preview</h1>
                <img src="${dataUrl}" alt="Player Card for ${selectedPlayer.values.handle || "Player"}" />
                <p class="close-hint">Close this tab when done viewing</p>
              </div>
            </body>
          </html>
        `);
        newTab.document.close();
      } else {
        alert("Failed to open preview tab. Please allow popups for this site.");
      }
    } catch (error) {
      alert(
        `Preview failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleExportAllCards = async () => {
    if (players.length === 0) {
      alert("No players to export");
      return;
    }

    setIsExportingAll(true);
    try {
      const zip = new JSZip();

      // Create hidden cards for export using React components
      const cardElements: HTMLElement[] = [];

      for (const player of players) {
        // Create a container for the React component
        const container = document.createElement("div");
        container.style.position = "absolute";
        container.style.left = "-9999px";
        container.style.top = "-9999px";
        container.style.width = `${template.width}px`;
        container.style.height = `${template.height}px`;
        container.style.visibility = "hidden";
        container.style.pointerEvents = "none";

        // Use React to render the PlayerCard component
        const root = document.createElement("div");
        root.style.width = `${template.width}px`;
        root.style.height = `${template.height}px`;
        root.style.visibility = "visible";

        // We'll render the card content directly since we can't easily use ReactDOM in this context
        // This is a compromise for client-side only functionality
        const cardDiv = document.createElement("div");
        cardDiv.style.color = "white";
        cardDiv.style.borderRadius = "8px";
        cardDiv.style.boxShadow = "0 25px 50px -12px rgba(0, 0, 0, 0.25)";
        cardDiv.style.overflow = "hidden";
        cardDiv.style.width = `${template.width}px`;
        cardDiv.style.height = `${template.height}px`;
        cardDiv.style.fontFamily = "system-ui, -apple-system, sans-serif";
        cardDiv.style.position = "relative";
        cardDiv.style.backgroundSize = "cover";
        cardDiv.style.backgroundPosition = "center";

        // Set background separately to handle data URLs properly
        if (template.backgroundImage) {
          cardDiv.style.backgroundImage = `url(${template.backgroundImage})`;
        } else {
          cardDiv.style.background =
            "linear-gradient(to bottom right, #111827, #1f2937)";
        }

        const innerHtml = `
            ${template.elements
              .filter((el) => el.visible)
              .map((el) => {
                const value = el.fieldId ? player.values[el.fieldId] || "" : "";
                let displayText = value;

                // Handle static text elements
                if (!el.fieldId) {
                  if (el.id.includes("location")) displayText = "Location";
                  else if (el.id.includes("achievements"))
                    displayText = "Achievements";
                  else if (el.id.includes("funfact")) displayText = "Fun Fact";
                }

                if (el.type === "image" && value) {
                  return `<img src="${value}" style="
                    position: absolute;
                    left: ${el.x}px;
                    top: ${el.y}px;
                    width: ${el.width}px;
                    height: ${el.height}px;
                    border-radius: ${el.borderRadius || 0}px;
                    object-fit: cover;
                  " />`;
                }

                return `<div style="
                  position: absolute;
                  left: ${el.x}px;
                  top: ${el.y}px;
                  width: ${el.width}px;
                  height: ${el.height}px;
                  font-size: ${el.fontSize || 16}px;
                  color: ${el.color || "#000000"};
                  background-color: ${el.backgroundColor || "transparent"};
                  border: ${el.borderWidth || 0}px solid ${el.borderColor || "transparent"};
                  border-radius: ${el.borderRadius || 0}px;
                  padding: ${el.padding || 0}px;
                  font-weight: ${el.fontWeight || "normal"};
                  text-align: ${el.textAlign || "left"};
                  line-height: ${el.lineHeight || 1.2};
                  font-family: ${el.fontFamily || "inherit"};
                  white-space: ${el.type === "textarea" ? "pre-line" : "normal"};
                  display: flex;
                  align-items: ${el.type === "image" ? "center" : "flex-start"};
                  justify-content: ${
                    el.textAlign === "center"
                      ? "center"
                      : el.textAlign === "right"
                        ? "flex-end"
                        : "flex-start"
                  };
                ">${displayText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`;
              })
              .join("")}
        `;

        cardDiv.innerHTML = innerHtml;
        root.appendChild(cardDiv);
        container.appendChild(root);
        document.body.appendChild(container);
        cardElements.push(container);
      }

      // Generate PNGs and add to ZIP
      for (let i = 0; i < players.length; i++) {
        const player = players[i];
        const cardElement = cardElements[i];

        try {
          // Ensure the card is fully rendered before converting to PNG
          await new Promise((resolve) => setTimeout(resolve, 100));
          const dataUrl = await exportCardAsPngDataUrl(cardElement, template);
          const base64Data = dataUrl.split(",")[1];
          const fileName = generatePlayerCardFileName(
            player.values.handle || "player",
            player.values.seed || "00",
          );

          zip.file(fileName, base64Data, { base64: true });
        } catch (error) {
          console.error(
            `Failed to export card for ${player.values.handle || "player"}:`,
            error,
          );
        }
      }

      // Clean up temporary elements
      cardElements.forEach((element) => {
        document.body.removeChild(element);
      });

      // Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, generateZipFileName(event));
    } catch (error) {
      alert(
        `Export failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsExportingAll(false);
    }
  };

  return (
    <div className={`${themeClasses.panel} rounded-lg shadow-md p-6`}>
      <h3 className="text-lg font-semibold mb-4 text-slate-950 dark:text-slate-100">
        Export Cards
      </h3>

      <div className="space-y-4">
        {/* Hidden card for single export */}
        {selectedPlayer && (
          <div
            style={{
              position: "fixed",
              left: "-10000px",
              top: "-10000px",
              pointerEvents: "none",
            }}
          >
            <PlayerCard
              ref={cardRef}
              player={selectedPlayer}
              template={template}
            />
          </div>
        )}

        {/* Export Single Card */}
        <div>
          <button
            onClick={handleExportSingleCard}
            disabled={!selectedPlayer || isExportingSingle}
            className={`w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${themeClasses.button.primary}`}
          >
            {isExportingSingle ? "Exporting..." : "Export Current Card as PNG"}
          </button>
          <p className={`mt-1 text-sm ${themeClasses.muted}`}>
            {selectedPlayer
              ? `Export ${selectedPlayer.values.handle || "player"}'s card as PNG`
              : "Select a player first"}
          </p>
        </div>

        {/* Preview Card */}
        <div>
          <button
            onClick={handlePreviewCard}
            disabled={!selectedPlayer || isPreviewing}
            className={`w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${themeClasses.button.primary.replace("bg-blue-600", "bg-green-600").replace("hover:bg-blue-700", "hover:bg-green-700").replace("focus:ring-blue-500", "focus:ring-green-500")}`}
          >
            {isPreviewing ? "Generating Preview..." : "Preview PNG in New Tab"}
          </button>
          <p className={`mt-1 text-sm ${themeClasses.muted}`}>
            {selectedPlayer
              ? `Preview ${selectedPlayer.values.handle || "player"}'s card in a new tab`
              : "Select a player first"}
          </p>
        </div>

        {/* Export All Cards */}
        <div>
          <button
            onClick={handleExportAllCards}
            disabled={players.length === 0 || isExportingAll}
            className={`w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${themeClasses.button.primary.replace("bg-blue-600", "bg-purple-600").replace("hover:bg-blue-700", "hover:bg-purple-700").replace("focus:ring-blue-500", "focus:ring-purple-500")}`}
          >
            {isExportingAll ? "Exporting..." : "Export All Cards as ZIP"}
          </button>
          <p className={`mt-1 text-sm ${themeClasses.muted}`}>
            Export all {players.length} player card
            {players.length === 1 ? "" : "s"} as a ZIP file
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExportButtons;
