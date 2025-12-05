// // pages/search.js
// import wixWindowFrontend from 'wix-window-frontend';
// import { getAllShowcases, getAllVideos, getAllCampaignNames, getCategories } from 'backend/vimeo.web.js';

// //quick elements 
// const mediaTypeSelector = $w("#mediaTypeSelector");
// const campaignSelector = $w("#campaignSelector");
// const yearSelector = $w("#yearSelector");
// const searchInput = $w("#searchInput")
// const mediaRepeater = $w("#mediaRepeater");
// const thumbImage = $w("#thumbImage");
// const mediaTitle = $w("#titleText");
// const filterElm = {mediaTypeSelector, campaignSelector, yearSelector};
// const mediaRepElm = {mediaRepeater, thumbImage, mediaTitle};


// const PER_PAGE_ALBUMS = 25;
// const PER_PAGE_VIDEOS = 8;
// const SEARCH_DEBOUNCE_MS = 250;


// let allAlbums = [];
// let allItems = [];
// let filtered = [];

// let currentPage = 1;
// const itemsPerPage = 25; // Set the number of items per page let totalPages;
// let totalPages;


//   $w.onReady(async function () {
//        loadVideos(1); // Load first page on page load
//   });
  
// async function loadVideos(pageNumber) {
//     try {
//         // Show loading state
//         $w('#pagination1').disable();
        
//         // Call your backend function
//         const result = await getAllVideos(pageNumber, 25);
//         console.log(result)

//         calculateTotalPages(result.total);
        
//         // Update pagination bar
//         // updatePagination(result.total, pageNumber);
        
        
//         // Display videos
//         displayVideos(result.videos);
        
//     } catch (error) {
//         console.error('Error loading videos:', error);
//     } finally {
//         $w('#pagination1').enable();
//     }
// }

// function displayVideos(videos) {
//     console.log("Videos data:", videos); // This will show the full array in console
    
//     const repeater = $w('#mediaRepeater');
    
//     // Map the videos data to include thumbnail property
//     const repeaterData = videos.map(video => {
//         return {
//             _id: video.id, // Required for repeater
//             title: video.title,
//             thumbnail: video.thumbnail, // Make sure this matches your data
//             description: video.description,
//             duration: video.duration
//         };
//     });
    
//     console.log("Processed repeater data:", repeaterData);
    
//     repeater.data = repeaterData;
    
//     repeater.onItemReady(($item, itemData, index) => {
//         console.log(`Item ${index} data:`, itemData); // Debug individual items
        
//         // Set the title
//         $item('#titleText').text = itemData.title || 'No Title';
        
//         // Set the thumbnail image - CRITICAL: use the correct property name
//         if (itemData.thumbnail) {
//           thumbImage.show();
//             $item('#thumbImage').src = itemData.thumbnail;
//             console.log(`Set thumbnail for: ${itemData.title}`, itemData.thumbnail);
//         } else {
//             console.warn(`No thumbnail for: ${itemData.title}`);
//         }
        
//         // Optional: Add click handler to select this thumbnail
//         $item('#thumbImage').onClick(() => {
//             selectThumbnail(itemData.thumbnail, itemData.title);
//         });
//     });
// }

// // Function to handle thumbnail selection
// function selectThumbnail(thumbnailUrl, title) {
//     console.log("Selected thumbnail:", thumbnailUrl, "for title:", title);
    
//     // Set the selected thumbnail to your main Wix image
//     const mainImage = $w('#thumbImage'); // Add this image element to your page
//     if (mainImage) {
//         mainImage.src = thumbnailUrl;
//     }
    
//     // You can also store the selection for later use
//     wixWindowFrontend.lightbox.close(thumbnailUrl);
// }


// function calculateTotalPages(count) {
//             const totalPages = Math.ceil(count / itemsPerPage);
//             console.log(totalPages);
// }


// async function loadShowcaseCheckboxes() {
//     try{
//         campaignSelector.hide();
        
//         const response = await getAllCampaignNames(1, 100);

//         const showcaseNames = response.albums.map(album => album.name);
        
//         poulateCheckbox(showcaseNames);
        

//     } catch(Error) {
//         console.error("Error loading showcases:", Error);

//     }
// }

// function poulateCheckbox(showcaseNames) {
//     const checkboxGroup = $w('#checkboxGroup');
    
//     // Clear existing options
//     checkboxGroup.options = [];
    
//     // Add new options
//     showcaseNames.forEach((name, index) => {
//         checkboxGroup.options.push({
//             label: name,
//             value: name // or use index/id if you prefer
//         });
//     });
    
//     // Add event handler for selection changes
//     checkboxGroup.onChange(() => {
//         const selectedShowcases = checkboxGroup.value;
//         console.log("Selected showcases:", selectedShowcases);
//         // Do something with selected showcases
//         handleShowcaseSelection(selectedShowcases);
//     });

// }

// function handleShowcaseSelection(selectedShowcases) {
//     // Your logic for when checkboxes are selected/deselected
//     if (selectedShowcases.length > 0) {
//         $w('#submitButton').enable();
//     } else {
//         $w('#submitButton').disable();
//     }
    
//     // You can store the selection for later use
//     $w('#selectedShowcases').text = selectedShowcases.join(', ');
// }

// function getCategories() {

// }