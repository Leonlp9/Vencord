/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./fileViewer.css";

import { addMessageAccessory, removeMessageAccessory } from "@api/MessageAccessories";
import ErrorBoundary from "@components/ErrorBoundary";
// Entferne die Importe der Icons, da sie nicht mehr benötigt werden
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { useEffect, useState } from "@webpack/common";

let style: HTMLStyleElement;

interface Attachment {
    id: string;
    filename: string;
    size: number;
    url: string;
    proxy_url: string;
    content_type: string;
    content_scan_version: number;
    title: string;
    spoiler: boolean;
    previewBlobUrl?: string;
}

const stripLink = (url: string) =>
    url.replace("https://cdn.discordapp.com/attachments/", "").split("/").slice(0, 2).join("-");

function FilePreview({ attachment }: { attachment: Attachment; }) {
    const [url, setUrl] = useState<string | undefined>(attachment.previewBlobUrl);

    useEffect(() => {
        const initPreview = async () => {
            const ext = attachment.filename.split(".").pop()?.toLowerCase() || "";
            const officeExtensions = ["ppt", "pptx", "doc", "docx", "xls", "xlsx", "odt"];
            const googleExtensions = ["pdf"];
            const objectExtensions = ["stl", "obj", "vf", "vsj", "vsb", "3mf"];

            const isGoogleExtension = googleExtensions.includes(ext);
            const isOfficeExtension = officeExtensions.includes(ext);
            const isObjectExtension = objectExtensions.includes(ext);

            if (!(isGoogleExtension || isOfficeExtension || isObjectExtension)) {
                return;
            }

            const originalUrl = attachment.url;
            const googleUrl = `https://drive.google.com/viewerng/viewer?url=${encodeURIComponent(originalUrl)}`;
            const officeUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(originalUrl)}`;
            const objectUrl = `https://www.viewstl.com/?embedded&url=${encodeURIComponent(originalUrl)}`;

            const embedUrl = isGoogleExtension ? googleUrl : (isOfficeExtension ? officeUrl : objectUrl);
            setUrl(embedUrl);
        };

        if (!url) {
            initPreview();
        }
    }, [attachment, url]);

    return url ? (
        <div className="file-preview">
            <a href={url} target="_blank" rel="noreferrer">
                <button className="button__201d5 lookFilled__201d5 colorBrand__201d5 sizeSmall__201d5 grow__201d5">
                    Web Preview
                </button>
            </a>
        </div>
    ) : null;
}

export default definePlugin({
    name: "FileViewer",
    description: "Preview PDF Files without having to download them",
    authors: [Devs.Leonlp9],
    dependencies: ["MessageAccessoriesAPI", "MessageUpdaterAPI"],
    patches: [
        {
            find: "Messages.IMG_ALT_ATTACHMENT_FILE_TYPE.format",
            replacement: {
                match: /function\((.+?)\)(.+Fragment.{0,500}newMosaicStyle.{0,500}?children:\[)(.+?\])/,
                replace: "function($1)$2$3"
            }
        }
    ],
    start() {
        addMessageAccessory("fileViewer", props => {
            const pdfAttachments = props.message.attachments;

            return (
                <ErrorBoundary>
                    {pdfAttachments.map((attachment, index) => (
                        <FilePreview key={index} attachment={attachment} />
                    ))}
                </ErrorBoundary>
            );
        }, -1);

        style = document.createElement("style");
        style.id = "VencordFileViewer";
        document.head.appendChild(style);
    },
    // In renderPreviewButton geben wir nichts zurück, da wir die Preview standardmäßig anzeigen
    renderPreviewButton(e) {
        return null;
    },
    stop() {
        removeMessageAccessory("fileViewer");
        style.remove();
    }
});
