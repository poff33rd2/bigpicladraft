// Page code - Enhanced with full error handling & UX

import {
    getVimeoVideosFromFolder,
    getVimeoVideosFromCampaign,
    getAllShowcases,
    getAllKeyArt
} from "backend/vimeo.web.js";
import wixAnimations from "wix-animations";
import wixLocation from 'wix-location';
import wixWindowFrontend from "wix-window-frontend";
import wixData from "wix-data";

let timeline = wixAnimations.timeline();
let playlist = [];
let idx = 0;

// Elements
const $ = $w; // shortcut
const loadingHtml = $("#loadingHtml");
const htmlPlayer = $("#html1");
const campaignRepeater = $("#campaignRepeater");
const keyArtRepeater = $("#repeaterKA");

// Error & Empty State Elements (add these to your page if not present)
const errorToast = $("#errorToast"); // Text element (hidden by default)
const heroErrorText = $("#heroErrorText"); // Optional: under hero player
// const emptyStateKA = $("#kaEmptyState");    // Optional empty state box

$w.onReady(async () => {
    try {
        showGlobalLoading(true);
        addSkeleton();

        await Promise.allSettled([
            loadHeroVideo(),
            fetchCampaigns(),
            fetchKeyArt()
            // fetchAV(), fetchDigital() — uncomment when ready
        ]);

    } catch (err) {
        showError("Something went wrong loading the page. Please refresh.");
        console.error("Critical page load failure:", err);
    } finally {
        showGlobalLoading(false);
    }
});

// ==================== HERO VIDEO PLAYER ====================
async function loadHeroVideo() {
    // const folderId = "26731140";
    const folderId = "2673114";

    try {
        const { videos } = await getVimeoVideosFromFolder(folderId);

        if (!Array.isArray(videos) || videos.length === 0) {
            throw new Error("No videos found in hero folder");
        }

        playlist = videos;
        console.log("Hero playlist loaded:", playlist.length, "videos");

        loadVideoIntoPlayer(playlist[idx].embedUrl);

        // Setup next-video listener
        htmlPlayer.onMessage((event) => {
            const data = event.data;
            if (data?.type === "videoEnded") {
                idx = (idx + 1) % playlist.length;
                loadVideoIntoPlayer(playlist[idx].embedUrl);
            }
            if (data?.type === "requestUserGesturePlay") {
                htmlPlayer.postMessage({ type: "playNow" });
            }
        });

    } catch (err) {
        console.error("Hero video load failed:", err);
        showHeroError("Unable to load trailer. Please try again later.");
        // Optional: show static poster image as fallback
        // $("#heroPosterFallback").show();
    }
}

function loadVideoIntoPlayer(url) {
    if (!url) return;
    htmlPlayer.postMessage({ type: "loadVideo", url });
}

function showHeroError(message) {
    if (heroErrorText) {
        heroErrorText.text = message;
        heroErrorText.show();
    }
    showToast(message);
}

// ==================== CAMPAIGNS REPEATER ====================
async function fetchCampaigns() {
    campaignRepeater.onItemReady(($item, itemData) => {
        $item("#campaignTitle").text = itemData.title || "Untitled Campaign";

        const thumb = $item("#thumbImage169");
        if (itemData.thumbnail) {
            thumb.src = itemData.thumbnail;
            thumb.show();
        } else {
            thumb.hide();
        }

        $item("#cmpMediaItem").onClick(async () => {
            loadingHtml.show();
            await delay(150);
            wixLocation.to(`/projectview?campaignId=${itemData._id}`);
        });
    });

    try {
        // Remove artificial delay in production!
        // await delay(2500);

        const rawdata = await getAllShowcases();
        const campaigns = rawdata?.albums;

        if (!Array.isArray(campaigns) || campaigns.length === 0) {
            throw new Error("No campaigns returned from backend");
        }

        const mapped = campaigns.map(c => ({
            _id: String(c.id),
            title: c.name || "Untitled",
            thumbnail: c.thumbnail || "",
            tags: c.tags || [],
            link: c.link || "",
        }));

        campaignRepeater.data = mapped;
        removeSkeleton(campaignRepeater, "skeletonCont");

    } catch (err) {
        console.error("Campaigns fetch failed:", err);
        campaignRepeater.data = [];
        showError("Failed to load campaigns.");
    }
}

// ==================== KEY ART REPEATER ====================
async function fetchKeyArt() {
    keyArtRepeater.hide(); // start hidden

    keyArtRepeater.onItemReady(($item, itemData) => {
        // Remove skeleton classes
        $item("#skeletonCont2")?.customClassList.remove("skeleton");
        $item("#kaTitleText")?.customClassList.remove("skeleton");

        $item("#kaTitleText").text = itemData.artTitle || "Untitled Key Art";

        const thumb = $item("#thumbImage2");
        if (itemData.thumbnail) {
            thumb.src = itemData.thumbnail;
            thumb.show();
        } else {
            thumb.hide();
        }

        $item("#keyArtItem").onClick(() => {
            const selected = pickOrientation(itemData);
            if (!selected) {
                showToast("No key art available for this item.");
                return;
            }

            const payload = {
                itemData,
                type: "keyart",
                selectedOrientation: selected,
                available: {
                    portrait: !!itemData.keyArtPortrait,
                    landscape: !!itemData.keyArtLandscape,
                    square: !!itemData.keyArtSquare,
                }
            };

            wixWindowFrontend.openLightbox("mediaPlayer", payload)
                .then(res => console.log("KeyArt lightbox closed:", res))
                .catch(err => console.error("Lightbox error:", err));
        });
    });

    try {
        const result = await getAllKeyArt();

        if (!result?.success || !Array.isArray(result.data)) {
            throw new Error(result?.error || "Invalid key art response");
        }

        const data = result.data;

        if (data.length === 0) {
            keyArtRepeater.data = [];
            // if (emptyStateKA) emptyStateKA.show();
            return;
        }

        keyArtRepeater.data = data;
        keyArtRepeater.show();
        removeSkeleton(keyArtRepeater, "skeletonCont2");

    } catch (err) {
        console.error("KeyArt fetch failed:", err);
        keyArtRepeater.data = [];
        keyArtRepeater.show();
        showError("Failed to load key art designs.");
        // if (emptyStateKA) {
        //     emptyStateKA.text = "Failed to load key art.";
        //     emptyStateKA.show();
        // }
    }
}

// ==================== UTILITIES ====================
function showGlobalLoading(show = true) {
    if (show) {
        loadingHtml.show();
    } else {
        loadingHtml.hide();
    }
}

function showToast(message) {
    if (!errorToast) return console.warn("Toast message (no #errorToast element):", message);

    heroErrorText.text = message;
    errorToast.show();
    $("#html1").hide();

}

function showError(message) {
    showToast(message);
    console.error("User-facing error:", message);
}

function addSkeleton() {
    campaignRepeater.forEachItem(($item) => {
        $item("#skeletonCont")?.customClassList.add("skeleton");
    });

    // Add more repeaters as needed
    // keyArtRepeater.forEachItem(($item) => {
    //     $item("#skeletonCont2")?.customClassList.add("skeleton");
    // });
}

function removeSkeleton(repeater, containerId) {
    repeater.forEachItem(($item) => {
        $item(`#${containerId}`)?.customClassList.remove("skeleton");
    });
}

function pickOrientation(item) {
    if (item?.keyArtPortrait) return "portrait";
    if (item?.keyArtLandscape) return "landscape";
    if (item?.keyArtSquare) return "square";
    return null;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}