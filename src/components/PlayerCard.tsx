import { forwardRef } from "react";
import { Player } from "../types/player";
import { CardTemplate } from "../types/template";
import { CardElementContent, getElementBoxStyle } from "../utils/renderCardElement";

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
            : template.backgroundColor,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {template.elements
          .filter((element) => element.visible !== false)
          .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
          .map((element) => (
            <div key={element.id} style={getElementBoxStyle(element)}>
              <CardElementContent element={element} player={player} />
            </div>
          ))}
      </div>
    );
  },
);

PlayerCard.displayName = "PlayerCard";

export default PlayerCard;
