import React from "react";
import { Player } from "../types/player";
import { themeClasses } from "../utils/themeClasses";

interface PlayerListProps {
  players: Player[];
  selectedPlayerId: string | null;
  onSelectPlayer: (player: Player) => void;
  onDeletePlayer: (playerId: string) => void;
  onDuplicatePlayer: (player: Player) => void;
}

const PlayerList: React.FC<PlayerListProps> = ({
  players,
  selectedPlayerId,
  onSelectPlayer,
  onDeletePlayer,
  onDuplicatePlayer,
}) => {
  if (players.length === 0) {
    return (
      <div className={`${themeClasses.panel} rounded-lg shadow-md p-6`}>
        <h3 className="text-lg font-semibold mb-4 text-slate-950 dark:text-slate-100">
          Players
        </h3>
        <p className={`text-center py-8 ${themeClasses.muted}`}>
          No players added yet. Add your first player using the form.
        </p>
      </div>
    );
  }

  return (
    <div className={`${themeClasses.panel} rounded-lg shadow-md p-6`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-950 dark:text-slate-100">
          Players ({players.length})
        </h3>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {players.map((player) => (
          <div
            key={player.id}
            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
              selectedPlayerId === player.id
                ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600"
                : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
            onClick={() => onSelectPlayer(player)}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="font-medium text-slate-950 dark:text-slate-100">
                  {player.values.handle || "Unnamed Player"}
                </div>
                <div className={`text-sm ${themeClasses.muted}`}>
                  Seed #{player.values.seed || "?"}
                </div>
                {player.values.location && (
                  <div className={`text-xs mt-1 ${themeClasses.muted}`}>
                    {player.values.location}
                  </div>
                )}
                {player.values.playerPhoto && (
                  <div
                    className={`text-xs mt-1 text-green-600 dark:text-green-400 font-medium`}
                  >
                    ✓ Photo added
                  </div>
                )}
              </div>

              <div className="flex gap-2 ml-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicatePlayer(player);
                  }}
                  className={`text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 p-1 rounded transition-colors`}
                  title="Duplicate player"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (
                      window.confirm(
                        `Are you sure you want to delete ${player.values.handle || "this player"}?`,
                      )
                    ) {
                      onDeletePlayer(player.id);
                    }
                  }}
                  className={`text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 p-1 rounded transition-colors`}
                  title="Delete player"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayerList;
