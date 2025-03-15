/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./style.css";

import { DataStore } from "@api/index";
import { addServerListElement, removeServerListElement, ServerListRenderPosition } from "@api/ServerList";
import { Devs } from "@utils/constants";
import { ModalProps, ModalRoot, openModal } from "@utils/modal";
import definePlugin from "@utils/types";
import { Button, React, showToast, Toasts, useEffect, useState } from "@webpack/common";

const steamGamesStoreKey = "Vencord.steamgames";

const SteamUIButton = () => (
    <Button
        onClick={handleButtonClick}
        size={Button.Sizes.MIN}
        color={Button.Colors.CUSTOM}
        className="vc-steam-ui-button"
    >
        <div className="vc-steam-ui-button-content">
            <svg className="steam-ui-button" viewBox="0 0 32 32" fill="currentColor">
                <path fill="currentColor" className="st0" d="M25.721,6.393c-3.062,0-5.553,2.49-5.553,5.552c0,0.512,0.092,0.999,0.223,1.47l-2.225,3.511
                c-0.295-0.068-0.599-0.113-0.913-0.113c-0.983,0-1.874,0.367-2.575,0.954l-6.634-2.911c0.005-0.079,0.023-0.152,0.023-0.231
                c0-2.224-1.811-4.033-4.034-4.033S0,12.4,0,14.625c0,2.225,1.81,4.034,4.033,4.034c0.828,0,1.598-0.25,2.238-0.681l6.966,3.058
                c0.102,2.135,1.855,3.846,4.016,3.846c2.224,0,4.033-1.81,4.033-4.034c0-0.167-0.028-0.327-0.05-0.489l3.736-2.936
                c0.246,0.035,0.492,0.076,0.748,0.076c3.062,0,5.553-2.491,5.553-5.553C31.273,8.882,28.782,6.393,25.721,6.393z M2.142,14.625
                c0-1.042,0.849-1.891,1.891-1.891c1.043,0,1.892,0.848,1.892,1.891c0,1.043-0.849,1.891-1.892,1.891
                C2.991,16.516,2.142,15.668,2.142,14.625z M17.253,22.803c-1.08,0-1.958-0.877-1.958-1.957c0-1.079,0.878-1.959,1.958-1.959
                c1.079,0,1.957,0.879,1.957,1.959S18.332,22.803,17.253,22.803z M25.721,15.117c-1.75,0-3.172-1.423-3.172-3.172
                s1.422-3.172,3.172-3.172s3.172,1.423,3.172,3.172S27.471,15.117,25.721,15.117z" />
            </svg>
        </div>
    </Button>
);

const handleButtonClick = async () => {
    openModal(props => <SteamUIModalContent rootProps={props} />);
};

const SteamUIModalContent = ({ rootProps }: { rootProps: ModalProps; }) => {
    const [steamGames, setSteamGames] = useState<{
        id: string;
        name: string;
        image: string;
    }[]>([]);

    useEffect(() => {
        const loadGameState = async () => {
            const savedState = await DataStore.get(steamGamesStoreKey);
            if (savedState) {
                const { steamGames } = savedState;
                if (steamGames) {

                    // order games by name
                    steamGames.sort((a, b) => a.name.localeCompare(b.name));

                    setSteamGames(steamGames);
                }
            }
        };
        loadGameState();
    }, []);

    const runSteamGame = (game: String) => {
        open(`steam://rungameid/${game}`);
    };

    const addGame = () => {
        const gameId = document.getElementById("steam-game-id") as HTMLInputElement;

        if (!gameId.value) {
            showToast("Please enter a game ID!", Toasts.Type.FAILURE);
            return;
        }

        if (!/^\d+$/.test(gameId.value)) {
            const match = gameId.value.match(/store.steampowered.com\/app\/(\d+)/);
            if (match) {
                gameId.value = match[1];
            } else {
                showToast("Please enter a valid game ID or shop link!", Toasts.Type.FAILURE);
                return;
            }
        }

        showToast("Searching game...", Toasts.Type.LINK);

        fetch("https://api.allorigins.win/get?url=" + encodeURIComponent(`https://store.steampowered.com/api/appdetails?appids=${gameId.value}`))
            .then(response => response.json())
            .then(data => {

                const gameData = JSON.parse(data.contents);
                console.log(gameData);

                if (gameData === null) {
                    console.error("Failed to fetch game data");
                    showToast("No game with this id was found!", Toasts.Type.FAILURE);
                    return;
                }

                if (gameData[gameId.value].success) {
                    showToast("Game found!", Toasts.Type.SUCCESS);
                    const { name, header_image } = gameData[gameId.value].data;
                    const newGame = {
                        id: gameId.value,
                        name,
                        image: header_image,
                    };
                    setSteamGames([...steamGames, newGame]);
                } else {
                    console.error("Failed to fetch game data");
                    showToast("No game with this id was found!", Toasts.Type.FAILURE);
                }
            }
            );
    };

    const removeGame = (index: number) => {
        const newGames = [...steamGames];
        newGames.splice(index, 1);
        setSteamGames(newGames);
        showToast("Game removed!", Toasts.Type.SUCCESS);
    };

    function saveGameState() {
        DataStore.set(steamGamesStoreKey, { steamGames });
        showToast("Games saved!", Toasts.Type.SUCCESS);
    }

    return (
        <ModalRoot className="vc-steam-ui" {...rootProps}>
            <div className="vc-steam-ui-modal">
                <div className="vc-steam-ui-modal-content">
                    <div className="vc-steam-ui-modal-header">
                        <h2>Steam Games</h2>
                    </div>
                    <div className="vc-steam-ui-modal-body">
                        {steamGames.map((game, index) => (
                            <div key={game.id} className="vc-steam-ui-game" onClick={() => runSteamGame(game.id)} onContextMenu={() => removeGame(index)}>
                                <img src={game.image} alt={game.name} />
                                <h3>{game.name}</h3>
                            </div>
                        ))}
                    </div>
                    <div className="vc-steam-ui-modal-footer">
                        <input type="text" placeholder="Enter a Steam game ID or Shop Link" id="steam-game-id" />
                        <Button onClick={addGame}>Add Game</Button>
                        <Button onClick={saveGameState}>Save</Button>
                    </div>
                </div>
            </div>
        </ModalRoot>
    );
};

export default definePlugin({
    name: "Steam Games",
    description: "Adds a button to the server list to open your Steam games.",
    authors: [Devs.Leonlp9],
    dependencies: ["ServerListAPI"],

    renderSteamUIButton: SteamUIButton,

    start() {
        addServerListElement(ServerListRenderPosition.Above, this.renderSteamUIButton);
    },

    stop() {
        removeServerListElement(ServerListRenderPosition.Above, this.renderSteamUIButton);
    },
});
