// Change these to your MongoDB database
const mongoCollection = "deer";
const mongoDatabase = "athena";
const mongoDataSource = "DeerHacks";
const mongoWriteEndPoint = "https://us-east-2.aws.data.mongodb-api.com/app/data-mwspn/endpoint/data/v1/action/insertOne";
const mongoReadEndPoint = "https://us-east-2.aws.data.mongodb-api.com/app/data-mwspn/endpoint/data/v1/action/find";


import axios from "axios";
import dotenv from "dotenv";
dotenv.config();
const mongo_key = process.env.MONGO_API_KEY;

// writes the information to MongoDB
export async function writeMongo(link, network, summary, candidate, transitSentiment, crimeSentiment, housingSentiment, sentiment) {
    var data = JSON.stringify({
        "collection": mongoCollection,
        "database": mongoDatabase,
        "dataSource": mongoDataSource,
        "document": {
            link: link,
            network: network,
            summary: summary,
            candidate: candidate,
            sentiment: sentiment,
            transitSentiment: transitSentiment,
            crimeSentiment: crimeSentiment,
            housingSentiment: housingSentiment
        }
    });

    var config = {
        method: 'post',
        url: mongoWriteEndPoint,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Request-Headers': '*',
            'api-key': mongo_key,
        },
        data: data
    };

    axios(config)
        .then(function (response) {
            // console.log(JSON.stringify(response.data));
            console.log("wrote to Mongo")
            return JSON.stringify(response.data)
        })
        .catch(function (error) {
            console.log(error);
        });
}

// fetches information from database
export async function fetchDB (candidate, sentiment) {
    var data = JSON.stringify({
        "collection": mongoCollection,
        "database": mongoDatabase,
        "dataSource": mongoDataSource,
        "filter": {"candidate": candidate, "sentiment": sentiment},
        // maximum number of results that are returned from database
        "limit": 5
    });

    var config = {
        method: 'post',
        url: mongoReadEndPoint,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Request-Headers': '*',
            'api-key': mongo_key,
        },
        data: data
    };
    const res = await axios(config);
    // return JSON.stringify(res.data);
    return res.data;
}

export async function fetchDuplicate (link) {
    var data = JSON.stringify({
        "collection": mongoCollection,
        "database": mongoDatabase,
        "dataSource": mongoDataSource,
        "filter": {"link": link},
        // maximum number of results that are returned from database
        "limit": 5
    });

    var config = {
        method: 'post',
        url: mongoReadEndPoint,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Request-Headers': '*',
            'api-key': mongo_key,
        },
        data: data
    };
    const res = await axios(config);
    // return JSON.stringify(res.data);
    return res.data;
}