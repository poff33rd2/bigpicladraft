// Lightbox: mediaPlayer.js
import wixWindowFrontend from "wix-window-frontend";
import wixLocation from 'wix-location';
import { lightbox } from 'wix-window-frontend';

// Grab elements *inside* onReady
//loader 
const loadingHtml = $w("#loadingHtml")

// //landscape
const landscapeFrame = $w("#landscapeFrame");
const landscapeImage = $w("#landscapeImage");
const landscapePlayer = $w("#landscapePlayer");
const landscapeTitle = $w("#landscapeTitle");
const landscapeDescription = $w("#landscapeDescription")

// //portrait
const portraitFrame = $w("#portraitFrame");
const squareSkeleton = $w("#squareSkeleton")
const squareImage = $w("#squareImage")
const squareTitle = $w("#squareTitle");
const squareDescription = $w("#squareDescription");

// //Square 
const squareFrame = $w("#squareFrame");
const portraitSkeleton = $w("#portraitSkeleton")
const portraitImage = $w("#portraitImage")
const portraitTitle = $w("#portraitTitle");
const portraitDescription = $w("#portraitDescription");

// // buttons
const viewCampaignLandscape = $w("#viewCampaignLandscape")
const viewMoreLikeThisLandscape = $w("#viewMoreLikeThisLandscape")
const viewCampaignSquare = $w("#viewCampaignSquare");
const viewCampaignPortrait = $w("#viewCampaignPortrait")
const viewMoreLikeThisPortrait = $w("#viewMoreLikeThisPortrait")

const viewCampaignBtn = { viewCampaignLandscape, viewCampaignPortrait, viewCampaignSquare }

// // const landscape = $w("#landscape");
// //   const portrait = $w("#portrait");
// //   const square = $w("#square");

// //   const landscapeFrame = $w("#landscapeFrame");
// //   const portraitFrame = $w("#portraitFrame");
// //   const squareFrame = $w("#squareFrame");

// //   // If you keep the HTML components for video:
// //   const landscapePlayer = $w("#landscapePlayer");
// //   const portraitPlayer = $w("#portraitPlayer");

// //   const landscapeTitle = $w("#landscapeTitle");
// //   const portraitTitle = $w("#portraitTitle");
// //   const squareTitle = $w("#squareTitle");

// //   const landscapeDescription = $w("#landscapeDescription");
// //   const portraitDescription = $w("#portraitDescription");
// //   const squareDescription = $w("#squareDescription");

// //   const viewCampaign = $w("#viewCampaignBtn");
// //   const viewMoreLikeThis = $w("#viewMoreLikeThisBtn");
// //   const loadingHtml = $w("#loadingHtml");

// //   // If you’re showing *images* for key art:
// //   const portraitImage = $w("#portraitImage");
// //   const landscapeImage = $w("#landscapeImage");
// //   const squareImage = $w("#squareImage");

// // let timeline = wixAnimations.timeline();
// // let playlist = [];
// // let idx = 0;
// // let thumbImage1 = $w('#thumbImage')
// // let thumbImage1 = $w('#thumbImage1')

// // Helper to pick an orientation if one wasn’t passed (or is missing)
// function pickOrientationFrom(item) {
//     if (item?.keyArtPortrait) return "portrait";
//     if (item?.keyArtLandscape) return "landscape";
//     if (item?.keyArtSquare) return "square";
//     return null;
//   }

// $w.onReady(() => {

//     const ctx = wixWindowFrontend.lightbox.getContext() || {};
//     const { itemData = {}, selectedOrientation, available = {} } = ctx;

//     [landscapeFrame, portraitFrame, squareFrame].forEach((f) => {
//         if (f?.customClassList) f.customClassList.add("skeleton");
//       });

//     // loadingHtml.show()

//     // Controllers for key art media

//   // Resolve which orientation to show (fallback to first available)
//   let which = selectedOrientation;
//   if (!which) {
//     if (itemData.keyArtPortrait) which = 'portrait';
//     else if (itemData.keyArtLandscape) which = 'landscape';
//     else if (itemData.keyArtSquare) which = 'square';
//   }

//   if (!which) {
//     console.warn('No key art found in lightbox context');
//     return;
//   }

//   // Set image + show the correct frame
//   if (which === 'portrait' && itemData.keyArtPortrait) {
//     if (portraitImage) portraitImage.src = itemData.keyArtPortrait;
//     if (portraitFrame) portraitFrame.show();
//   } else if (which === 'landscape' && itemData.keyArtLandscape) {
//     if (landscapeImage) landscapeImage.src = itemData.keyArtLandscape;
//     if (landscapeFrame) landscapeFrame.show();
//   } else if (which === 'square' && itemData.keyArtSquare) {
//     if (squareImage) squareImage.src = itemData.keyArtSquare;
//     if (squareFrame) squareFrame.show();
//   } else {
//     // Orientation requested but asset missing — fallback to any available
//     const fallback =
//       itemData.keyArtPortrait ? 'portrait' :
//       itemData.keyArtLandscape ? 'landscape' :
//       itemData.keyArtSquare ? 'square' : null;

//     if (!fallback) {
//       console.warn('No usable key art on item:', itemData);
//       return;
//     }

//     // recurse-lite behavior without actual recursion
//     if (fallback === 'portrait') {
//       if (portraitImage) portraitImage.src = itemData.keyArtPortrait;
//       if (portraitFrame) portraitFrame.show();
//     } else if (fallback === 'landscape') {
//       if (landscapeImage) landscapeImage.src = itemData.keyArtLandscape;
//       if (landscapeFrame) landscapeFrame.show();
//     } else if (fallback === 'square') {
//       if (squareImage) squareImage.src = itemData.keyArtSquare;
//       if (squareFrame) squareFrame.show();
//     }
//   }    

//     //   Controllers for video media
//     console.log(ctx);
//     // const { itemData, orientation } = ctx;

//     // const campaignId = itemData.tags.filter(tag => /^\d+$/.test(tag));
//     // console.log("Campaign tag: " + campaignId)

//     // landscapeDescription.text = "";

//     // console.log("Lightbox context:", ctx);
//     // console.log(itemData);
//     // console.log(orientation);

//     // if (itemData.description === "") {
//     //     landscapeDescription.collapse()
//     // } else {
//     //     landscapeDescription.text = itemData.description

//     // }

// if (ctx.link === "av") {
//     viewMoreLikeThis.onClick(() => {
//                 loadingHtml.show()
//         wixLocation.to('/av');
//         wixWindowFrontend.lightbox.close()

//     });
// } else {
//     console.log("no link found")
// }

//     // // Choose which layout to show
//     // if (orientation === "landscape") {
//     //     landscapeFrame.show();
//     //     loadIntoHtmlComponent(videoUrl, orientation)

//     //     // landscapePlayer.show();
//     //     landscapeTitle.text = itemData.title || "";
//     //     portraitFrame.hide();
//     //     squareFrame.hide()
//     // } else if (orientation === "portrait") {
//     //     portraitFrame.show();
//     //     // portraitPlayer.show();
//     //     portraitTitle.text = itemData.title || "";
//     //     landscapeFrame.hide();
//     //     squareFrame.hide();

//     // } else if (orientation === "square"){
//     //     squareFrame.show();
//     //     // portraitPlayer.show();
//     //     portraitTitle.text = itemData.title || "";
//     //     landscapeFrame.hide();
//     //     portraitFrame.hide();
//     // } else {
//     //     console.warn("No orientation passed — defaulting to try again");
//     //     landscapeFrame.hide();
//     //     squareFrame.hide()
//     //     portraitFrame.hide();
//     // }

//     // viewCampaign.onClick(() => {
//     //     console.log(campaignId)
//     //     loadingHtml.show()

//     //     wixWindowFrontend.openLightbox("projectViewer", campaignId)
//     // })

//     // $w('#landscapePlayer').onMessage((event) => {
//     //     const data = event?.data || {};
//     //     // Remove the skeleton only when the video actually begins to play
//     //     if (data.type === 'videoPlaying') {
//     //       landscapeFrame.customClassList.remove('skeleton');
//     //     }

//     //     // (Optional) You can also handle initial readiness if you want:
//     //     // if (data.type === 'videoReady') { /* show title, etc. but keep skeleton */ }
//     //   });   

// });

// NEW CODE
$w.onReady(() => {

    let ctx = wixWindowFrontend.lightbox.getContext();
    console.log(ctx)
    const videoUrl = ctx.itemData.embedUrl;

    if (ctx.type === "av") {
        landscapeTitle.text = ctx.itemData.title
        landscapeTitle.show();

        // landscapeDescription.text = ctx.itemData.des
        landscapeFrame.show();
        loadIntoHtmlComponent(videoUrl)

        viewCampaignLandscape.onClick(() => {
            loadingHtml.show();
            // const campaignId = getCampaignId(ctx);
            navigateWithCampaignId(ctx, "/project-preview");

            // Pass both the original context AND the extracted campaignId
            // const payload = {
            //     ...ctx, // spread the original context
            //     campaignId: campaignId // add the extracted campaign ID
            // };

            // wixWindowFrontend.openLightbox("projectViewer", payload);
        });

        viewMoreLikeThisLandscape.onClick(() => {
            loadingHtml.show();
            wixLocation.to('/av');
            wixWindowFrontend.lightbox.close()
        });
    } else if (ctx.type === "digital") {
        landscapeFrame.show();
        loadIntoHtmlComponent(videoUrl)

        viewCampaignLandscape.onClick(() => {
            loadingHtml.show();
            // const campaignId = getCampaignId(ctx);
            navigateWithCampaignId(ctx, "/project-preview");

            // Pass both the original context AND the extracted campaignId
            // const payload = {
            //     ...ctx, // spread the original context
            //     campaignId: campaignId // add the extracted campaign ID
            // };

            // wixWindowFrontend.openLightbox("projectViewer", payload);
        });
        viewMoreLikeThisLandscape.onClick(() => {
            loadingHtml.show()
            wixLocation.to('/digital');
            wixWindowFrontend.lightbox.close()
        });
    } else if (ctx.type === "keyart") {

        loadImage(ctx);

        if (!ctx.itemData.campaignId) {
            viewCampaignLandscape.collapse();
            viewCampaignPortrait.collapse();
            viewCampaignSquare.collapse();
        }

        viewCampaignPortrait.onClick(() => {
            loadingHtml.show();
            // const campaignId = getCampaignId(ctx);
            navigateWithCampaignId(ctx, "/project-preview");

            // Pass both the original context AND the extracted campaignId
            // const payload = {
            //     ...ctx, // spread the original context
            //     campaignId: campaignId // add the extracted campaign ID
            // };

            // wixWindowFrontend.openLightbox("projectViewer", payload);
        });

        viewCampaignSquare.onClick(() => {
            loadingHtml.show();
            // const campaignId = getCampaignId(ctx);
            navigateWithCampaignId(ctx, "/project-preview");

            // Pass both the original context AND the extracted campaignId
            // const payload = {
            //     ...ctx, // spread the original context
            //     campaignId: campaignId // add the extracted campaign ID
            // };

            // wixWindowFrontend.openLightbox("projectViewer", payload);
        });

        viewCampaignLandscape.onClick(() => {
            loadingHtml.show();
            navigateWithCampaignId(ctx, "/project-preview");

        });

        viewMoreLikeThisLandscape.onClick(() => {
            loadingHtml.show();
            wixLocation.to('/keyart');
            wixWindowFrontend.lightbox.close()
        });

    } else {
        console.log();
        // showError();
    }

})

function loadIntoHtmlComponent(url) {
    // landscapeFrame.customClassList.remove("skeleton");
    landscapePlayer.show();
    landscapePlayer.postMessage({
        type: "loadVideo",
        url
    });
}

function loadImage(info) {
    const orientation = info.selectedOrientation;
    const title = info.artTitle;

    if (orientation === "landscape") {
        landscapeFrame.show();
        landscapeImage.show();
        landscapeTitle.show();

        landscapeTitle.text = info.itemData.artTitle;
        landscapeImage.src = info.itemData.keyArtLandscape;
    } else if (orientation === "portrait") {
        portraitFrame.show();
        portraitImage.show();
        portraitTitle.show();
        portraitTitle.text = info.itemData.artTitle;
        portraitImage.src = info.itemData.keyArtPortrait;

    } else if (orientation === "square") {
        squareFrame.show();
        squareImage.show();
        squareTitle.show();
        squareTitle.text = info.itemData.artTitle;
        squareImage.src = info.itemData.keyArtSquare;

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

function navigateWithCampaignId(data, targetPageUrl) {
    const campaignId = getCampaignId(data);
    console.log(campaignId);
    if (campaignId) {
        // Navigate to the target page with the campaignId as a URL parameter
        wixLocation.to(targetPageUrl + "?campaignId=" + campaignId);
    } else {
        // Navigate to the page without the parameter if no campaignId is found
        wixLocation.to(targetPageUrl);
    }
}