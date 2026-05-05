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
          .filter((element) => element.visible)
          .map((element) => {
            const value = element.fieldId
              ? player.values[element.fieldId] || ""
              : "";

            // Handle static text elements
            let displayText = value;
            if (!element.fieldId) {
              if (element.id.includes("location")) displayText = "Location";
              else if (element.id.includes("achievements"))
                displayText = "Achievements";
              else if (element.id.includes("funfact")) displayText = "Fun Fact";
            }

            const style: React.CSSProperties = {
              position: "absolute",
              left: element.x,
              top: element.y,
              width: element.width,
              height: element.height,
              fontSize: element.fontSize,
              color: element.color,
              backgroundColor: element.backgroundColor,
              borderColor: element.borderColor,
              borderWidth: element.borderWidth,
              borderRadius: element.borderRadius,
              padding: element.padding,
              fontWeight: element.fontWeight,
              textAlign: element.textAlign,
              lineHeight: element.lineHeight,
              fontFamily: element.fontFamily,
              display: "flex",
              alignItems: element.type === "image" ? "center" : "flex-start",
              justifyContent:
                element.textAlign === "center"
                  ? "center"
                  : element.textAlign === "right"
                    ? "flex-end"
                    : "flex-start",
            };

            if (element.type === "image" && value) {
              return (
                <img
                  key={element.id}
                  src={value}
                  alt={element.fieldId}
                  style={style}
                  className="object-cover"
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
                {displayText}
              </div>
            );
          })}
      </div>
    );
  },
);

PlayerCard.displayName = "PlayerCard";

export default PlayerCard;
