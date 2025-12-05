// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction
import { getVimeoVideosFromFolder, getVimeoVideosFromCampaign } from "backend/vimeo.web.js";
import wixWindowFrontend from 'wix-window-frontend';

const avTitle = $w("#avTitleText")


$w.onReady(function () {
	addSkeleton()
	fetchAV()

	avTitle.text = ""
	// Write your Javascript code here using the Velo framework API


	// Print hello world:
	// console.log("Hello world!");

	// Call functions on page elements, e.g.:
	// $w("#button1").label = "Click me!";

	// Click "Run", or Preview your site, to execute your code

});

export async function fetchAV() {
    // Bind item renderer first
    $w('#repeaterDigital').onItemReady(($item, itemData) => {
        console.log(itemData)

        // $item('#avTitleText').onClick(() => {
        //     console.log(itemData._id);
        //     console.log(itemData.tags)
        // })

        // $item('#thumbImage').onClick(() => {
        //     console.log(itemData);
        //     console.log(itemData.tags)

        //     wixWindowFrontend.openLightbox('LightboxName', itemData)
        //         .then(dataFromLightbox => {
        //             // Code here runs when the lightbox is closed
        //             // dataFromLightbox will contain any data passed back from the lightbox
        //             console.log('Data received from lightbox:', dataFromLightbox);
        //         });
        // })

        $item('#mediaItem').onClick(() => {
            console.log(itemData);
            console.log(itemData.tags)

            const payload = {
                itemData, 
                orientation: "landscape"
            };

            wixWindowFrontend.openLightbox('mediaPlayer', payload)
                .then(dataFromLightbox => {
                    console.log('Data received from lightbox:', dataFromLightbox);
                });

        })

        if (itemData.title) {
            $item('#avTitleText').text = itemData.title || '';
        }

        if (itemData.thumbnail) {
            // FIXED: Use $item to target the repeater item's image
            $item('#thumbImage').src = itemData.thumbnail;
            $item('#thumbImage').show('fade', { duration: 2000, delay: 3000 });

        }
    });

    try {
        // ---- artificial delay for testing ----
        const ms = 2500;
        await new Promise((resolve) => setTimeout(resolve, ms));
        // --------------------------------------

        const albumId = "11896009";
        const { videos } = await getVimeoVideosFromCampaign(albumId, 1, 25, "me");

        if (!Array.isArray(videos)) throw new Error('No videos returned');

        $w('#repeaterDigital').data = videos.map(v => ({
            _id: String(v.id),
            title: v.title || '',
            thumbnail: v.thumbnail || '',
            tags: v.tags || [],
            link: v.link || '',
            embedUrl: v.embedUrl || ''
        }));

    } catch (e) {
        console.error("Showcase load error:", e?.message || e);
        $w('#repeaterDigital').data = [];
    }
}


function addSkeleton() {
    $w("#repeaterDigital").forEachItem(($item) => {
        $item("#mediaContainer").customClassList.add("skeleton");
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