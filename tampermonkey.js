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

let search = document.createElement("Input");
search.placeholder = "Search for an item...";
search.style = "font-size: .9em; padding-left: .5em; padding-bottom: .5em; padding-top: .5em; width:100%; border: none";

search.onfocus = searchFocused(search);
function searchFocused(element){
    element.style = 'font-size: .9em; outline: none; padding-left: .5em; padding-bottom: .5em; padding-top: .5em; width:100%; border: none';
}

filterOptions.insertBefore(search, filterOptions.children[2]);

let loading = false;

async function handleSearchChange(e) {
    let value = e.target.value;

    if (e.key === 'Enter' || e.keyCode === 13) {
        loading = true;
        let auctionsArr = await getScrapAuctions(value);

        auctionList.innerHTML = '';
        auctionsArr.forEach((item) => {
           auctionList.appendChild(item);
        });
        loading = false;
    }
}

async function getScrapAuctions(searchValue) {
    let scrapList = [];

    let url = 'https://scrap.tf/auctions';

    let finished = false;

    // Pulls all action boxes
    for (let i = 1; i < 99; i++) {
        if (finished === false) {
            const response = await fetch(`${url}/${i}`);
            const data = await response.text();

            let parser = new DOMParser();
            let doc = parser.parseFromString(data, "text/html");

            // Pull all auction boxes
            let auctions = doc.querySelectorAll('.panel-auction');

            if (auctions.length < 30) {
                finished = true;
            }

            // Filter them by search value
            auctions.forEach((item, index) => {
                if (index === 0 || index === 1) {
                    return;
                } else {
                    const regexFilter = item.children[2].children[0].innerHTML.match('<\s*span[^>]*>(.*?)<\s*\/\s*span>');

                    let includesSearch = false;

                    if (regexFilter) {
                        regexFilter.forEach((item, index) => {
                            if (item.toLowerCase().includes(searchValue.toLowerCase())) {
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

    // Then return the scrapList array
    return scrapList;
}

document.querySelectorAll('.panel-info')[1].addEventListener(
  'keyup',
  handleSearchChange,
  false
);
