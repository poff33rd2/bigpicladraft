// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction
import { getAllKeyArt, getAllDesignArt } from "backend/vimeo.web.js";
import wixWindowFrontend from 'wix-window-frontend';
import wixData from "wix-data";
import wixLocation from 'wix-location';

const kaTitle = $w("#kaTitleText")

$w.onReady(function () {
    addSkeleton()
    fetchKeyArt()
    fetchDesign()

    kaTitle.text = ""
    // Write your Javascript code here using the Velo framework API

    // Print hello world:
    // console.log("Hello world!");

    // Call functions on page elements, e.g.:
    // $w("#button1").label = "Click me!";

    // Click "Run", or Preview your site, to execute your code

});

export async function fetchKeyArt() {
    try {
        const res = await getAllKeyArt();

        if (!res.success) {
            console.error('getAllKeyArt failed:', res.error);
            return;
        }

        const items = res.data; // this is your normalized array

        // 1. Bind data to repeater
        $w('#repeaterKeyArt').data = items;

        // 2. Map each item to its UI elements
        $w('#repeaterKeyArt').onItemReady(($item, itemData, index) => {
            // Text element for title
            $item("#skeletonCont1").customClassList.remove("skeleton");

            $item('#itemTitle').text = itemData.artTitle || '';

            // Image element for thumbnail (16:9)
            $item('#thumbImage169').src = itemData.thumbnail || '';
            $item('#thumbImage169').alt = itemData.artTitle || '';
            $item('#keyArtItem').onClick(() => {
                console.log(itemData)

                const tag = "key1";
                const campaignId = itemData.campaignId

                wixLocation.to(`/projectview?campaignId=${campaignId}&herotag=${tag}`);
            })
        });
    } catch (err) {
        console.error('Error in frontend getAllKeyArt flow:', err);
    }
}

export async function fetchDesign() {
    try {
        const res = await getAllDesignArt();

        if (!res.success) {
            console.error('getAllKeyArt failed:', res.error);
            return;
        }

        const items = res.data; // this is your normalized array

        // 1. Bind data to repeater
        $w('#repeaterDesign').data = items;

        // 2. Map each item to its UI elements
        $w('#repeaterDesign').onItemReady(($item, itemData, index) => {
            // Text element for title
            $item('#itemTitle1').text = itemData.artTitle || '';

            // Image element for thumbnail (16:9)
            $item('#thumbImage1691').src = itemData.thumbnail || '';
            $item('#thumbImage1691').alt = itemData.artTitle || '';

            $item('#designItem').onClick(() => {
                console.log(itemData)
                const campaignId = itemData.campaignId;

                const tag = "des1";

                wixLocation.to(`/projectview?campaignId=${campaignId}&herotag=${tag}`);
                // const hero
            })
        });
    } catch (err) {
        console.error('Error in frontend getAllKeyArt flow:', err);
    }
}

function addSkeleton() {
    $w("#repeaterKA").forEachItem(($item) => {
        $item("#skeletonCont1").customClassList.add("skeleton");
        // $item("#kaTitleText").customClassList.add("skeleton");
        // $item("#readMoreButton").customClassList.add("skeleton");
    });

    $w("#repeaterDesign").forEachItem(($item) => {
        $item("#skeletonCont2").customClassList.add("skeleton");
        // $item("#digTitleText").customClassList.add("skeleton");
        // $item("#readMoreButton").customClassList.add("skeleton");
    });

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

function pickOrientation(item) {
    if (item?.keyArtPortrait) return "portrait";
    if (item?.keyArtLandscape) return "landscape";
    if (item?.keyArtSquare) return "square";
    return null;
}