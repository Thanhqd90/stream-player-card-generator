import React, { forwardRef } from "react";
import { Player } from "../types/player";
import { CardTemplate } from "../types/template";

interface PlayerCardProps {
  player: Player;
  template: CardTemplate;
}

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
            const value = element.fieldId
              ? player.values[element.fieldId] || ""
              : "";

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
              backgroundColor: element.backgroundColor,
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
                  src={value}
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
                {value}
              </div>
            );
          })}
      </div>
    );
  },
);

PlayerCard.displayName = "PlayerCard";

export default PlayerCard;
