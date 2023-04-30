# Running the Program
1. Clone the repository or zip and extract it.
1. Navigate into the directory with terminal three different terminal windows.
1. Inside the Python directories, type `python3 -m venv venv` then `. venv/bin/activate`.
1. Do `python3 main.py` and `python3 youtube-scraping.py` to run the Python functions in their respective terminals.
1. Inside the Node folder, create a `.env` file with your MongoDB and Cohere API key. You'll also need to change the database in the MongoDB JavaScript file.
1. For Node, run `npm install` and `node index`.
1. You can then navigate to [http://localhost:5000](http://localhost:5000) and play around.

# Background
## What inspired us?
Given that the discourse between politicians and the general public has been, is, and will always be quintessential to democratic societies, it is concerning that there isn’t a centralized medium of information regarding political candidates and politicians alike. A user friendly place where anyone of any age can go and look up answers to questions like:
- Who’s participating in the upcoming municipal/provincial/federal elections?
- Which agendas do they support and which ones do they oppose?
- Do they have a political history? If so, then what policies/bills have they voted for/against in the past? How often did they keep their promise?

There seems to be such an obvious gap of information between those who are governing and those who are being governed, yet no one has stepped up to bridge this gap. Politics need not be such a confusing black box, but instead can be made to be easily accessible to everyone. 

## What is our project?
The Toronto Municipal elections are taking place in 2 months (June 2023). With over 50 candidates, one of them will emerge victorious as the Mayor of Toronto. It can prove to be quite a task to get a comprehensive grasp of any one candidate, with having to scour through news articles and videos with no clear direction about how to do so efficiently, let alone to do it for more than 50 candidates.

This is where we come in. Given the limited amount of time in our hands, we could not cover every candidate, but we did create an online database for the 6 most popular ones. Upon entering the website, a user can:
- Just pick a politician and they will be given the links to all the different social media accounts of the politician.
- Choose a politician, then choose a topic (or vice versa) and they are shown all the relevant news articles/videos.
- If the user would like to add information to the database themselves, they can simply submit the link to the webpage they want us to add, which will then automatically be added to our database within 30 seconds, if we don’t already have it.

## How we built it
The frontend passes the candidate and topics to the NodeJS server via a POST request. Node sends a request to MongoDB for the specific content. This is then returned to the frontend as a JSON.

To submit new sources to the database, the user would submit a link via the frontend. If it's a YouTube video, a POST request to the YouTube Flask server will be sent. It will then be sent to NodeJS for summary, classification, and writing to MongoDB. If it's a news article it'll be sent NodeJS to be scraped with Puppeteer first and then the rest.

Cohere's natural language processing is used to summarize and classify. We classify the candidates and the topics based on our training data.

## Challenges we ran into
- Getting POST requests to interact with each other
- Scraping specifics from websites
- Finding sources

## Accomplishments that we're proud of
- Database continues to increase as users submit
- Very simple and easy to use

## What we learned
- Better POST requests for Python and JavaScript
- How to scrape transcripts from YouTube

## What's next for Politics Simplified
- Nicer user interface
- Create a logo
- Improved training data
