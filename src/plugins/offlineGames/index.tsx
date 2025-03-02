/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./style.css";

import { addChatBarButton, ChatBarButton, ChatBarButtonFactory, removeChatBarButton } from "@api/ChatButtons";
import { Devs } from "@utils/constants";
import { ModalContent, ModalHeader, ModalProps, ModalRoot, openModal } from "@utils/modal";
import definePlugin from "@utils/types";
import { React } from "@webpack/common";

const games: { name: string; description: string; image: string; action: () => void; }[] = [];

export function defineOfflineGame(arg0: { name: string; description: string; image: string; action: () => void; }) {
    games.push(arg0);
}

const GameSelectModalContent = ({ rootProps }: { rootProps: ModalProps; }) => {

    const handleGameClick = (game: any) => {
        game.action();
    };

    return (
        <ModalRoot {...rootProps} className="game-select-root">
            <ModalHeader>
                <h2>Offline Games</h2>
            </ModalHeader>
            <ModalContent className="game-select">
                {games.map((game, index) => (
                    <div key={index} onClick={() => handleGameClick(game)} className="game">
                        <img src={game.image} alt={game.name} />
                        <h3>{game.name}</h3>
                        <p>{game.description}</p>
                    </div>
                ))}
            </ModalContent>
        </ModalRoot>
    );
};

export const GameSelectButton: ChatBarButtonFactory = ({ isMainChat }) => {
    if (!isMainChat) return null;

    const handleOpenModal = () => {
        openModal(props => <GameSelectModalContent rootProps={props} />);
    };

    return (
        <ChatBarButton
            tooltip="Open Game Select"
            onClick={handleOpenModal}
        >
            <svg width="24" height="24" viewBox="0 0 24 24">
                <path
                    fill={"currentColor"}
                    mask={void 0}
                    d="M3.06 20.4q-1.53 0-2.37-1.065T.06 16.74l1.26-9q.27-1.8 1.605-2.97T6.06 3.6h11.88q1.8 0 3.135 1.17t1.605 2.97l1.26 9q.21 1.53-.63 2.595T20.94 20.4q-.63 0-1.17-.225T18.78 19.5l-2.7-2.7H7.92l-2.7 2.7q-.45.45-.99.675t-1.17.225Zm14.94-7.2q.51 0 .855-.345T19.2 12q0-.51-.345-.855T18 10.8q-.51 0-.855.345T16.8 12q0 .51.345 .855T18 13.2Zm-2.4-3.6q.51 0 .855-.345T16.8 8.4q0-.51-.345-.855T15.6 7.2q-.51 0-.855.345T14.4 8.4q0 .51.345 .855T15.6 9.6ZM6.9 13.2h1.8v-2.1h2.1v-1.8h-2.1v-2.1h-1.8v2.1h-2.1v1.8h2.1v2.1Z"
                />
            </svg>
        </ChatBarButton>
    );
};

export default definePlugin({
    name: "OfflineGames",
    description: "Play games offline!",
    authors: [Devs.Leonlp9],
    dependencies: ["MessageEventsAPI", "ChatInputButtonAPI"],
    start() {
        addChatBarButton("OfflineGamesButton", GameSelectButton);

        import("./games/cookieClicker");
        import("./games/tetris");
        import("./games/minesweeper");
    },
    stop() {
        removeChatBarButton("OfflineGamesButton");
    }
});
