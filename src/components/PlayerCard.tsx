import React, { forwardRef } from "react";
import { Player } from "../types/player";
import { CardTemplate } from "../types/template";

interface PlayerCardProps {
  player: Player;
  template: CardTemplate;
}

const getColorWithOpacity = (color?: string, opacity?: number) => {
  if (!color) return undefined;
  const alpha = opacity ?? 1;
  if (alpha >= 1) return color;
  const clean = color.replace("#", "");
  let r = 0;
  let g = 0;
  let b = 0;

  if (/^[0-9A-Fa-f]{6}$/.test(clean)) {
    r = parseInt(clean.slice(0, 2), 16);
    g = parseInt(clean.slice(2, 4), 16);
    b = parseInt(clean.slice(4, 6), 16);
  } else if (/^[0-9A-Fa-f]{3}$/.test(clean)) {
    r = parseInt(clean[0] + clean[0], 16);
    g = parseInt(clean[1] + clean[1], 16);
    b = parseInt(clean[2] + clean[2], 16);
  } else {
    return color;
  }

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const PlayerCard = forwardRef<HTMLDivElement, PlayerCardProps>(
  ({ player, template }, ref) => {
    return (
      <div
        ref={ref}
        className="relative overflow-hidden"
        style={{
          width: template.width,
          height: template.height,
          backgroundImage: template.backgroundImage
            ? `url(${template.backgroundImage})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {template.elements
          .filter((element) => element.visible !== false)
          .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
          .map((element) => {
            const rawValue = element.fieldId
              ? player.values[element.fieldId] || ""
              : "";
            const displayValue = element.fieldId
              ? rawValue
              : element.id.includes("location")
                ? "Location"
                : element.id.includes("achievements")
                  ? "Achievements"
                  : element.id.includes("funfact")
                    ? "Fun Fact"
                    : rawValue;

            const style: React.CSSProperties = {
              position: "absolute",
              left: element.x,
              top: element.y,
              width: element.width,
              height: element.height,
              zIndex: element.zIndex ?? 0,
              opacity: element.opacity,
              fontSize: element.fontSize,
              color: element.color,
              backgroundColor: getColorWithOpacity(
                element.backgroundColor,
                element.backgroundOpacity,
              ),
              borderColor: element.borderColor,
              borderWidth: element.borderWidth,
              borderStyle: element.borderStyle || "solid",
              borderRadius: element.borderRadius,
              padding: element.padding,
              fontWeight: element.fontWeight,
              fontStyle: element.fontStyle || "normal",
              textAlign: element.textAlign,
              lineHeight: element.lineHeight,
              letterSpacing: element.letterSpacing,
              textTransform: element.textTransform,
              fontFamily: element.fontFamily,
              display: "flex",
              alignItems: element.type === "image" ? "center" : "flex-start",
              justifyContent:
                element.textAlign === "center"
                  ? "center"
                  : element.textAlign === "right"
                    ? "flex-end"
                    : "flex-start",
              overflow: "hidden",
            };

            if (element.type === "image") {
              return (
                <img
                  key={element.id}
                  src={rawValue}
                  alt={element.fieldId}
                  style={{
                    ...style,
                    objectFit: element.objectFit || "cover",
                    objectPosition: element.objectPosition || "center",
                  }}
                />
              );
            }

            return (
              <div
                key={element.id}
                style={style}
                className={
                  element.type === "textarea" ? "whitespace-pre-line" : ""
                }
              >
                {displayValue}
              </div>
            );
          })}
      </div>
    );
  },
);

PlayerCard.displayName = "PlayerCard";

export default PlayerCard;
