import type { Board } from '../core/types';

// Board from a photo of a real table. No reader chosen yet.
export async function readPhoto(_file: File): Promise<Board> {
  throw new Error('Photo reader not built yet');
}
