import wixLocation from 'wix-location';
import wixWindowFrontend from "wix-window-frontend";
import { getVimeoVideosFromCampaign, getVimeoShowcaseDetails, getAllKeyArt, getCampaignKeyArt, getHero } from "backend/vimeo.web.js";

// campaign backdrop
const backdropContainer = $w('#backdropContainer');
const backdropTitle = $w("#backdropTitle");
const campaignThumbnail = $w("#campaignThumb");
const vPlayer = $w("#vPlayer");

// gallery items
const mediaContainer = $w("#mediaContainer1");
const mediaItemsTitle = $w("#itemTitle");
const mediaThumb = $w("#thumbImage169");

$w.onReady(async () => {
    // SAFE: get query params after onReady

    const query = wixLocation.query;
    console.log(query)

    const herotag = query.herotag;
    const campaignId = query.campaignId;

    if (herotag && herotag.trim() !== "") {
        getHeroMedia(herotag, campaignId);
    }

    // Initialize loading states
    initializeLoadingStates();

    fetchCampaignAssets();
});

function initializeLoadingStates() {
    // Hide containers until data is loaded
    backdropContainer.hide();
    mediaContainer.hide();
    mediaItemsTitle.hide();
    $w("#section4").collapse();

    // Add skeleton classes
    backdropTitle.customClassList.add("skeleton");
    campaignThumbnail.customClassList.add("skeleton");
}

async function fetchCampaignAssets(ctx) {
    const queryParams = wixLocation.query || {};
    const campaignId = queryParams.campaignId;
    if (campaignId) {
        // Use the campaignId value here
        console.log("Received campaignId:", campaignId);
    }
    try {
        // ---- artificial delay for testing ----
        const ms = 2500;
        await new Promise((resolve) => setTimeout(resolve, ms));
        // --------------------------------------

        const albumId = campaignId;
        if (!albumId) {
            throw new Error("No album ID found in context");
        }

        const details = await getVimeoShowcaseDetails(albumId);
        if (!details) {
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
        $w("#loadingHtml").hide();

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
            $w("#section4").expand();

            const titleText = $item('#itemTitle'); // Fixed: should be titleText, not mediaItemsTitle
            const thumbImage = $item('#thumbImage169');

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
                // backdropTitle.hide();
                $w("#mediaTitle").show();
                $w("#mediaTitle").text = itemData.title;

                // SHOW mediaTitle when mediaItem is clicked

                if (itemData.type === 'video') {
                    const videoUrl = itemData.embedUrl;
                    // console.log('This is video content:', itemData.contentType);
                    // const videoUrl = itemData.embedUrl;
                    // const orientation = "landscape";
                    // wixWindowFrontend.openLightbox("mediaPlayer", itemData);
                    loadIntoHtmlComponent(videoUrl);
                    console.log("this is a/v")

                } else if (itemData.type === 'keyart') {
                    // const embedUrl = itemData
                    console.log('This is key art content:', itemData);
                     const imageEmbedUrl = itemData.thumbnail
                    loadIntoImageShowcase(imageEmbedUrl)
                } else if (itemData.type === 'design') {
                    console.log('This is design content:', itemData);
                    const imageEmbedUrl = itemData.thumbnail
                    loadIntoImageShowcase(imageEmbedUrl)
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

// Campaign helper 
function getCampaignId(data) {
    if (!data || !data.itemData) return null;

    const tags = Array.isArray(data.itemData.tags) ? data.itemData.tags : [];
    const hit = tags.find(t =>
        (typeof t === 'number') || (typeof t === 'string' && /^\d+$/.test(t))
    );
    return hit != null ? String(hit) : null;
}

//load video into vPlayer
function loadIntoHtmlComponent(url) {
    // landscapeFrame.customClassList.remove("skeleton");
    vPlayer.show();
    campaignThumbnail.hide();
    vPlayer.postMessage({
        type: "loadVideo",
        url
    });
}

function loadIntoImageShowcase(url) {
    // landscapeFrame.customClassList.remove("skeleton");
    // vPlayer.show();
    campaignThumbnail.src = url;
    // vPlayer.postMessage({
    //     type: "loadVideo",
    //     url
    // });
}

async function getHeroMedia(heroTag, campaignId) {
    try {
        const showcaseId = campaignId; // Vimeo Album ID
        const tagFilter = heroTag;

        // 1. Fetch filtered videos (only videos with tag heroTag, e.g. "av1")
        const { success, videos } = await getHero(campaignId, heroTag);
        console.log("Hero videos:", videos);

        if (!success || !Array.isArray(videos) || !videos.length) {
            console.warn(`No videos with tag "${tagFilter}" found in showcase ${showcaseId}`);
            return;
        }

        // 2. Grab the first matching video
        const video = videos[0];

        // 3. Pick the best URL to load into the HTML component
        const embedUrl =
            video.embedUrl ||
            video.player_embed_url ||
            video.link; // fallback

        if (!embedUrl) {
            console.warn("No embed URL found for hero video:", video);
            return;
        }

        // 4. Load it into the HTML component using your helper
        loadIntoHtmlComponent(embedUrl);

        // 5. Update UI (hero title, etc.)
        $w("#mediaTitle").show();
        $w("#mediaTitle").text = video.title || video.name || "";

    } catch (err) {
        console.error("Error loading tagged hero video:", err);
    }
}