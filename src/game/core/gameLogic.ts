export const EMPTY = 0;
export const BLACK = 1;
export const WHITE = 2;

export type Player = typeof BLACK | typeof WHITE;
export type Cell = 0 | Player;

export interface WinResult
{
    winner: Player;
    cells: { row: number, col: number }[];
}

const DIRECTIONS = [
    { dr: 0, dc: 1 },
    { dr: 1, dc: 0 },
    { dr: 1, dc: 1 },
    { dr: 1, dc: -1 }
];

export function checkWin (grid: Cell[][], row: number, col: number): WinResult | null
{
    const player: Cell = grid[row][col];

    if (player === EMPTY)
    {
        return null;
    }

    const size = grid.length;

    for (const { dr, dc } of DIRECTIONS)
    {
        const cells: { row: number, col: number }[] = [{ row, col }];

        let r = row + dr;
        let c = col + dc;

        while (r >= 0 && r < size && c >= 0 && c < size && grid[r][c] === player)
        {
            cells.push({ row: r, col: c });
            r += dr;
            c += dc;
        }

        r = row - dr;
        c = col - dc;

        while (r >= 0 && r < size && c >= 0 && c < size && grid[r][c] === player)
        {
            cells.unshift({ row: r, col: c });
            r -= dr;
            c -= dc;
        }

        if (cells.length >= 5)
        {
            const lastIndex = cells.findIndex(cell => cell.row === row && cell.col === col);
            const start = Math.max(0, Math.min(lastIndex - 4, cells.length - 5));

            return { winner: player as Player, cells: cells.slice(start, start + 5) };
        }
    }

    return null;
}

export class BoardState
{
    readonly size: number;
    grid: Cell[][];
    currentPlayer: Player = BLACK;
    moveCount = 0;

    constructor (size = 15)
    {
        this.size = size;
        this.grid = [];

        for (let r = 0; r < size; r++)
        {
            this.grid.push(new Array<Cell>(size).fill(EMPTY));
        }
    }

    validCell (row: number, col: number): boolean
    {
        return row >= 0 && row < this.size && col >= 0 && col < this.size;
    }

    isValidMove (row: number, col: number): boolean
    {
        return this.validCell(row, col) && this.grid[row][col] === EMPTY;
    }

    place (row: number, col: number): boolean
    {
        if (!this.isValidMove(row, col))
        {
            return false;
        }

        this.grid[row][col] = this.currentPlayer;
        this.moveCount++;
        this.currentPlayer = this.currentPlayer === BLACK ? WHITE : BLACK;

        return true;
    }
}