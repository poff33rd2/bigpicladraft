// backend/vimeo.web.js
import { Permissions, webMethod } from "wix-web-module";
import { fetch } from "wix-fetch";
import { secrets } from "wix-secrets-backend.v2";
import { elevate } from "wix-auth";
import wixData from "wix-data";
import { ok, notFound, serverError } from "wix-http-functions"; // optional if you like these patterns
import { authorization } from "wix-members-backend";

const MEDIA_TYPE_NAMES = ["av", "social", "production"];
const VIMEO_BASE = "https://api.vimeo.com";
const CACHE_TAGS = {
    showcases: ["vimeoShowcases"],
    videos: ["vimeoShowcaseVideos"],
};

const elevatedGetSecretValue = elevate(secrets.getSecretValue);

async function getVimeoToken() {
    const token = await elevatedGetSecretValue("Vim_pubprivacc1"); // USER token
    if (!token) throw new Error("Missing Vimeo token secret: Vim_pubprivacc");
    return token.value;
}

export const getVimeoVideosFromFolder = webMethod(
    Permissions.Anyone,
    async (folderId, page = 1, perPage = 25) => {
        if (!folderId) throw new Error("Missing folderId");
        const token = await getVimeoToken();

        const url = `https://api.vimeo.com/me/folders/${folderId}/videos?page=${page}&per_page=${perPage}`;

        const response = await fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
            },
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("Vimeo API error:", errText);
            throw new Error(errText);
        }

        const json = await response.json();

        const videos = (json.data || []).map((v) => {
            const id = v.uri?.replace("/videos/", "") || "";
            // Construct a player url; use the privacy hash if present
            const privacyHash = v?.embed?.hash || v?.player_embed_url?.split("h=")[1];
            const base = `https://player.vimeo.com/video/${id}`;
            const embedUrl = privacyHash ? `${base}?h=${privacyHash}` : base;

            return {
                id,
                title: v.name,
                description: v.description,
                duration: v.duration,
                link: v.link,
                embedUrl,
            };
        });

        return {
            total: json.total,
            page: json.page,
            per_page: json.per_page,
            paging: json.paging,
            videos,
        };
    }
);

// put this near your other helpers
function pickThumbnail(pictures) {
    if (!pictures) return "";

    // Normalize candidates to a flat array of { width, height, link }
    let candidates = [];

    // Case A: pictures is an object with a sizes array
    if (pictures && Array.isArray(pictures.sizes)) {
        candidates = candidates.concat(
            pictures.sizes
            .filter((s) => s && s.link)
            .map((s) => ({ width: s.width, height: s.height, link: s.link }))
        );
    }

    // Case B: pictures is already an array of thumbnails
    if (Array.isArray(pictures)) {
        candidates = candidates.concat(
            pictures
            .filter((p) => p && p.link)
            .map((p) => ({ width: p.width, height: p.height, link: p.link }))
        );
    }

    // 1) Exact match first: 295x166
    const exact =
        candidates.find((c) => c.width === 295 && c.height === 166) ||
        candidates.find((c) => /295x166/.test(String(c.link)));
    if (exact) return exact.link;

    // 2) Next best: closest 16:9 that’s >= 295 wide, else nearest in general
    const targetW = 295;
    const targetH = 166;
    const targetRatio = targetW / targetH;

    let best = null;
    let bestScore = Infinity;

    for (const c of candidates) {
        const w = Number(c.width) || targetW;
        const h = Number(c.height) || targetH;
        const ratio = w / h;

        // Scoring: penalize AR mismatch heavily, prefer >=295 width, small penalty for overshoot
        const ratioPenalty = Math.abs(ratio - targetRatio) * 100; // weight
        const undershoot = Math.max(0, targetW - w);
        const overshoot = Math.max(0, w - targetW) * 0.01;

        const score = ratioPenalty * 10 + undershoot + overshoot;
        if (score < bestScore) {
            bestScore = score;
            best = c;
        }
    }

    if (best?.link) return best.link;

    // 3) Last resort: base_link or first available link
    const base =
        (pictures && pictures.base_link) ||
        (Array.isArray(pictures) && pictures[0]?.link) ||
        "";

    if (base) {
        // Try to coerce CDN size token to 295x166 if present
        try {
            const u = new URL(base);
            if (u.hostname.includes("vimeocdn.com")) {
                const coerced = base.replace(/_\d+(x\d+)?/, "_295x166");
                return coerced || base;
            }
        } catch (_) {
            /* ignore URL parse errors */
        }
        return base;
    }

    return "";
}

export const getVimeoVideosFromCampaign = webMethod(
    Permissions.Anyone,
    async (albumId,  page = 1, perPage = 25, userScope = "me") => {
        if (!albumId) throw new Error("Missing albumId (Showcase ID)");

        const token = await getVimeoToken();

        // Build URL: {me|users/{id}}/albums/{albumId}/videos
        const base = `https://api.vimeo.com/${userScope}/albums/${albumId}/videos`;

        const fields = [
            "uri",
            "name",
            "description",
            "duration",
            "link",
            "player_embed_url",
            "embed.hash",
            // Request both object+sizes shape *and* array shape
            "pictures.base_link",
            "pictures.link",
            "pictures.width",
            "pictures.height",
            "pictures.sizes.link",
            "pictures.sizes.width",
            "pictures.sizes.height",
            "tags.name",
        ].join(",");

        const qs = new URLSearchParams({
            page: String(page),
            per_page: String(perPage),
            fields,
        });

        const url = `${base}?${qs.toString()}`;

        const response = await fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
            },
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("Vimeo API error:", errText);
            throw new Error(errText);
        }

        const json = await response.json();

        const videos = (json.data || []).map((v) => {
            const id = v.uri?.replace("/videos/", "") || "";
            const privacyHash =
                v?.embed?.hash ||
                (v?.player_embed_url && v.player_embed_url.includes("h=") ?
                    v.player_embed_url.split("h=")[1].split("&")[0] :
                    "");

            const basePlayer = `https://player.vimeo.com/video/${id}`;
            const embedUrl = privacyHash ?
                `${basePlayer}?h=${privacyHash}` :
                basePlayer;

            return {
                id,
                title: v.name || "",
                description: v.description || "",
                duration: v.duration ?? null,
                link: v.link || "",
                embedUrl,
                thumbnail: pickThumbnail(v.pictures),
                tags: (v.tags || []).map((t) => t?.name).filter(Boolean),
            };
        });

        return {
            total: json.total,
            page: json.page,
            per_page: json.per_page,
            paging: json.paging,
            videos,
        };
    }
);

export const getVimeoShowcaseDetails = webMethod(
    Permissions.Anyone,
    async (albumId) => {
        const token = await getVimeoToken();

        const url =
            `https://api.vimeo.com/me/albums/${albumId}` +
            `?fields=name,description,link,pictures.base_link,metadata.interactions.add_custom_thumbnails.uri`;

        const headers = {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.vimeo.album+json;version=3.4",
        };

        const res = await fetch(url, { method: "GET", headers });
        if (!res.ok) throw new Error(`Vimeo album fetch failed ${res.status}`);

        const album = await res.json();

        // Primary album thumbnail
        let albumThumb = album?.pictures?.base_link ?? null;

        // Fallback: first custom thumbnail (if any)
        const ctUri = album?.metadata?.interactions?.add_custom_thumbnails?.uri;
        if (!albumThumb && ctUri) {
            const ctRes = await fetch(
                `https://api.vimeo.com${ctUri}?fields=data.base_link,data.sizes.link`, { headers }
            );
            if (ctRes.ok) {
                const ct = await ctRes.json();
                const first = ct?.data?.[0];
                albumThumb = first?.base_link || first?.sizes?.[0]?.link || null;
            }
        }

        const clean = (v) =>
            v === undefined || v === null || v === "null" ? null : v;

        return {
            albumThumb,
            title: clean(album?.name),
            description: clean(album?.description) || "",
            link: clean(album?.link),
        };
    }
);

function deriveMediaType(albumName) {
    if (!albumName) return null;
    const n = String(albumName).trim().toLowerCase();
    const hit = MEDIA_TYPE_NAMES.find((t) => n === t || n.includes(t));
    return hit || null;
}

export const getAllShowcases = webMethod(
    Permissions.Anyone,
    async (page = 1, perPage = 25) => {
        try {
            const token = await getVimeoToken();
            if (!token) {
                throw new Error("Failed to get Vimeo token");
            }

            const fields = [
                "uri",
                "name",
                "created_time",
                "modified_time",
                "total_clips",
                "pictures.link",
                "pictures.width",
                "pictures.height",
                "metadata.connections.videos",
            ].join(",");

            const qs = new URLSearchParams({
                page: String(Math.max(1, page)),
                per_page: String(Math.min(Math.max(1, perPage), 100)),
                fields,
            });

            const url = `${VIMEO_BASE}/me/albums?${qs.toString()}`;

            const res = await fetch(url, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error("Vimeo getAllShowcases error:", {
                    status: res.status,
                    statusText: res.statusText,
                    error: errorText,
                });
                throw new Error(`Vimeo API error: ${res.status} ${res.statusText}`);
            }

            const json = await res.json();

            if (!json || typeof json !== "object") {
                throw new Error("Invalid response format from Vimeo API");
            }

            // IDs to exclude
            const excludedIds = ["11932331", "11907435"];

            const albums = (json.data || [])
                .map((album) => {
                    if (!album || typeof album !== "object") {
                        return null;
                    }

                    const id = album.uri?.split("/").pop() || "";

                    // Skip excluded albums
                    if (excludedIds.includes(id)) {
                        console.log(`Skipping excluded album: ${album.name} (ID: ${id})`);
                        return null;
                    }

                    // FIXED: pictures IS the array of sizes, not nested under sizes
                    let thumbnail = "";
                    const pictures = album.pictures; // This is already the array

                    console.log(`Processing album: ${album.name}`, pictures);

                    if (pictures && Array.isArray(pictures) && pictures.length > 0) {
                        // Look for the exact 295x166 thumbnail first (commonly used size)
                        const exactMatch = pictures.find(
                            (p) => p && p.link && p.width === 295 && p.height === 166
                        );

                        // Fallback to medium size (640x360)
                        const mediumSize = pictures.find(
                            (p) => p && p.link && p.width === 640 && p.height === 360
                        );

                        // Final fallback: get the largest available
                        const largestSize = pictures
                            .filter((p) => p && p.link)
                            .sort((a, b) => b.width - a.width)[0];

                        thumbnail =
                            exactMatch?.link || mediumSize?.link || largestSize?.link || "";
                    }

                    console.log(`Album "${album.name}" thumbnail found:`, thumbnail);

                    return {
                        id: id || `unknown-${Math.random().toString(36).substr(2, 9)}`,
                        name: album.name || "Untitled Showcase",
                        thumbnail: thumbnail,
                        createdAt: album.created_time || null,
                        modifiedAt: album.modified_time || null,
                        totalClips: album.total_clips ?? 0,
                        mediaType: deriveMediaType(album.name),
                    };
                })
                .filter((album) => album !== null); // Remove null entries (both invalid and excluded albums)

            return {
                total: json.total || 0,
                page: json.page || page,
                per_page: json.per_page || perPage,
                paging: json.paging || {},
                albums,
            };
        } catch (error) {
            console.error("getAllShowcases unexpected error:", error);
            if (error instanceof Error) {
                throw error;
            } else {
                throw new Error(
                    `Unexpected error in getAllShowcases: ${String(error)}`
                );
            }
        }
    }
);

export const getAllKeyArt = webMethod(Permissions.Anyone, async () => {
    try {
        const { items } = await wixData
            .query("KeyartDesign")
            .contains("tags", "keyart") // <-- FILTER HERE
            .find();

        const normalized = items.map((doc, i) => {
            const firstPic = doc?.pictures?.[0];
            const thumbnail = doc.thumbnail || firstPic?.src || "";

            const keyArtPortrait =
                doc.keyArtPortrait ||
                doc.keyArtPortait || // old typo fallback
                doc.keyArt?.portrait ||
                doc.portrait ||
                "";

            const keyArtLandscape =
                doc.keyArtLandscape || doc.keyArt?.landscape || doc.landscape || "";

            const keyArtSquare =
                doc.keyArtSquare || doc.keyArt?.square || doc.square || "";

            return {
                _id: doc._id || String(i),
                artTitle: doc.artTitle || doc.title || "",
                thumbnail,
                keyArtPortrait: keyArtPortrait || "",
                keyArtLandscape: keyArtLandscape || "",
                keyArtSquare: keyArtSquare || "",
                campaignId: doc.campaignId || "",
            };
        });

        return {
            success: true,
            data: normalized,
            count: normalized.length,
        };
    } catch (error) {
        console.error("Backend getKeyArtData error:", error);
        return {
            success: false,
            error: error.message,
            data: [],
            count: 0,
        };
    }
});

export const getAllDesignArt = webMethod(Permissions.Anyone, async () => {
    try {
        const { items } = await wixData
            .query("KeyartDesign")
            .contains("tags", "design") // <-- FILTER HERE
            .find();

        const normalized = items.map((doc, i) => {
            const firstPic = doc?.pictures?.[0];
            const thumbnail = doc.thumbnail || firstPic?.src || "";

            const keyArtPortrait =
                doc.keyArtPortrait ||
                doc.keyArtPortait || // old typo fallback
                doc.keyArt?.portrait ||
                doc.portrait ||
                "";

            const keyArtLandscape =
                doc.keyArtLandscape || doc.keyArt?.landscape || doc.landscape || "";

            const keyArtSquare =
                doc.keyArtSquare || doc.keyArt?.square || doc.square || "";

            return {
                _id: doc._id || String(i),
                artTitle: doc.artTitle || doc.title || "",
                thumbnail,
                keyArtPortrait,
                keyArtLandscape,
                keyArtSquare,
                campaignId: doc.campaignId || "",
            };
        });

        return {
            success: true,
            data: normalized,
            count: normalized.length,
        };
    } catch (error) {
        console.error("Backend getAllDesignArt error:", error);
        return {
            success: false,
            error: error.message,
            data: [],
            count: 0,
        };
    }
});

export const getCampaignKeyArt = webMethod(
    Permissions.Anyone,
    async (campaignId) => {
        console.log(campaignId);
        try {
            const { items } = await wixData
                .query("KeyartDesign")
                .eq("campaignId", campaignId)
                .find();

            console.log(`Found ${items.length} items with campaignId: ${campaignId}`);

            // Debug: Check what campaignId values the filtered items actually have
            items.forEach((item) => {
                console.log(
                    `Filtered item: ${item._id}, campaignId: ${item.campaignId}, title: ${item.artTitle}`
                );
            });

            const normalized = items.map((doc, i) => {
                const firstPic = doc?.pictures?.[0];
                const thumbnail = doc.thumbnail || firstPic?.src || "";

                const keyArtPortrait =
                    doc.keyArtPortrait ||
                    doc.keyArtPortait || // old typo fallback
                    doc.keyArt?.portrait ||
                    doc.portrait ||
                    "";

                const keyArtLandscape =
                    doc.keyArtLandscape || doc.keyArt?.landscape || doc.landscape || "";

                const keyArtSquare =
                    doc.keyArtSquare || doc.keyArt?.square || doc.square || "";

                return {
                    _id: doc._id || String(i),
                    artTitle: doc.artTitle || doc.title || "",
                    thumbnail,
                    keyArtPortrait: keyArtPortrait || "",
                    keyArtLandscape: keyArtLandscape || "",
                    keyArtSquare: keyArtSquare || "",
                    campaignId: doc.campaignId || "", // ADD THIS LINE
                };
            });

            return {
                success: true,
                data: normalized,
                count: normalized.length,
            };
        } catch (error) {
            console.error("Backend getKeyArtData error:", error);
            return {
                success: false,
                error: error.message,
                data: [],
                count: 0,
            };
        }
    }
);

export const getAllVideosWithFilter = webMethod(
    Permissions.Anyone,
    async (filter, page = 1, perPage = 50) => {
        const token = await getVimeoToken();

        const qs = [
            `filter=tag`,
            `filter_tag=${encodeURIComponent(filter)}`,
            `page=${page}`,
            `per_page=${perPage}`
        ].join('&');

        const url = `https://api.vimeo.com/me/videos?${qs}`;

        const response = await fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
            },
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("Vimeo API error:", errText);
            throw new Error(errText);
        }

        const json = await response.json();

        const videos = (json.data || []).map((v) => {
            const id = v.uri?.replace("/videos/", "") || "";
            const privacyHash =
                v?.embed?.hash ||
                (v?.player_embed_url && v.player_embed_url.includes("h=") ?
                    v.player_embed_url.split("h=")[1].split("&")[0] :
                    "");

            const basePlayer = `https://player.vimeo.com/video/${id}`;
            const embedUrl = privacyHash ?
                `${basePlayer}?h=${privacyHash}` :
                basePlayer;

            return {
                id,
                title: v.name || "",
                description: v.description || "",
                duration: v.duration ?? null,
                link: v.link || "",
                embedUrl,
                thumbnail: pickThumbnail(v.pictures),
                tags: (v.tags || []).map((t) => t?.name).filter(Boolean),
            };
        });

        return {
            total: json.total,
            page: json.page,
            per_page: json.per_page,
            paging: json.paging,
            videos,
        };
    }
);

export const getAllShowcasesWithVideos = webMethod(
    Permissions.Anyone,
    async (videos = []) => {
        const token = await getVimeoToken();

        const excludedIds = ["11932331", "11907435"]; // <--- added here

        if (!Array.isArray(videos) || videos.length === 0) {
            return { count: 0, showcases: [] };
        }

        const headers = {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json'
        };

        const showcaseMap = {};

        for (const v of videos) {
            const id = v.id || (v.uri && v.uri.replace('/videos/', ''));
            if (!id) continue;

            const url = `https://api.vimeo.com/videos/${id}/albums?per_page=50`;

            try {
                const res = await fetch(url, { method: 'GET', headers });
                const json = await res.json();

                (json.data || []).forEach(album => {
                    const albumId = album.uri?.split('/').pop();

                    // 🚫 Skip excluded albums
                    if (excludedIds.includes(albumId)) return;

                    if (!showcaseMap[albumId]) {
                        showcaseMap[albumId] = {
                            id: albumId,
                            uri: album.uri,
                            name: album.name || '',
                            description: album.description || '',
                            link: album.link || '',
                            pictures: album.pictures || []
                        };
                    }
                });

            } catch (err) {
                console.error('Error fetching albums for video', id, err);
            }
        }

        const showcases = Object.values(showcaseMap);

        return {
            count: showcases.length,
            showcases,
        };
    }
);

export const getAllVideos = webMethod(
    Permissions.Anyone,
    async (page = 1, perPage = 25) => {
        const token = await getVimeoToken();

        // Calculate offset for Vimeo API (Vimeo uses page-based pagination)
        const vimeoPage = page;
        const vimeoPerPage = Math.min(perPage, 100); // Vimeo max is 100 per page

        const url = `https://api.vimeo.com/me/videos?page=${vimeoPage}&per_page=${vimeoPerPage}`;

        const response = await fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
            },
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("Vimeo API error:", errText);
            throw new Error(errText);
        }

        const json = await response.json();

        const videos = (json.data || []).map((v) => {
            const id = v.uri?.replace("/videos/", "") || "";
            const privacyHash =
                v?.embed?.hash ||
                (v?.player_embed_url && v.player_embed_url.includes("h=") ?
                    v.player_embed_url.split("h=")[1].split("&")[0] :
                    "");

            const basePlayer = `https://player.vimeo.com/video/${id}`;
            const embedUrl = privacyHash ?
                `${basePlayer}?h=${privacyHash}` :
                basePlayer;

            const createdDate = v.created_time || "";
            const year = createdDate ? new Date(createdDate).getFullYear() : "";
            // Format for Wix date field (YYYY-MM-DD format)
            const createdDateFormatted = createdDate ?
                new Date(createdDate).toISOString().split("T")[0] :
                "";

            return {
                id,
                title: v.name || "",
                description: v.description || "",
                duration: v.duration ?? null,
                link: v.link || "",
                embedUrl,
                thumbnail: pickThumbnail(v.pictures),
                tags: (v.tags || []).map((t) => t?.name).filter(Boolean),
                year, // This will be just the year number (e.g., 2025)
                created_date: createdDateFormatted, // This will be in YYYY-MM-DD format for pro
            };
        });

        return {
            total: json.total,
            page: json.page,
            per_page: json.per_page,
            paging: json.paging,
            videos,
        };
    }
);

export const getAllCampaignNames = webMethod(Permissions.Anyone, async () => {
    try {
        const token = await getVimeoToken();
        if (!token) {
            throw new Error("Failed to get vimeo token");
        }

        const fields = ["uri", "name"].join(",");

        const qs = new URLSearchParams({
            page: "1",
            per_page: "100",
            fields,
        });

        const url = "{VIMEO_BASE}/me/albums?${qs.toString()}";

        const res = await fetch(url, {
            method: "GET",
            headers: {
                authorization: "Bearer ${token}",
                Accept: "application/json",
            },
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("Vimeo getAllShowcaseNames error:", {
                status: res.status,
                statusText: res.statusText,
                error: errorText,
            });

            throw new Error(`Vimeo API error: ${res.status} ${res.statusText}`);
        }

        const json = await res.json();
        if (!json || typeof json !== "object") {
            throw new Error("Invalid response format from Vimeo API");
        }

        const excludedIds = ["11932331", "11907435"];

        const showcaseNames = (json.data || []).map((album) => {
            if (!album || typeof album !== "object") return null;
            const id = album.uri?.split("/").pop() || "";

            if (excludedIds.includes(id)) {
                console.log(`Skipping excluded album: ${album.name} (ID: ${id})`);
                return null;
            }

            return album.name || "untitled showcase";
        }).filter(name => name !== null);

        return showcaseNames;
    } catch (error) {
        console.error("getAllShowcaseNames unexpected error:", error);
        if (error instanceof Error) {
            throw error;
        } else {
            throw new Error(`Unexpected error in getAllShowcaseNames: ${String(error)}`);
        }
    }
});

export const getCategories = webMethod(Permissions.Anyone, async () => {
    try {
        const token = await getVimeoToken();
        if (!token) {
            throw new Error("Failed to get vimeo token");
        }

        const fields = ["uri", "name"].join(",");

        const qs = new URLSearchParams({
            page: "1",
            per_page: "100",
            fields,
        });

        const url = "{VIMEO_BASE}/categories";

        const res = await fetch(url, {
            method: "GET",
            headers: {
                authorization: "Bearer ${token}",
                Accept: "application/json",
            },
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("Vimeo getAllShowcaseNames error:", {
                status: res.status,
                statusText: res.statusText,
                error: errorText,
            });

            throw new Error(`Vimeo API error: ${res.status} ${res.statusText}`);
        }

    } catch (error) {
        console.error("getAllShowcaseNames unexpected error:", error);
        if (error instanceof Error) {
            throw error;
        } else {
            throw new Error(`Unexpected error in getAllShowcaseNames: ${String(error)}`);
        }
    }
});

// export const getCampaignHeroMedia = webMethod(Permissions.Anyone, async () => {
// try {
//     const token = await getVimeoToken();
//     if (!token) {
//       throw new Error("Failed to get vimeo token");
//     }

//     const url = `https://api.vimeo.com/me/videos?page=${vimeoPage}&per_page=${vimeoPerPage}`;

//     const response = await fetch(url, {
//       method: "GET",
//       headers: {
//         Authorization: `Bearer ${token}`,
//         Accept: "application/json",
//       },
//     });

//     if (!response.ok) {
//       const errText = await response.text();
//       console.error("Vimeo API error:", errText);
//       throw new Error(errText);
//     }

//     const json = await response.json();

// } catch(error) {
//     console.error("unexpected error:", error);
//     if (error instanceof Error) {
//         throw error;
//     } else {
//         throw new Error(`Unexpected error: ${String(error)}`);
//   }
// }
// });


export const getHero = webMethod(Permissions.Anyone, async (showcaseId, tagFilter) => {
    try {

              const token = await getVimeoToken();
        if (!token) {
            throw new Error("Failed to get vimeo token");
        }

        const res = await fetch(`https://api.vimeo.com/albums/${showcaseId}/videos`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const json = await res.json();

        if (!json?.data?.length) return { success: true, videos: [] };

        const videos = json.data
            .filter(v => Array.isArray(v.tags) && v.tags.some(t => t.tag === tagFilter))
            .map(v => ({
                id: v.uri?.split("/").pop(),
                name: v.name,
                description: v.description,
                link: v.link,
                player_embed_url: v.player_embed_url,
                tags: v.tags.map(t => t.tag)
            }));

        return {
            success: true,
            videos
        };

    } catch (err) {
        console.error("Vimeo showcase fetch error:", err);
        return { success: false, videos: [], error: err.message };
    }
});
