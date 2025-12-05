// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction
import { getAllVideosWithFilter, getVimeoVideosFromCampaign, getAllShowcasesWithVideos } from "backend/vimeo.web.js";
import wixWindowFrontend from 'wix-window-frontend';
import wixLocation from 'wix-location';

// const avTitle = $w("#avTitleText")

$w.onReady(function () {
    // Setup the repeater handlers
    $w("#thumbImage169").hide();
    addSkeleton()
    setupAVRepeater();
    // Fetch data on page load
    fetchAV();
});

export async function fetchAV() {
    try {
        // Optional artificial delay to test skeleton loaders
        const ms = 2500;
        await new Promise((resolve) => setTimeout(resolve, ms));

        const filter = 'av';

        // 1. Get videos tagged "av"
        const { videos } = await getAllVideosWithFilter(filter);
        if (!Array.isArray(videos) || !videos.length) {
            console.warn('No videos returned for filter:', filter);
            $w('#repeaterAV').data = [];
            return;
        }

        // 2. Get showcases that contain those videos
        const { showcases } = await getAllShowcasesWithVideos(
            // send only what the backend expects (e.g., { id })
            videos.map(v => ({ id: v.id }))
        );

        if (!Array.isArray(showcases) || !showcases.length) {
            console.warn('No showcases found containing videos with tag:', filter);
            $w('#repeaterAV').data = [];
            return;
        }

        // 3. Normalize data for the repeater
        const repeaterData = showcases.map(s => {
            // In your data, `pictures` is already an array of thumbnails
            const pics = Array.isArray(s.pictures) ? s.pictures : [];
            const primary = pics[0] || null; // you can swap logic to pick by width/type/etc.

            return {
                _id: String(s.id),
                id: s.id,
                uri: s.uri,
                name: s.name || '',
                description: s.description || '',
                link: s.link || '',
                cover: primary?.link || '' // <- FIX: grab link from array, not `.sizes`
            };
        });

        // 4. Bind to repeater
        $w('#repeaterAV').data = repeaterData;

    } catch (e) {
        console.error('showcase load error:', e?.message || e);
        $w('#repeaterAV').data = [];
    }
}

function setupAVRepeater() {
    $w('#repeaterAV').onItemReady(($item, itemData) => {
        console.log('showcase item:', itemData);

        // Title
        if (itemData.name) {
            $item('#itemTitle').text = itemData.name;
        } else {
            $item('#itemTitle').text = '';
        }

        // Thumbnail / cover
        if (itemData.cover) {
            $item('#thumbImage169').src = itemData.cover;
            $w('#thumbImage169').show();
        } else {
            // optional: hide or set a placeholder if no cover
            $item('#thumbImage169').hide();
        }

        // Click → open lightbox with showcase info (or navigate to Vimeo)
        $item('#mediaItem').onClick(() => {
            console.log('clicked showcase:', itemData);

            const campaignId = itemData._id;
            const tag = "av1";

            wixLocation.to(`/projectview?campaignId=${campaignId}&herotag=${tag}`);

            // Option A: open your mediaPlayer lightbox
            // wixWindowFrontend.openLightbox('mediaPlayer', {
            //     type: 'showcase',
            //     showcase: itemData
            // });

            // Option B instead of lightbox:
            // import wixLocation from 'wix-location';
            // wixLocation.to(itemData.link);
        });
    });
}

function addSkeleton() {
    $w("#repeaterAV").forEachItem(($item) => {
        $item("#mediaContainer1").customClassList.add("skeleton");
        $item("#avTitleText").customClassList.add("skeleton");
        // $item("#readMoreButton").customClassList.add("skeleton");
    });

    // $w("#repeaterDigital").forEachItem(($item) => {
    //     $item("#skeletonCont1").customClassList.add("skeleton");
    //     $item("#digTitleText").customClassList.add("skeleton");
    //     // $item("#readMoreButton").customClassList.add("skeleton");
    // });

    // $w("#repeaterKA").forEachItem(($item) => {
    //     $item("#skeletonCont2").customClassList.add("skeleton");
    //     $item("#kaTitleText").customClassList.add("skeleton");
    //     // $item("#readMoreButton").customClassList.add("skeleton");
    // });

    // $w("#repeaterProd").forEachItem(($item) => {
    //     $item("#skeletonCont3").customClassList.add("skeleton");
    //     $item("#prodTitleText").customClassList.add("skeleton");
    //     // $item("#readMoreButton").customClassList.add("skeleton");
    // });

}