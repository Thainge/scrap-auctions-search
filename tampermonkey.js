// ==UserScript==
// @name        Search auctions
// @author      Llorence
// @version     1.9
// @namespace   https://github.com/Thainge
// @author      Thainge
// @license     MIT
// @description Added search functionallity to auctions
// @match       *://*.scrap.tf/*
// @grant       GM_addStyle
// @supportURL  https://github.com/Thainge/scrap-auctions-search/issues
// @homepageURL https://github.com/Thainge/scrap-auctions-search
// @downloadURL https://github.com/Thainge/scrap-auctions-search/blob/main/tampermonkey.js
// @updateURL   https://github.com/Thainge/scrap-auctions-search/blob/main/tampermonkey.js
// ==/UserScript==

const filterOptions = document.querySelectorAll('.panel-info')[1];
const auctionList = document.querySelector('#raffles-list');
let startedSearch = false;

var totalTitleEl = filterOptions.children[1].children[0].childNodes[1].data;

if (filterOptions.children[1].children[0].childNodes.length === 7) {
    totalTitleEl = filterOptions.children[1].children[0].childNodes[2].data;
}

var totalAuctions = totalTitleEl.match(/\d/g);
totalAuctions = totalAuctions.join("");

let search = document.createElement("Input");
search.placeholder = "Search for an item...            TIP: Use & and || to use AND/OR";
search.style = "font-size: .9em; padding-left: .5em; padding-bottom: .5em; padding-top: .5em; width:100%; border: none";

search.onfocus = searchFocused(search);
function searchFocused(element) {
    element.style = 'font-size: .9em; outline: none; padding-left: .5em; padding-bottom: .5em; padding-top: .5em; width:100%; border: none';
}

// Get possible value from localstorage
const scrapQuery = localStorage.getItem("scrapQuery");

// If valid localstorage query set value
if (scrapQuery) {
    search.value = scrapQuery;
}

filterOptions.insertBefore(search, filterOptions.children[2]);

let loading = document.createElement("Div");
loading.innerHTML = 'Loading...';

async function handleSearchChange(e) {
    let value = e.target.value;
    let lowerValue = value.toLowerCase();
    let strings = lowerValue.split("||");

    let searchArr = [];

    strings.forEach((item, index) => {
        let arrItems = [item.trim()];

        // If includes && split into strings
        if (item.includes("&")) {
            arrItems = [];
            let splitItem = item.split("&");

            splitItem.forEach((str, ind) => {
                arrItems = [...arrItems, str.trim()];
            });
        }

        searchArr = [...searchArr, arrItems];
    });

    if ((e.key === 'Enter' || e.keyCode === 13) && startedSearch === false) {
        startedSearch = true;
        // Save value to localstorage
        localStorage.setItem("scrapQuery", value);

        filterOptions.insertBefore(loading, filterOptions.children[3]);
        loading.style = 'padding-left: .5em; display: block;';
        let auctionsArr = await getScrapAuctions(searchArr);

        auctionList.innerHTML = '';
        auctionsArr.forEach((item) => {
            auctionList.appendChild(item);
        });
        loading.style = 'display: none;';
    }
}

async function getScrapAuctions(searchArr) {
    let scrapList = [];

    let url = 'https://scrap.tf/auctions';

    let finished = false;

    // Pulls all action boxes
    for (let i = 1; i < 99; i++) {
        if (finished === false) {
            loading.innerHTML = "Loading " + i + " pages out of " + Math.trunc(totalAuctions / 28);
            const response = await fetch(`${url}/${i}`);
            const data = await response.text();

            let parser = new DOMParser();
            let doc = parser.parseFromString(data, "text/html");

            // Pull all auction boxes
            let auctions = doc.querySelectorAll('.panel-auction');

            if (auctions.length < 28) {
                finished = true;
            }

            // Filter them by search value
            auctions.forEach((item, index) => {
                if (index === 0 || index === 1) {
                    return;
                } else {
                    const regexFilter = item.innerHTML;

                    let includesSearch = false;

                    if (regexFilter) {

                        // Loop over search terms
                        searchArr.forEach((item) => {
                            if (item.every(s => regexFilter.toLowerCase().includes(s))) {
                                includesSearch = true;
                            }
                        });
                    }

                    if (includesSearch === true) {
                        scrapList.push(item);
                    }
                }
            });
        } else {
            break;
        }
    }

    startedSearch = false;
    // Then return the scrapList array
    return scrapList;
}

document.querySelectorAll('.panel-info')[1].addEventListener(
    'keyup',
    handleSearchChange,
    false
);
