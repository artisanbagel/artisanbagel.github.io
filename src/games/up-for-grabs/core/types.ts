// Board and game state types. Shared by all modes.
// All letters are uppercase A-Z.

export interface Player {
  name: string;
  words: string[];
}

export interface Board {
  players: Player[];
  pool: string; // letters in the middle, any order
}

// Pool letters plus words from at most one player, rearranged into a new word.
export interface Move {
  player: number | null; // index into board.players; null: pool letters only
  from: number[]; // indexes into that player's words
  to: string; // the new word
}
