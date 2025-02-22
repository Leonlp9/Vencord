/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { ApplicationCommandInputType, ApplicationCommandOptionType } from "@api/Commands";
import { Devs } from "@utils/constants";
import { sendMessage } from "@utils/discord";
import definePlugin from "@utils/types";
import { SelectedChannelStore } from "@webpack/common";

const typesWithCrops = {
    "default": ["full", "bust", "face"],
    "marching": ["full", "bust", "face"],
    "walking": ["full", "bust", "face"],
    "crouching": ["full", "bust", "face"],
    "crossed": ["full", "bust", "face"],
    "criss_cross": ["full", "bust", "face"],
    "ultimate": ["full", "bust", "face"],
    "isometric": ["full", "bust", "face", "head"],
    "head": ["full"],
    "custom": ["full", "bust", "face"],
    "cheering": ["full", "bust", "face"],
    "relaxing": ["full", "bust", "face"],
    "trudging": ["full", "bust", "face"],
    "cowering": ["full", "bust", "face"],
    "pointing": ["full", "bust", "face"],
    "lunging": ["full", "bust", "face"],
    "dungeons": ["full", "bust", "face"],
    "facepalm": ["full", "bust", "face"],
    "sleeping": ["full", "bust"],
    "dead": ["full", "bust", "face"],
    "archer": ["full", "bust", "face"],
    "kicking": ["full", "bust", "face"],
    "mojavatar": ["full", "bust"],
    "reading": ["full", "bust", "face"],
    "high_ground": ["full", "bust", "face"],
    "bitzel": ["full", "bust", "face"],
    "pixel": ["full", "bust", "face"],
    "ornament": ["full"]
};

const commands = Object.entries(typesWithCrops).map(([type, crops]) => ({
    inputType: ApplicationCommandInputType.BUILT_IN,
    name: `skinrender-${type}`,
    description: `Create a ${type} render of the player's skin. Available crops: ${crops.join(", ")}`,
    options: [
        {
            name: "uuidOrName",
            description: "The UUID or name of the player",
            type: ApplicationCommandOptionType.STRING,
            required: true
        },
        {
            name: "crop",
            description: "The crop type of the render. Available crops: " + crops.join(", "),
            type: ApplicationCommandOptionType.STRING,
            required: false
        }
    ],
    execute: async opts => {
        const uuid = opts.find(opt => opt.name === "uuidOrName")?.value;
        const crop = opts.find(opt => opt.name === "crop")?.value || "full";

        if (!uuid) {
            throw new Error("The uuidOrName option is required.");
        }

        if (!crops.includes(crop)) {
            throw new Error(`Invalid crop type. Available crops for ${type}: ${crops.join(", ")}`);
        }

        const url = `https://starlightskins.lunareclipse.studio/render/${type}/${uuid}/${crop}`;

        // Thus, setTimeout is needed to make this execute after Discord cleared the input
        setTimeout(() => sendTextToChat(`${url} `), 10);
    },
}));

function formatUUID(uuid: string): string {
    return `${uuid.slice(0, 8)}-${uuid.slice(8, 12)}-${uuid.slice(12, 16)}-${uuid.slice(16, 20)}-${uuid.slice(20)}`;
}
const getUsernameCommand = {
    inputType: ApplicationCommandInputType.BUILT_IN,
    name: "get-uuid",
    description: "Get the UUID of a player by their username",
    options: [
        {
            name: "username",
            description: "The username of the player",
            type: ApplicationCommandOptionType.STRING,
            required: true
        }
    ],
    execute: async opts => {
        const username = opts.find(opt => opt.name === "username")?.value;

        if (!username) {
            throw new Error("The username option is required.");
        }

        const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(`https://api.mojang.com/users/profiles/minecraft/${username}`)}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        if (!response.ok) {
            throw new Error("Failed to fetch UUID. The username might be incorrect.");
        }

        const data = await response.json();

        const { name, id } = JSON.parse(data.contents);
        const formattedId = formatUUID(id);

        // Thus, setTimeout is needed to make this execute after Discord cleared the input
        setTimeout(() => sendTextToChat(`The UUID for ${name} is ${formattedId}`), 10);
    },
};
commands.push(getUsernameCommand);

const pingMinecraftServerCommand = {
    inputType: ApplicationCommandInputType.BUILT_IN,
    name: "ping-minecraft-server",
    description: "Ping a Minecraft server to get its status",
    options: [
        {
            name: "address",
            description: "The address of the server",
            type: ApplicationCommandOptionType.STRING,
            required: true
        }
    ],
    execute: async opts => {
        const address = opts.find(opt => opt.name === "address")?.value;

        if (!address) {
            throw new Error("The address option is required.");
        }

        const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(`https://api.mcsrvstat.us/2/${address}`)}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        if (!response.ok) {
            throw new Error("Failed to fetch server status. The address might be incorrect.");
        }

        const data = await response.json();

        const { online, players, motd } = JSON.parse(data.contents);

        const playerCount = players.online;
        const maxPlayers = players.max;
        const motdText = motd.clean.join("\n");

        // Thus, setTimeout is needed to make this execute after Discord cleared the input
        setTimeout(() => sendTextToChat(`## Server Status for [${address}](https://mcsrvstat.us/server/${address})\n
            \nThe server is **${online ? "online" : "offline"}** with **${playerCount}/${maxPlayers}** players.\n\n**MOTD:**\n\`${motdText}\``), 10);
    },
};
commands.push(pingMinecraftServerCommand);

const getUUIDCommand = {
    inputType: ApplicationCommandInputType.BUILT_IN,
    name: "getUsername",
    description: "Get the username of a player by their UUID",
    options: [
        {
            name: "uuid",
            description: "The UUID of the player",
            type: ApplicationCommandOptionType.STRING,
            required: true
        }
    ],
    execute: async opts => {
        const uuid = opts.find(opt => opt.name === "uuid")?.value;

        if (!uuid) {
            throw new Error("The uuid option is required.");
        }

        const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(`https://playerdb.co/api/player/minecraft/${uuid}`)}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        if (!response.ok) {
            throw new Error("Failed to fetch username. The UUID might be incorrect.");
        }
        const data = await response.json();

        const { player } = JSON.parse(data.contents).data;
        const name = player.username;

        // Thus, setTimeout is needed to make this execute after Discord cleared the input
        setTimeout(() => sendTextToChat(`The username for ${uuid} is [${name}](https://namemc.com/profile/${uuid})`), 10);
    }
};
commands.push(getUUIDCommand);

export default definePlugin({
    name: "minecraftTools",
    description: "Adds a /skinrender command to render Minecraft skins",
    authors: [Devs.Leonlp9],
    commands
});

function sendTextToChat(text: string) {
    const channelId = SelectedChannelStore.getChannelId();
    sendMessage(channelId, { content: text });
}
