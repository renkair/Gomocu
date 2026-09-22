export const GRID_SIZE = 15;

export const BOARD_TEXTURE_WIDTH = 2060;
export const BOARD_TEXTURE_HEIGHT = 2048;
export const BOARD_DISPLAY_SIZE = 768;

export const GRID_X0 = 128;
export const GRID_Y0 = 124;
export const GRID_X1 = 1934;
export const GRID_Y1 = 1927;

export const GRID_SPACING_X = (GRID_X1 - GRID_X0) / (GRID_SIZE - 1);
export const GRID_SPACING_Y = (GRID_Y1 - GRID_Y0) / (GRID_SIZE - 1);

export const PIECE_CIRCLE = { x: 477, y: 397, width: 1194, height: 1192 };
export const PIECE_DISPLAY_DIAMETER = 44;
export const SHADOW_CIRCLE_WIDTH = 4268;

export interface BoardOrigin
{
    x: number;
    y: number;
}

export interface GridPoint
{
    col: number;
    row: number;
}

const textureScale = BOARD_DISPLAY_SIZE / BOARD_TEXTURE_WIDTH;

export function gridToScreen (col: number, row: number, origin: BoardOrigin): { x: number, y: number }
{
    return {
        x: origin.x + (GRID_X0 + col * GRID_SPACING_X) * textureScale,
        y: origin.y + (GRID_Y0 + row * GRID_SPACING_Y) * textureScale
    };
}

export function screenToGrid (x: number, y: number, origin: BoardOrigin): GridPoint | null
{
    const tx = (x - origin.x) / textureScale;
    const ty = (y - origin.y) / textureScale;

    const col = Math.round((tx - GRID_X0) / GRID_SPACING_X);
    const row = Math.round((ty - GRID_Y0) / GRID_SPACING_Y);

    if (col < 0 || col >= GRID_SIZE || row < 0 || row >= GRID_SIZE)
    {
        return null;
    }

    if (Math.abs(tx - (GRID_X0 + col * GRID_SPACING_X)) > GRID_SPACING_X / 2)
    {
        return null;
    }

    if (Math.abs(ty - (GRID_Y0 + row * GRID_SPACING_Y)) > GRID_SPACING_Y / 2)
    {
        return null;
    }

    return { col, row };
}

export function pieceDisplaySize (textureWidth: number, textureHeight: number): { width: number, height: number }
{
    const width = PIECE_DISPLAY_DIAMETER * textureWidth / PIECE_CIRCLE.width;
    const height = width * textureHeight / textureWidth;

    return { width, height };
}

export function shadowDisplaySize (textureWidth: number, textureHeight: number): { width: number, height: number }
{
    const width = PIECE_DISPLAY_DIAMETER * textureWidth / SHADOW_CIRCLE_WIDTH;
    const height = width * textureHeight / textureWidth;

    return { width, height };
}