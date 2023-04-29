// Change these to your MongoDB database
const mongoCollection = "deer";
const mongoDatabase = "athena";
const mongoDataSource = "DeerHacks";
const mongoEndPoint = "https://us-east-2.aws.data.mongodb-api.com/app/data-mwspn/endpoint/data/v1/action/insertOne";


import axios from "axios";
import dotenv from "dotenv";
dotenv.config();
const mongo_key = process.env.MONGO_API_KEY;

// writes the information to MongoDB
export async function writeMongo(link, network, summary, candidate, transitSentiment, taxSentiment) {
    var data = JSON.stringify({
        "collection": mongoCollection,
        "database": mongoDatabase,
        "dataSource": mongoDataSource,
        "document": {
            link: link,
            network: network,
            summary: summary,
            candidate: candidate,
            transitSentiment: transitSentiment,
            taxSentiment: taxSentiment
        }
    });

    var config = {
        method: 'post',
        url: mongoEndPoint,
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