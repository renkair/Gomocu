import { Scene } from 'phaser';
import { BLACK, BoardState, checkWin, WHITE, type Player, type WinResult } from '../core/gameLogic';
import { gridToScreen, pieceDisplaySize, screenToGrid, shadowDisplaySize, PIECE_DISPLAY_DIAMETER, type BoardOrigin } from '../core/board';

interface Stone
{
    row: number;
    col: number;
    image: Phaser.GameObjects.Image;
}

export class Game extends Scene
{
    camera!: Phaser.Cameras.Scene2D.Camera;
    boardOrigin: BoardOrigin = { x: 0, y: 0 };
    state!: BoardState;
    stones: Stone[] = [];
    stoneSizes: Record<string, { width: number, height: number }> = {};
    turnText!: Phaser.GameObjects.Text;
    gameOver = false;
    banner!: Phaser.GameObjects.Container;
    winRings: Phaser.GameObjects.Arc[] = [];
    pending: { row: number, col: number } | null = null;
    shadowImage: Phaser.GameObjects.Image | null = null;
    shadowSize: { width: number, height: number } | null = null;

    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x1a1a1a);

        this.add.image(512, 384, 'background').setAlpha(0.5);

        const board = this.add.image(512, 384, 'board').setDisplaySize(768, 768);
        this.boardOrigin = {
            x: board.x - board.displayWidth / 2,
            y: board.y - board.displayHeight / 2
        };

        this.state = new BoardState();
        this.stones = [];
        this.gameOver = false;

        this.turnText = this.add.text(512, 22, '', {
            fontFamily: 'Arial Black', fontSize: 24, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        });
        this.turnText.setOrigin(0.5);
        this.updateTurnText();

        this.createBanner();

        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {

            this.handlePointer(pointer.x, pointer.y);

        });
    }

    createBanner ()
    {
        const panel = this.add.rectangle(512, 384, 520, 180, 0x000000).setAlpha(0.75);
        panel.setStrokeStyle(2, 0xffffff);

        const title = this.add.text(512, 336, '', {
            fontFamily: 'Arial Black', fontSize: 36, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8, align: 'center'
        });
        title.setOrigin(0.5);

        const playAgainText = this.add.text(452, 430, 'Play Again', {
            fontFamily: 'Arial Black', fontSize: 24, color: '#ffffff',
            backgroundColor: '#0a5c1a', padding: { x: 8, y: 4 }
        });
        playAgainText.setInteractive({ useHandCursor: true });
        playAgainText.on('pointerdown', () => this.restartGame());

        const menuText = this.add.text(584, 430, 'Menu', {
            fontFamily: 'Arial Black', fontSize: 24, color: '#ffffff',
            backgroundColor: '#5c2b0a', padding: { x: 8, y: 4 }
        });
        menuText.setInteractive({ useHandCursor: true });
        menuText.on('pointerdown', () => this.scene.start('MainMenu'));

        this.banner = this.add.container(0, 0, [panel, title, playAgainText, menuText]);
        this.banner.setDepth(1000);
        this.banner.setVisible(false);
        this.banner.setData('title', title);
    }

    handlePointer (x: number, y: number)
    {
        if (this.gameOver)
        {
            return;
        }

        const point = screenToGrid(x, y, this.boardOrigin);

        if (!point)
        {
            return;
        }

        this.tapCell(point.row, point.col);
    }

    tapCell (row: number, col: number)
    {
        if (this.pending)
        {
            if (this.pending.row === row && this.pending.col === col)
            {
                this.confirmPlacement();
            }
            else if (this.state.isValidMove(row, col))
            {
                this.setShadow(row, col);
            }
        }
        else if (this.state.isValidMove(row, col))
        {
            this.setShadow(row, col);
        }
    }

    setShadow (row: number, col: number)
    {
        this.pending = { row, col };
        this.showShadow(row, col);
    }

    showShadow (row: number, col: number)
    {
        const { x, y } = gridToScreen(col, row, this.boardOrigin);

        if (!this.shadowImage)
        {
            this.shadowImage = this.add.image(x, y, 'shadow');
            this.shadowImage.setDisplaySize(this.getShadowSize().width, this.getShadowSize().height);
        }

        this.shadowImage.setPosition(x, y);
        this.shadowImage.setVisible(true);
    }

    hideShadow ()
    {
        if (this.shadowImage)
        {
            this.shadowImage.setVisible(false);
        }

        this.pending = null;
    }

    getShadowSize (): { width: number, height: number }
    {
        if (!this.shadowSize)
        {
            const image = this.textures.get('shadow').getSourceImage() as HTMLImageElement;
            this.shadowSize = shadowDisplaySize(image.width, image.height);
        }

        return this.shadowSize;
    }

    confirmPlacement ()
    {
        if (!this.pending)
        {
            return;
        }

        this.tryPlace(this.pending.row, this.pending.col);
        this.hideShadow();
    }

    tryPlace (row: number, col: number)
    {
        if (this.gameOver || !this.state.isValidMove(row, col))
        {
            return;
        }

        const player = this.state.currentPlayer;
        this.state.place(row, col);
        this.addStone(row, col, player === BLACK ? 'black' : 'white');

        const win: WinResult | null = checkWin(this.state.grid, row, col);

        if (win)
        {
            this.endGame(win.winner, win.cells);
        }
        else if (this.state.moveCount === this.state.size * this.state.size)
        {
            this.endGame(null, null);
        }
        else
        {
            this.updateTurnText();
        }
    }

    addStone (row: number, col: number, key: string)
    {
        const { x, y } = gridToScreen(col, row, this.boardOrigin);
        const size = this.getStoneSize(key);

        const image = this.add.image(x, y, key).setDisplaySize(size.width, size.height);
        this.stones.push({ row, col, image });
    }

    getStoneSize (key: string): { width: number, height: number }
    {
        let size = this.stoneSizes[key];

        if (!size)
        {
            const image = this.textures.get(key).getSourceImage() as HTMLImageElement;
            size = pieceDisplaySize(image.width, image.height);
            this.stoneSizes[key] = size;
        }

        return size;
    }

    endGame (winner: Player | null, winCells: { row: number, col: number }[] | null)
    {
        this.gameOver = true;

        const title = this.banner.getData('title') as Phaser.GameObjects.Text;

        if (winner === BLACK)
        {
            title.setText('Black wins!');
        }
        else if (winner === WHITE)
        {
            title.setText('White wins!');
        }
        else
        {
            title.setText("It's a draw!");
        }

        if (winCells)
        {
            for (const cell of winCells)
            {
                const { x, y } = gridToScreen(cell.col, cell.row, this.boardOrigin);
                const ring = this.add.circle(x, y, PIECE_DISPLAY_DIAMETER / 2 + 6, 0x000000, 0)
                    .setStrokeStyle(4, 0xffdd00);
                this.winRings.push(ring);
            }
        }

        this.turnText.setText('Game over');
        this.banner.setVisible(true);
    }

    restartGame ()
    {
        for (const stone of this.stones)
        {
            stone.image.destroy();
        }

        for (const ring of this.winRings)
        {
            ring.destroy();
        }

        this.stones = [];
        this.winRings = [];
        this.hideShadow();
        this.state = new BoardState();
        this.gameOver = false;
        this.banner.setVisible(false);
        this.updateTurnText();
    }

    updateTurnText ()
    {
        const player = this.state.currentPlayer;
        this.turnText.setText(player === BLACK ? 'Black to move' : 'White to move');
    }
}