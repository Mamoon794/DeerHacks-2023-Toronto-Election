import {scrapeWebsite} from "./puppeteerScrape.js";
import {cohereClassify, cohereSummary} from "./cohereSummary.js";
import {writeMongo} from "./mongoDatabase.js";
import cohere from "cohere-ai";

let puppeteerSelector = "";
let websiteText = "";
let summary = "";
let network = "";
let candidate = "";

// const testWebsite = "https://www.cp24.com/news/poll-places-olivia-chow-in-lead-in-toronto-mayoral-race-1.6376015"
// const testWebsite = "https://www.thestar.com/news/gta/2023/04/28/olivia-chow-leads-latest-toronto-election-polls-but-the-most-popular-choice-for-mayor-isnt-even-on-the-ballot.html"
// const testWebsite = "https://toronto.ctvnews.ca/poll-places-olivia-chow-in-lead-in-toronto-mayoral-race-1.6376024"
// const testWebsite = "https://www.cbc.ca/news/canada/toronto/olivia-chow-toronto-mayor-byelection-1.6812750";
// const testWebsite = "https://www.cbc.ca/news/canada/toronto/city-council-docking-pay-josh-matlow-1.6798416";

if (testWebsite.includes("cbc")) {
    puppeteerSelector = ".story";
    websiteText = await scrapeWebsite(testWebsite, puppeteerSelector);
    websiteText = websiteText[0];
    network = "CBC";
}
else if (testWebsite.includes("ctv")) {
    puppeteerSelector = ".c-text";
    websiteText = await scrapeWebsite(testWebsite, puppeteerSelector);
    websiteText = websiteText[0].replace(/\\n.*\\t/, '').replace(/\s+/g,' ').trim();
    network = "CTV";
}
else if (testWebsite.includes("cp24")) {
    puppeteerSelector = ".articleBody";
    websiteText = await scrapeWebsite(testWebsite, puppeteerSelector);
    websiteText = websiteText[0].replace(/\\n.*\\t/, '').replace(/\s+/g,' ').trim();
    network = "CP24";
}
else if (testWebsite.includes("thestar")) {
    puppeteerSelector = ".text-block-container";
    websiteText = await scrapeWebsite(testWebsite, puppeteerSelector);
    websiteText = websiteText.join(" ").replace(/\s+/g,' ').trim();
    network = "Toronto Star";
}
else {
    console.log("Unsupported website");
}

// console.log(websiteText);
summary = await cohereSummary(websiteText);
console.log(summary);
candidate = await cohereClassify(websiteText);
// console.log(candidate);

// await writeMongo(testWebsite, network, summary, candidate, 0.9, 0.7);