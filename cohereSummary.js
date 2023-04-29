import cohere from "cohere-ai";
import dotenv from "dotenv";
dotenv.config();
const cohere_key = process.env.COHERE_API_KEY;
cohere.init(cohere_key);
import exampleData from "./examples.json" assert { type: "json" };
const examples = JSON.parse(JSON.stringify(exampleData));

export async function cohereSummary (input) {
    // Cohere summary
    const summarize = await cohere.summarize({model: "summarize-xlarge",
        text: input,
        length: 'medium',
        format: 'paragraph'
    });
    return summarize.body.summary;
}

export async function cohereClassify (input) {
    input = [input];
    // console.log(input)
    // analyze sentiment of messages
    const classification = await cohere.classify({
        inputs: input,
        examples: examples,
    });
    console.log(classification.body.classifications[0].prediction);
    console.log(classification.body.classifications[0].confidence);
    return classification.body.classifications[0].prediction;
}