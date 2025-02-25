/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./minesweeper.css";

import { ModalContent, ModalProps, ModalRoot, openModal } from "@utils/modal";
import { useEffect, useState } from "@webpack/common";

import { defineOfflineGame } from "../index";

const ROWS = 16;
const COLS = 16;
const BOMBS = 40;

const generateBoard = () => {
    const board = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => ({
        isBomb: false,
        revealed: false,
        clicked_bomb: false,
        adjacentBombs: 0,
        flagged: false,
        distance: 0
    })));

    // place bombs in 2d array
    for (let i = 0; i < BOMBS; i++) {
        let row, col;
        do {
            row = Math.floor(Math.random() * ROWS);
            col = Math.floor(Math.random() * COLS);
        } while (board[row][col].isBomb === true);
        board[row][col].isBomb = true;
    }

    // calculate adjacent bombs
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (board[y][x].isBomb) continue;
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
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
    const [board, setBoard] = useState(generateBoard);
    const [gameOver, setGameOver] = useState(false);
    const [win, setWin] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [startTimestamp, setStartTimestamp] = useState(Date.now());
    const [started, setStarted] = useState(false);

    const revealCell = (row1: number, col1: number) => {

        if (!started) {
            setStarted(true);
            setStartTimestamp(Date.now());
        }

        if (gameOver) return;
        if (win) return;

        const bombList: Array<any> = [];

        const getNearestBomb = (row: number, col: number, i: number) => {
            if (i >= BOMBS) return;
            // aus neareast bomb die mit row und col löschen
            bombList.forEach((bomb, index) => {
                if (bomb.y === row && bomb.x === col) {
                    bombList.splice(index, 1);
                }
            });

            // suche die nächste bomb von row und col aus im 2d array
            let nearest = { y: Infinity, x: Infinity };
            let nearestDistance = Infinity;
            bombList.forEach(bomb => {
                const distance = Math.sqrt((row - bomb.y) ** 2 + (col - bomb.x) ** 2);
                if (distance < nearestDistance) {
                    nearest = bomb;
                    nearestDistance = distance;
                }
            });

            newBoard[nearest.y][nearest.x].distance = Math.sqrt((row1 - nearest.y) ** 2 + (col1 - nearest.x) ** 2) * i * 0.1;
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
                // reveal all bombs
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
                for (let y = -1; y <= 1; y++) {
                    for (let x = -1; x <= 1; x++) {
                        reveal(row + y, col + x);
                        setBoard(newBoard);
                    }
                }
            }
        };

        // reveal all cells around the cell if the cell was clicked, and is revealed
        if (board[row1][col1].revealed) {
            for (let y = -1; y <= 1; y++) {
                for (let x = -1; x <= 1; x++) {
                    const row = row1 + y;
                    const col = col1 + x;
                    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) continue;
                    if (board[row][col].flagged) continue;
                    reveal(row, col);
                }
            }
            return;
        }

        reveal(row1, col1);

        setBoard(newBoard);
    };

    const toggleFlag = (row: number, col: number) => {
        if (gameOver) return;
        if (win) return;

        const newBoard = board.map(row => row.slice());
        newBoard[row][col].flagged = !newBoard[row][col].flagged;
        setBoard(newBoard);
    };

    // wenn alle bomben geflaggt sind
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
                            BOMBS - board.reduce((acc, row) => acc +
                                row.filter(cell => cell.flagged).length, 0)
                        ).padStart(3, "0").split("").map((num, index) => (
                            <div key={index} className={`header-num-${num} header-num`}></div>
                        ))}
                    </div>
                    <button onClick={() => {
                        setBoard(generateBoard);
                        setGameOver(false);
                        setSeconds(0);
                        setStartTimestamp(Date.now());
                        setStarted(false);
                        setWin(false);
                    }} className={`restart-button ${gameOver ? "gameover" : ""} ${isWin() ? "win" : ""}`}></button>
                    <div className="timer">
                        {String(seconds).padStart(3, "0").split("").map((num, index) => (
                            <div key={index} className={`header-num-${num} header-num`}></div>
                        ))}
                    </div>
                </div>

                <div className="minesweeper-board">
                    {board.map((row, y) => (
                        <div key={y} className="minesweeper-row">
                            {row.map((cell, x) => (
                                <div
                                    key={x}
                                    className={`minesweeper-cell ${cell.revealed ? (cell.isBomb ? (cell.clicked_bomb ? "clickedbomb" : "revealedbomb") : `revealed revealed${cell.adjacentBombs}`) : ""} ${cell.flagged ? "flagged" : ""}`}
                                    onClick={() => {
                                        if (board[y][x].flagged) return;
                                        revealCell(y, x);
                                    }}
                                    onContextMenu={e => {
                                        e.preventDefault();

                                        if (board[y][x].revealed) return;
                                        toggleFlag(y, x);
                                    }}
                                    style={{ transitionDelay: `${cell.distance * 0.05}s`, animationDelay: `${cell.distance * 0.05}s` }}
                                >
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
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
