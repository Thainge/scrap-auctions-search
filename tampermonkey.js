// ==UserScript==
// @name           Search auctions
// @author         Llorence
// @version        1.0
// @description    Added search functionallity to auctions
// @match          *://*.scrap.tf/*
// @grant          GM_addStyle
// ==/UserScript==

const filterOptions = document.querySelectorAll('.panel-info')[1];
const auctionList = document.querySelector('#raffles-list');

var totalAuctions = filterOptions.children[1].children[0].innerHTML.match(/\d/g);
totalAuctions = totalAuctions.join("");


let search = document.createElement("Input");
search.placeholder = "Search for an item... TIP: Use && to search for multiple terms";
search.style = "font-size: .9em; padding-left: .5em; padding-bottom: .5em; padding-top: .5em; width:100%; border: none";

search.onfocus = searchFocused(search);
function searchFocused(element) {
    element.style = 'font-size: .9em; outline: none; padding-left: .5em; padding-bottom: .5em; padding-top: .5em; width:100%; border: none';
}

filterOptions.insertBefore(search, filterOptions.children[2]);

let loading = document.createElement("Div");
loading.innerHTML = 'Loading...';

async function handleSearchChange(e) {
    let value = e.target.value;
    let lowerValue = value.toLowerCase();
    let stringArr = lowerValue.split("&&");

    stringArr.forEach((item, index) => {
        stringArr[index] = item.trim();
    });

    if (e.key === 'Enter' || e.keyCode === 13) {
        filterOptions.insertBefore(loading, filterOptions.children[3]);
        loading.style = 'padding-left: .5em; display: block;';
        let auctionsArr = await getScrapAuctions(stringArr);

        auctionList.innerHTML = '';
        auctionsArr.forEach((item) => {
           auctionList.appendChild(item);
        });
        loading.style = 'display: none;';
    }
}

async function getScrapAuctions(searchValue) {
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
                        if (searchValue.every(s => regexFilter.toLowerCase().includes(s))) {
                            includesSearch = true;
                        }
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

    // Then return the scrapList array
    return scrapList;
}

document.querySelectorAll('.panel-info')[1].addEventListener(
  'keyup',
  handleSearchChange,
  false
);
