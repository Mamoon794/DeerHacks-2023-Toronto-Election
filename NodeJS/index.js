import {scrapeWebsite} from "./puppeteerScrape.js";
import {cohereClassify, cohereSummary} from "./cohereSummary.js";
import {fetchDuplicate, writeMongo} from "./mongoDatabase.js";
import {fetchDB} from "./mongoDatabase.js";
import {scrapeLinks} from "./puppeteerScrape.js";
import cohere from "cohere-ai";

import {json} from "express";
import express from "express";
import puppeteer from "puppeteer";

import request from "request"

var app = express();
var port = 3000;

let puppeteerSelector = "";
let websiteText = "";
let summary = "";
let network = "";
let candidate = "";
let transit = 0;
let crime = 0;
let housing = 0;

app.post('/post', async (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    console.log("New express client");
    console.log("Received: ");
    console.log(req.query['data']);
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
        let articles = await fetchDB(requestInfo['candidate'], requestInfo['sentiment'])
        console.log(articles);
        var jsontext = JSON.stringify({
            'action': 'retrieveArticle',
            'message': articles
        });
        console.log(jsontext);
        res.send(jsontext);
    } else if (requestInfo['action'].includes('newTranscript')) {
        console.log(requestInfo['link']);
        let message = await newTranscript(requestInfo['link'], requestInfo['transcript'], requestInfo['network']);
        var jsontext = JSON.stringify({
            'action': 'newTranscript',
            'message': message
        });
        res.send(jsontext);
    }
}).listen(3000);
console.log("Server is running! (listening on http://localhost:" + port + ")");

async function newTranscript(link, transcript, network) {
    // writeToDatebase(link, transcript, network);
    summary = await cohereSummary(transcript);
    console.log(summary);
    candidate = (await cohereClassify(transcript, "candidate")).prediction;
    console.log(candidate);
    let sentiment = await cohereClassify(transcript);
    console.log(sentiment.prediction);
    console.log(sentiment.confidence);
    if (sentiment.prediction.includes("protransit")) {
        transit = sentiment.confidence;
        crime = 0;
        housing = 0;
    }
    else if (sentiment.prediction.includes("anticrime")) {
        transit = 0;
        crime = sentiment.confidence;
        housing = 0;
    }
    else if (sentiment.prediction.includes("prohousing")) {
        transit = 0;
        crime = 0;
        housing = sentiment.confidence;
    }
    await writeMongo(link, network, summary, candidate, transit, crime, housing, sentiment.prediction);
    return "Wrote to database";
}

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
    else if (testWebsite.includes("torontosun")) {
        puppeteerSelector = "section p";
        websiteText = await scrapeWebsite(testWebsite, puppeteerSelector);
        websiteText = websiteText.join().trim();
        network = "Toronto Sun"
    }
    else {
        console.log("Unsupported website");
        return "Unsupported website";
    }
    // console.log(websiteText);
    writeToDatebase(testWebsite, websiteText, network);
    // summary = await cohereSummary(websiteText);
    // console.log(summary);
    // candidate = (await cohereClassify(websiteText, "candidate")).prediction;
    // console.log(candidate);
    // let sentiment = await cohereClassify(websiteText);
    // console.log(sentiment.prediction);
    // console.log(sentiment.confidence);
    // if (sentiment.prediction.includes("protransit")) {
    //     transit = sentiment.confidence;
    //     crime = 0;
    //     housing = 0;
    // }
    // else if (sentiment.prediction.includes("anticrime")) {
    //     transit = 0;
    //     crime = sentiment.confidence;
    //     housing = 0;
    // }
    // else if (sentiment.prediction.includes("prohousing")) {
    //     transit = 0;
    //     crime = 0;
    //     housing = sentiment.confidence;
    // }
    // await writeMongo(testWebsite, network, summary, candidate, transit, crime, housing, sentiment.prediction);
    return "Wrote to database";
}

async function refreshCandidates() {
    await candidateWebsite("https://marksaundersfortoronto.ca/news", "https://marksaundersfortoronto.ca/news/", "div p", 1);
    await candidateWebsite("https://www.votebradford.ca/priorities", "https://www.votebradford.ca/", "p span", 1, 1);
    await candidateWebsite("https://anabailao.ca/latest-news", "https://anabailao.ca/latest-news/", "span", 2, 0, 1);
    await candidateWebsite("https://www.mitzieformayor.ca/news", "https://www.mitzieformayor.ca", ".wixui-rich-text__text", 2);
    await candidateWebsite("https://www.oliviachow.ca/updates", "https://www.oliviachow.ca/", "div p", 1, 2, 2);
    await candidateWebsite("https://www.votematlow.ca/news", "news/", ".sqs-block-content", 2, 2);
}

async function candidateWebsite(website, extractText, selector, trimMethod, listMethod, extractMethod) {
    let linkList = await scrapeLinks(website);
    // console.log(linkList);
    let finalList = [];
    let counter = 0;
    switch (extractMethod) {
        case 1:
            for (var i in linkList) {
                if (linkList[i][0].includes(extractText) && linkList[i][0].includes("-")) {
                    finalList[counter] = linkList[i][0];
                    counter++;
                }
            }
            break;
        case 2:
            for (var i in linkList) {
                if (linkList[i][0].includes(extractText) && linkList[i][0].includes("_") && !linkList[i][0].includes("user_sessions")) {
                    finalList[counter] = linkList[i][0];
                    counter++;
                }
            }
            break;
        default:
            for (var i in linkList) {
                if (linkList[i][0].includes(extractText)) {
                    finalList[counter] = linkList[i][0];
                    counter++;
                }
            }
            break;
    }
    switch(listMethod) {
        case 1:
            for (var i = 0; i < 8; i++) {
                finalList.shift();
            }
            break;
        case 2:
            finalList = [...new Set(finalList)];
            break;
    }
    console.log(finalList);
    for (i in finalList) {
        let linkResult = await fetchDuplicate(finalList[i]);
        console.log(linkResult.documents.length);
        if (linkResult.documents.length == 0) {
            websiteText = await scrapeWebsite(finalList[i], selector);
            switch(trimMethod) {
                case 1:
                    websiteText = websiteText.join().trim();
                    break;
                case 2:
                    websiteText = websiteText.join().replace(/\s+/g,' ').trim();
                    break;
            }
            writeToDatebase(finalList[i], websiteText, "Candidate Website");
        }
    }
}

async function writeToDatebase(link, websiteText, network) {
    summary = await cohereSummary(websiteText);
    console.log(summary);
    candidate = (await cohereClassify(websiteText, "candidate")).prediction;
    console.log(candidate);
    let sentiment = await cohereClassify(websiteText);
    console.log(sentiment.prediction);
    console.log(sentiment.confidence);
    if (sentiment.prediction.includes("protransit")) {
        transit = sentiment.confidence;
        crime = 0;
        housing = 0;
    } else if (sentiment.prediction.includes("anticrime")) {
        transit = 0;
        crime = sentiment.confidence;
        housing = 0;
    } else if (sentiment.prediction.includes("prohousing")) {
        transit = 0;
        crime = 0;
        housing = sentiment.confidence;
    }
    await writeMongo(link, network, summary, candidate, transit, crime, housing, sentiment.prediction);
}
// refreshCandidates();