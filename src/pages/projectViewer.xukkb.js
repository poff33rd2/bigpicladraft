// Lightbox: mediaPlayer.js
import wixWindowFrontend from "wix-window-frontend";

import { getVimeoVideosFromCampaign, getVimeoShowcaseDetails, getAllKeyArt, getCampaignKeyArt } from "backend/vimeo.web.js";

// Grab elements *inside* onReady
// campaign backdrop
const backdropContainer = $w('#backdropContainer');
const backdropTitle = $w("#backdropTitle");
const campaignThumbnail = $w("#showcaseThumbnail");

//landscape media items
const landscapeImage = $w("#landscapeImage");

//portrait media items
const portraitImage = $w("#portraitImage");

//square media items
const squareImage = $w("#portraitImage");

// media player
const mediaFrame = $w("#mediaFrame");
const mediaPlayer = $w("#mediaPlayer");
const mediaTitle = $w("#mediaTitle");
const mediaDetails = $w("#mediaDetails");
const mediaDescription = $w("#mediaDescription");

// gallery items
const mediaContainer = $w("#mediaContainer");
const mediaItemsTitle = $w("#mediaItemsTitle");

$w.onReady(async () => {
    // SAFE: get context after onReady
    const ctx = wixWindowFrontend.lightbox.getContext() || {};

    console.log("Lightbox context:", ctx);

    // Initialize loading states
    initializeLoadingStates();

    fetchCampaignAssets(ctx);
});

function initializeLoadingStates() {
    // Hide containers until data is loaded
    backdropContainer.hide();
    mediaContainer.hide();
    mediaItemsTitle.hide();

    // Add skeleton classes
    mediaFrame.customClassList.add("skeleton");
    backdropTitle.customClassList.add("skeleton");
    campaignThumbnail.customClassList.add("skeleton");
}

async function fetchCampaignAssets(ctx) {
    try {
        // ---- artificial delay for testing ----
        const ms = 2500;
        await new Promise((resolve) => setTimeout(resolve, ms));
        // --------------------------------------

        const albumId = getCampaignId(ctx);
        if (!albumId) {
            console.error("Missing or empty 'campaignId' in lightbox context", ctx);

            // Show friendly UI state for missing campaign id
            $w('#repeaterCampaign').data = [];
            backdropTitle.customClassList.remove("skeleton");
            campaignThumbnail.customClassList.remove("skeleton");
            backdropTitle.text = "No campaign specified";
            backdropTitle.show();
            backdropContainer.show();
            return;
        }

        let details;
        try {
            details = await getVimeoShowcaseDetails(albumId);
        } catch (err) {
            console.error(`Invalid campaignId passed to getVimeoShowcaseDetails (${albumId}):`, err);

            // Show friendly UI state for invalid campaign id
            $w('#repeaterCampaign').data = [];
            backdropTitle.customClassList.remove("skeleton");
            campaignThumbnail.customClassList.remove("skeleton");
            backdropTitle.text = "Invalid campaign specified";
            backdropTitle.show();
            backdropContainer.show();
            return;
        }

        if (!details) {
            console.error("getVimeoShowcaseDetails returned no details for campaignId:", albumId, details);
            throw new Error("No showcase details found");
        }

        let { videos } = await getVimeoVideosFromCampaign(albumId);
        let keyArt = await getCampaignKeyArt(albumId);
        console.log('Videos:', videos);
        console.log('Key Art:', keyArt);

        // Remove skeleton classes and show elements when data is fully loaded
        backdropTitle.customClassList.remove("skeleton");
        campaignThumbnail.customClassList.remove("skeleton");

        // Set content and show backdrop elements
        backdropTitle.text = details.title;
        backdropTitle.show();

        if (details.albumThumb) {
            campaignThumbnail.src = details.albumThumb;
            campaignThumbnail.show();
        }

        // Show backdrop container now that data is loaded
        backdropContainer.show();

        // Set media title (hidden initially, shown on media item click)
        mediaTitle.text = details.title;
        mediaTitle.hide(); // Hide initially, will show when media item is clicked

        // Handle description - if not null or empty string, expand and set text
        if (details.description && details.description.trim() !== '') {
            mediaDescription.text = details.description;
            mediaDescription.expand(); // Make sure it's expanded
        } else {
            mediaDescription.collapse();
        }

        // Combine both data sources into one array for the repeater
        const repeaterData = [];

        // Add videos with type identification
        if (videos && videos.length > 0) {
            videos.forEach(video => {
                repeaterData.push({
                    _id: `video_${video.id}`,
                    title: video.title || '',
                    thumbnail: video.thumbnail || '',
                    type: 'video',
                    contentType: determineVideoContentType(video.tags),
                    embedUrl: video.embedUrl || '',
                    link: video.link || '',
                    tags: video.tags || []
                });
            });
        }

        // Add key art with type identification
        if (keyArt && keyArt.data && keyArt.data.length > 0) {
            keyArt.data.forEach(art => {
                // Ensure we have a valid thumbnail URL
                const thumbnail = art.thumbnail || art.keyArtPortrait || art.keyArtLandscape || art.keyArtSquare || '';
                repeaterData.push({
                    _id: `keyart_${art._id}`,
                    title: art.artTitle || '',
                    thumbnail: thumbnail,
                    type: 'keyart',
                    contentType: 'keyart',
                    campaignId: art.campaignId || ''
                });
            });
        }

        console.log('Combined repeater data:', repeaterData);

        // Show media items title if we have data
        if (repeaterData.length > 0) {
            mediaItemsTitle.show();
            mediaContainer.show();
        }

        // Set repeater data
        $w('#repeaterCampaign').data = repeaterData;

        // Set up repeater item handling
        $w('#repeaterCampaign').onItemReady(($item, itemData) => {
            console.log(`Item ready: ${itemData.title} (${itemData.type} - ${itemData.contentType})`);

            const titleText = $item('#mediaItemsTitle'); // Fixed: should be titleText, not mediaItemsTitle
            const thumbImage = $item('#thumbImage');

            // Add skeleton to title
            titleText.customClassList.add("skeleton");

            // Set title and remove skeleton
            titleText.text = itemData.title || '';
            titleText.customClassList.remove("skeleton");

            // Handle thumbnail loading
            if (itemData.thumbnail) {
                // Add skeleton while loading
                thumbImage.customClassList.add("skeleton");
                thumbImage.show();

                // Set the image source - Wix will handle loading automatically
                thumbImage.src = itemData.thumbnail;

                // Use a timeout to remove skeleton after image should be loaded
                // This is a workaround since Wix doesn't provide image load events
                setTimeout(() => {
                    thumbImage.customClassList.remove("skeleton");
                }, 1000);

            } else {
                // No valid thumbnail available - hide the image
                thumbImage.hide();
                console.warn(`Invalid thumbnail URL for: ${itemData.title}`, itemData.thumbnail);
            }

            // Handle clicks based on type
            $item('#mediaItem').onClick(() => {
                console.log(`Clicked: ${itemData.type} - ${itemData.contentType}`);

                // HIDE backdropTitle when media item is clicked
                backdropTitle.hide();

                // SHOW mediaTitle when mediaItem is clicked
                mediaTitle.show();

                if (itemData.type === 'video') {
                    console.log('This is video content:', itemData.contentType);
                    const videoUrl = itemData.embedUrl;
                    mediaFrame.show();
                    const orientation = "landscape";
                    loadIntoHtmlComponent(videoUrl, orientation);
                    mediaPlayer.show()

                } else if (itemData.type === 'keyart') {
                    console.log('This is key art content');

                }
            });
        });

    } catch (error) {
        console.error("Showcase load error:", error?.message || error);
        // Show error state or fallback content
        $w('#repeaterCampaign').data = [];

        // Remove skeletons on error
        backdropTitle.customClassList.remove("skeleton");
        campaignThumbnail.customClassList.remove("skeleton");

        // Show error message
        backdropTitle.text = "Error loading content";
        backdropTitle.show();
        backdropContainer.show();
    }
}

// Helper function to validate URLs
// function isValidUrl(string) {
//     if (!string) return false;
//     try {
//         const url = new URL(string);
//         return url.protocol === "http:" || url.protocol === "https:";
//     } catch (_) {
//         return false;
//     }
// }

// Helper function to determine video content type based on tags
function determineVideoContentType(tags) {
    if (!tags || !Array.isArray(tags)) return 'unknown';

    const tagString = tags.join(' ').toLowerCase();

    if (tagString.includes('av') || tagString.includes('audio-visual')) {
        return 'av';
    } else if (tagString.includes('social') || tagString.includes('digital')) {
        return 'social/digital';
    } else if (tagString.includes('production') || tagString.includes('behind-the-scenes')) {
        return 'production';
    } else {
        return 'video';
    }
}

function getCampaignId(data) {
    if (!data || !data.itemData) return null;

    const tags = Array.isArray(data.itemData.tags) ? data.itemData.tags : [];
    const hit = tags.find(t =>
        (typeof t === 'number') || (typeof t === 'string' && /^\d+$/.test(t))
    );
    return hit != null ? String(hit) : null;
}

function loadIntoHtmlComponent(url, orientation) {
    if (orientation === "landscape") {
        mediaFrame.customClassList.remove("skeleton");
        mediaDescription.show();
        mediaPlayer.show();

        $w("#showcaseThumbnail").scrollTo()
            .then(() => {
                console.log("Scrolled to anchor!");
            })
            .catch(error => {
                console.warn("Scroll failed:", error);
            });

        mediaPlayer.postMessage({
            type: "loadVideo",
            url: url
        });
    } else if (orientation === "portrait") {
        mediaFrame.customClassList.remove("skeleton");
        mediaFrame.show();
        portraitImage.show();
    }
}