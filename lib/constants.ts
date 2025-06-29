//Game fee configuration (in GOR)
export const GAME_FEES = {
  minesweeper: 0.01,
  snake: 0.008,
  tetris: 0.015
};

const TOURNAMENT_DURATION = 3 * 24 * 60 * 60 * 1000;

//tetris
export const TETRIS_CONSTANTS = {
  BOARD_WIDTH: 10,
  BOARD_HEIGHT: 20,
  CELL_SIZE: 25
};

//minesweeper
export const MINESWEEPER_CONSTANTS = {
  BOARD_SIZE: 9,
  TOTAL_MINES: 10
};

//snake
export const SNAKE_CONSTANTS = {
  BOARD_SIZE: 20,
  INITIAL_SNAKE: [{ x: 10, y: 10 }],
  INITIAL_FOOD: { x: 15, y: 15 },
  INITIAL_DIRECTION: { x: 0, y: -1 }
};
