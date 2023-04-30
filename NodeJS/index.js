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
        console.log("STARTIT");
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
    await writeMongo(testWebsite, network, summary, candidate, transit, crime, housing, sentiment.prediction);
    return "Wrote to database";
}

async function refreshCandidates() {
    // matlow
    let linkList = await scrapeLinks("https://www.votematlow.ca/news");
    let finalList = [];
    let counter = 0;
    for (var i in linkList) {
        if (linkList[i][0].includes("news/")) {
            finalList[counter] = linkList[i][0];
            counter++;
        }
    }
    finalList = [...new Set(finalList)];
    console.log(finalList);
    for (var i in finalList) {
        let linkResult = await fetchDuplicate(finalList[i]);
        console.log(linkResult.documents.length);
        if (linkResult.documents.length == 0) {
            websiteText = await scrapeWebsite(finalList[i],".sqs-block-content");
            websiteText = websiteText[0].replace(/\s+/g,' ').trim();
            console.log(websiteText);
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
            await writeMongo(finalList[i], "Candidate Website", summary, candidate, transit, crime, housing, sentiment.prediction);
        }
    }

    // chow
    linkList = await scrapeLinks("https://www.oliviachow.ca/updates");
    // console.log(linkList);
    finalList = [];
    counter = 0;
    for (var i in linkList) {
        // console.log(linkList[i][0]);
        if (linkList[i][0].includes("https://www.oliviachow.ca/") && linkList[i][0].includes("_") && !linkList[i][0].includes("user_sessions")) {
            finalList[counter] = linkList[i][0];
            counter++;
        }
    }
    finalList = [...new Set(finalList)];
    console.log(finalList);
    for (var i in finalList) {
        let linkResult = await fetchDuplicate(finalList[i]);
        console.log(linkResult.documents.length);
        if (linkResult.documents.length == 0) {
            websiteText = await scrapeWebsite(finalList[i], "div p");
            websiteText = websiteText.join().trim();
            console.log(websiteText);
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
            await writeMongo(finalList[i], "Candidate Website", summary, candidate, transit, crime, housing, sentiment.prediction);
        }
    }

    // mitzie
    linkList = await scrapeLinks("https://www.mitzieformayor.ca/news");
    // console.log(linkList);
    finalList = [];
    counter = 0;
    for (var i in linkList) {
        // console.log(linkList[i][0]);
        if (linkList[i][0].includes("https://www.mitzieformayor.ca")) {
            finalList[counter] = linkList[i][0];
            counter++;
        }
    }
    console.log(finalList);
    for (var i in finalList) {
        let linkResult = await fetchDuplicate(finalList[i]);
        console.log(linkResult.documents.length);
        if (linkResult.documents.length == 0) {
            websiteText = await scrapeWebsite(finalList[i],".wixui-rich-text__text");
            websiteText = websiteText.join().replace(/\s+/g,' ').trim();
            console.log(websiteText);
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
            await writeMongo(finalList[i], "Candidate Website", summary, candidate, transit, crime, housing, sentiment.prediction);
        }
    }

    // bailao
    linkList = await scrapeLinks("https://anabailao.ca/latest-news");
    // console.log(linkList);
    finalList = [];
    counter = 0;
    for (var i in linkList) {
        // console.log(linkList[i][0]);
        if (linkList[i][0].includes("https://anabailao.ca/latest-news/") && linkList[i][0].includes("-")) {
            finalList[counter] = linkList[i][0];
            counter++;
        }
    }
    console.log(finalList);
    for (var i in finalList) {
        let linkResult = await fetchDuplicate(finalList[i]);
        console.log(linkResult.documents.length);
        if (linkResult.documents.length == 0) {
            websiteText = await scrapeWebsite(finalList[i],"span");
            websiteText = websiteText.join().replace(/\s+/g,' ').trim();
            console.log(websiteText);
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
            await writeMongo(finalList[i], "Candidate Website", summary, candidate, transit, crime, housing, sentiment.prediction);
        }
    }

    // bradford
    linkList = await scrapeLinks("https://www.votebradford.ca/priorities");
    // console.log(linkList);
    finalList = [];
    counter = 0;
    for (var i in linkList) {
        // console.log(linkList[i][0]);
        if (linkList[i][0].includes("https://www.votebradford.ca/")) {
            finalList[counter] = linkList[i][0];
            counter++;
        }
    }
    for (var i = 0; i < 8; i++) {
        finalList.shift();
    }
    console.log(finalList);
    for (var i in finalList) {
        let linkResult = await fetchDuplicate(finalList[i]);
        console.log(linkResult.documents.length);
        if (linkResult.documents.length == 0) {
            websiteText = await scrapeWebsite(finalList[i],"p span");
            websiteText = websiteText.join().trim();
            console.log(websiteText);
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
            await writeMongo(finalList[i], "Candidate Website", summary, candidate, transit, crime, housing, sentiment.prediction);
        }
    }

    // saunders
    linkList = await scrapeLinks("https://marksaundersfortoronto.ca/news");
    // console.log(linkList);
    finalList = [];
    counter = 0;
    for (var i in linkList) {
        // console.log(linkList[i][0]);
        if (linkList[i][0].includes("https://marksaundersfortoronto.ca/news/")) {
            finalList[counter] = linkList[i][0];
            counter++;
        }
    }
    console.log(finalList);
    for (var i in finalList) {
        let linkResult = await fetchDuplicate(finalList[i]);
        console.log(linkResult.documents.length);
        if (linkResult.documents.length == 0) {
            websiteText = await scrapeWebsite(finalList[i],"div p");
            websiteText = websiteText.join().trim();
            console.log(websiteText);
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
            await writeMongo(finalList[i], "Candidate Website", summary, candidate, transit, crime, housing, sentiment.prediction);
        }    }
}
// refreshCandidates();