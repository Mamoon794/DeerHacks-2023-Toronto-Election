import {scrapeWebsite} from "./puppeteerScrape.js";
import {cohereClassify, cohereSummary} from "./cohereSummary.js";
import {writeMongo} from "./mongoDatabase.js";
import {fetchDB} from "./mongoDatabase.js";
import {scrapeLinks} from "./puppeteerScrape.js";
import cohere from "cohere-ai";

// const { json } = require('express');
import {json} from "express";
// var express  = require('express');
import express from "express";
import puppeteer from "puppeteer";
var app = express();
var port = 3000;

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

app.post('/post', async (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    console.log("New express client");
    console.log("Received: ");
    console.log(JSON.parse(req.query['data']));
    var requestInfo = JSON.parse(req.query['data']);

    if (requestInfo['action'].includes('newArticle')) {
        console.log(requestInfo['link']);
        let message = await newArticle(requestInfo['link']);
        var jsontext = JSON.stringify({
            'action': 'newArticle',
            'message': message
        });
        res.send(jsontext);
    } else if (requestInfo['action'].includes('retrieveArticle')) {
        let articles = await fetchDB(requestInfo['candidate'], requestInfo['topic'])
        console.log(articles);
        var jsontext = JSON.stringify({
            'action': 'retrieveArticle',
            'message': articles
        });
        res.send(jsontext);
    }
}).listen(3000);
console.log("Server is running! (listening on http://localhost:" + port + ")");

async function newArticle(testWebsite) {
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
        return "Unsupported website";
    }

    // console.log(websiteText);
    summary = await cohereSummary(websiteText);
    console.log(summary);
    candidate = await cohereClassify(websiteText);
    // console.log(candidate);
    // await writeMongo(testWebsite, network, summary, candidate, 0.9, 0.7);
    return "Wrote to database";
}

async function refreshCandidates() {
    // matlow
    // let linkList = await scrapeLinks("https://www.votematlow.ca/news");
    // let finalList = [];
    // let counter = 0;
    // for (var i in linkList) {
    //     if (linkList[i][0].includes("news/")) {
    //         finalList[counter] = linkList[i][0];
    //         counter++;
    //     }
    // }
    // finalList = [...new Set(finalList)];
    // console.log(finalList);
    // for (var i in finalList) {
    //     let websiteText = await scrapeWebsite(finalList[i],".sqs-block-content");
    //     websiteText = websiteText[0].replace(/\s+/g,' ').trim();
    //     // console.log(websiteText);
    //     summary = await cohereSummary(websiteText);
    //     console.log(summary);
    //     candidate = await cohereClassify(websiteText);
    //     console.log(candidate);
    // }

    // chow
    // let linkList = await scrapeLinks("https://www.oliviachow.ca/updates");
    // console.log(linkList);
    // let finalList = [];
    // let counter = 0;
    // for (var i in linkList) {
    //     // console.log(linkList[i][0]);
    //     if (linkList[i][0].includes("https://www.oliviachow.ca/") && linkList[i][0].includes("_") && !linkList[i][0].includes("user_sessions")) {
    //         finalList[counter] = linkList[i][0];
    //         counter++;
    //     }
    // }
    // finalList = [...new Set(finalList)];
    // console.log(finalList[0]);
    // let websiteText = await scrapeWebsite(finalList[0],".intro inner-spacing");
    // console.log(websiteText);

    // mitzie
    let linkList = await scrapeLinks("https://www.mitzieformayor.ca/news");
    console.log(linkList);
    let finalList = [];
    let counter = 0;
    for (var i in linkList) {
        // console.log(linkList[i][0]);
        if (linkList[i][0].includes("https://www.mitzieformayor.ca")) {
            finalList[counter] = linkList[i][0];
            counter++;
        }
    }
    console.log(finalList);
    for (var i in finalList) {
        let websiteText = await scrapeWebsite(finalList[i],".wixui-rich-text__text");
        websiteText = websiteText.join().replace(/\s+/g,' ').trim();
        // console.log(websiteText);
        summary = await cohereSummary(websiteText);
        console.log(summary);
        candidate = await cohereClassify(websiteText);
        console.log(candidate);
    }
}
refreshCandidates();