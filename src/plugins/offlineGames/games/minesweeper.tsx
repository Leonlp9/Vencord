/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./minesweeper.css";

import { showNotification } from "@api/Notifications";
import { ModalContent, ModalProps, ModalRoot, openModal } from "@utils/modal";
import { useEffect, useState } from "@webpack/common";

import { defineOfflineGame } from "../index";

const generateBoard = (ROWS: number, COLS: number, BOMBS: number, RANGE: number) => {

    // validieren
    if (ROWS < 1 || COLS < 1 || BOMBS < 1 || RANGE < 1) {
        showNotification({
            color: "#eed202",
            title: "Invalid settings",
            body: "Please make sure all settings are greater than 0",
            noPersist: true
        });
        return Array.from({ length: 1 }, () =>
            Array.from({ length: 1 }, () => ({
                isBomb: false,
                revealed: false,
                clicked_bomb: false,
                adjacentBombs: 0,
                flagged: false,
                distance: 0
            }))
        );
    }
    if (ROWS * COLS <= BOMBS) {
        showNotification({
            color: "#eed202",
            title: "Invalid settings",
            body: "Please make sure the number of bombs is less than the number of cells",
            noPersist: true
        });
        return Array.from({ length: 1 }, () =>
            Array.from({ length: 1 }, () => ({
                isBomb: false,
                revealed: false,
                clicked_bomb: false,
                adjacentBombs: 0,
                flagged: false,
                distance: 0
            }))
        );
    }

    const board = Array.from({ length: ROWS }, () =>
        Array.from({ length: COLS }, () => ({
            isBomb: false,
            revealed: false,
            clicked_bomb: false,
            adjacentBombs: 0,
            flagged: false,
            distance: 0
        }))
    );

    // Bomben zufällig setzen
    for (let i = 0; i < BOMBS; i++) {
        let row, col;
        do {
            row = Math.floor(Math.random() * ROWS);
            col = Math.floor(Math.random() * COLS);
        } while (board[row][col].isBomb);
        board[row][col].isBomb = true;
    }

    // Berechnung der benachbarten Bomben anhand des RANGE-Werts
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (board[y][x].isBomb) continue;
            for (let dy = -RANGE; dy <= RANGE; dy++) {
                for (let dx = -RANGE; dx <= RANGE; dx++) {
                    if (dy === 0 && dx === 0) continue;
                    if (y + dy < 0 || y + dy >= ROWS || x + dx < 0 || x + dx >= COLS) continue;
                    if (board[y + dy][x + dx].isBomb) {
                        board[y][x].adjacentBombs++;
                    }
                }
            }
        }
    }

    return board;
};

const MinesweeperModalContent = ({ rootProps }: { rootProps: ModalProps; }) => {
    const [gameOver, setGameOver] = useState(false);
    const [win, setWin] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [startTimestamp, setStartTimestamp] = useState(Date.now());
    const [started, setStarted] = useState(false);
    const [ROWS, setROWS] = useState(16);
    const [COLS, setCOLS] = useState(16);
    const [BOMBS, setBOMBS] = useState(40);
    const [RANGE, setRANGE] = useState(1);
    const [board, setBoard] = useState(generateBoard(ROWS, COLS, BOMBS, RANGE));

    const revealCell = (row1: number, col1: number) => {
        if (!started) {
            setStarted(true);
            setStartTimestamp(Date.now());
        }
        if (gameOver || win) return;

        const bombList: Array<any> = [];

        const getNearestBomb = (row: number, col: number, i: number) => {
            if (i >= BOMBS) return;
            bombList.forEach((bomb, index) => {
                if (bomb.y === row && bomb.x === col) {
                    bombList.splice(index, 1);
                }
            });
            let nearest = { y: Infinity, x: Infinity };
            let nearestDistance = Infinity;
            bombList.forEach(bomb => {
                const distance = Math.sqrt((row - bomb.y) ** 2 + (col - bomb.x) ** 2);
                if (distance < nearestDistance) {
                    nearest = bomb;
                    nearestDistance = distance;
                }
            });
            newBoard[nearest.y][nearest.x].distance =
                Math.sqrt((row1 - nearest.y) ** 2 + (col1 - nearest.x) ** 2) * i * 0.1;
            newBoard[nearest.y][nearest.x].revealed = true;
            getNearestBomb(nearest.y, nearest.x, i + 1);
        };

        const newBoard = board.map(row => row.slice());
        const reveal = (row: number, col: number) => {
            if (row < 0 || row >= ROWS || col < 0 || col >= COLS || newBoard[row][col].revealed) return;
            newBoard[row][col].revealed = true;
            newBoard[row][col].flagged = false;
            newBoard[row][col].distance = Math.sqrt((row1 - row) ** 2 + (col1 - col) ** 2);

            if (newBoard[row][col].isBomb) {
                setGameOver(true);
                newBoard[row][col].clicked_bomb = true;
                for (let y = 0; y < ROWS; y++) {
                    for (let x = 0; x < COLS; x++) {
                        if (newBoard[y][x].isBomb) {
                            bombList.push({ y, x });
                        }
                    }
                }
                getNearestBomb(row1, col1, 0);
            } else if (newBoard[row][col].adjacentBombs === 0) {
                // Rekursives Aufdecken anhand des RANGE-Werts
                for (let dy = -RANGE; dy <= RANGE; dy++) {
                    for (let dx = -RANGE; dx <= RANGE; dx++) {
                        reveal(row + dy, col + dx);
                    }
                }
            }
        };

        // Wenn die Zelle bereits aufgedeckt ist, umgebe sie mit einem Feld, das RANGE berücksichtigt
        if (board[row1][col1].revealed) {
            for (let dy = -RANGE; dy <= RANGE; dy++) {
                for (let dx = -RANGE; dx <= RANGE; dx++) {
                    const r = row1 + dy;
                    const c = col1 + dx;
                    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
                    if (board[r][c].flagged) continue;
                    reveal(r, c);
                }
            }
            setBoard(newBoard);
            return;
        }

        reveal(row1, col1);
        setBoard(newBoard);
    };

    const toggleFlag = (row: number, col: number) => {
        if (gameOver || win) return;
        const newBoard = board.map(row => row.slice());
        newBoard[row][col].flagged = !newBoard[row][col].flagged;
        setBoard(newBoard);
    };

    const isWin = () => {
        if (gameOver) return false;
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (board[y][x].isBomb && !board[y][x].flagged) return false;
            }
        }
        if (!win) {
            setWin(true);
        }
        return true;
    };

    useEffect(() => {
        const interval = setInterval(() => {
            if (!gameOver && started && !isWin()) {
                setSeconds(Math.floor((Date.now() - startTimestamp) / 1000));
            }
        }, 100);
        return () => clearInterval(interval);
    });

    return (
        <ModalRoot {...rootProps} className="minesweeper-root">
            <ModalContent>
                <div className="minesweeper-header">
                    <div className="mines-to-flag-left">
                        {String(
                            BOMBS -
                            board.reduce(
                                (acc, row) => acc + row.filter(cell => cell.flagged).length,
                                0
                            )
                        )
                            .padStart(3, "0")
                            .split("")
                            .map((num, index) => (
                                <div key={index} className={`header-num-${num} header-num`}></div>
                            ))}
                    </div>
                    <button
                        onClick={() => {
                            setBoard(generateBoard(ROWS, COLS, (BOMBS > ROWS * COLS) ? ROWS * COLS - 1 : BOMBS, RANGE));
                            setGameOver(false);
                            setSeconds(0);
                            setStartTimestamp(Date.now());
                            setStarted(false);
                            setWin(false);
                        }}
                        className={`restart-button ${gameOver ? "gameover" : ""} ${isWin() ? "win" : ""
                            }`}
                    ></button>
                    <div className="timer">
                        {String(seconds)
                            .padStart(3, "0")
                            .split("")
                            .map((num, index) => (
                                <div key={index} className={`header-num-${num} header-num`}></div>
                            ))}
                    </div>
                </div>
                <div className="minesweeper-board" style={{ gridTemplateRows: `repeat(${ROWS}, 30px)`, width: `calc(${COLS} * 30px)` }}>
                    {board.map((row, y) => (
                        <div key={y} className="minesweeper-row" style={{ gridTemplateColumns: `repeat(${COLS}, 30px)` }}>
                            {row.map((cell, x) => (
                                <div
                                    key={x}
                                    className={`minesweeper-cell ${cell.revealed
                                        ? cell.isBomb
                                            ? cell.clicked_bomb
                                                ? "clickedbomb"
                                                : "revealedbomb"
                                            : `revealed revealed${cell.adjacentBombs}`
                                        : ""
                                        } ${cell.flagged ? "flagged" : ""}`}
                                    onClick={() => {
                                        if (board[y][x].flagged) return;
                                        revealCell(y, x);
                                    }}
                                    onContextMenu={e => {
                                        e.preventDefault();
                                        if (board[y][x].revealed) return;
                                        toggleFlag(y, x);
                                    }}
                                    style={{
                                        transitionDelay: `${cell.distance * 0.05}s`,
                                        animationDelay: `${cell.distance * 0.05}s`
                                    }}
                                ></div>
                            ))}
                        </div>
                    ))}
                </div>
                <details>
                    <summary>Settings</summary>
                    <div className="settings">
                        <label>
                            Rows:
                            <input
                                type="number"
                                value={ROWS}
                                onChange={e => {
                                    const value = parseInt(e.target.value) || 1;
                                    setROWS(value);
                                    setBoard(generateBoard(value, COLS, (BOMBS > value * COLS) ? value * COLS - 1 : BOMBS, RANGE));
                                    setGameOver(false);
                                    setSeconds(0);
                                    setStartTimestamp(Date.now());
                                    setStarted(false);
                                    setWin(false);
                                }}
                                min="1"
                            />
                        </label>
                        <label>
                            Columns:
                            <input
                                type="number"
                                value={COLS}
                                onChange={e => {
                                    const value = parseInt(e.target.value) || 1;
                                    setCOLS(value);
                                    setBoard(generateBoard(value, COLS, (BOMBS > value * COLS) ? value * COLS - 1 : BOMBS, RANGE));
                                    setGameOver(false);
                                    setSeconds(0);
                                    setStartTimestamp(Date.now());
                                    setStarted(false);
                                    setWin(false);
                                }
                                }
                                min="1"
                            />
                        </label>
                        <label>
                            Bombs:
                            <input
                                type="number"
                                value={BOMBS}
                                onChange={e => {

                                    const value = parseInt(e.target.value) || 1;
                                    setBOMBS(value);
                                    setBoard(generateBoard(value, COLS, (BOMBS > value * COLS) ? value * COLS - 1 : BOMBS, RANGE));
                                    setGameOver(false);
                                    setSeconds(0);
                                    setStartTimestamp(Date.now());
                                    setStarted(false);
                                    setWin(false);

                                }}
                                min="1"
                                max={ROWS * COLS - 1}
                            />
                        </label>
                        <label>
                            Range:
                            <input
                                type="number"
                                value={RANGE}
                                onChange={e => {
                                    const value = parseInt(e.target.value) || 1;
                                    setRANGE(value);
                                    setBoard(generateBoard(value, COLS, (BOMBS > value * COLS) ? value * COLS - 1 : BOMBS, RANGE));
                                    setGameOver(false);
                                    setSeconds(0);
                                    setStartTimestamp(Date.now());
                                    setStarted(false);
                                    setWin(false);
                                }
                                }
                                min="1"
                            />
                        </label>
                    </div>
                </details>
            </ModalContent>
        </ModalRoot>
    );
};

export default defineOfflineGame({
    name: "Minesweeper",
    description: "Play Minesweeper!",
    image: "https://m.media-amazon.com/images/I/71TKVp3UnRL.png",
    action: () => {
        openModal(props => <MinesweeperModalContent rootProps={props} />);
        console.log("Starting Minesweeper");
    }
});
