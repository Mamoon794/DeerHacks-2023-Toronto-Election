
from bs4 import BeautifulSoup as bs
from urllib.request import urlopen, Request
from typing import List, Dict
import csv
import json
from pathlib import Path
import pymongo
import requests
from flask import Flask, request, make_response, jsonify

from youtubesearchpython import VideosSearch
from youtube_transcript_api import YouTubeTranscriptApi

app = Flask(__name__)
@app.route("/", methods=['GET', 'POST'])
def home():
    data = request.get_json()
    data = json.loads(data)
    url = data['url']
    result = get_youtube_video_data_from_url(url)
    # print(result)
    # result = json.loads(result)
    result = make_response(jsonify(result), 200)
    return result


def get_youtube_video_data_from_url(url) -> list[dict[str, str, str]]:
    """
        Returns list of video data for the given url
     """

    id = url[url.index('?v=') + 3:]
    url_opener = urlopen(Request(url, headers={'User-Agent': 'Mozilla'}))
    videoInfo = bs(url_opener, features="html.parser")
    channel_title = str(videoInfo.find("link", itemprop="name"))
    publisher = channel_title[len('<link content="'):-len('" itemprop="name"/>')]
    transcript = get_youtube_video_transcript(id)
    n = len(transcript)
    # partition = n // 1000
    # for i in range(partition):
    #     part = transcript[i:i+1000]
    #     x = {'action': 'newTranscript', 'link': url, 'network': publisher, 'transcript': part}
    #     x = json.dumps(x)
    #     urls = 'https://localhost:3000/post?data='
    #     urls += x
    #     requests.post(urls)
    part = transcript
    x = {"action": "newTranscript", "link": url, "network": publisher, "transcript": transcript}
    x = json.dumps(x)
    urls = "http://localhost:3000/post?data="
    urls += x
    var = requests.post(urls, json=x)
    response_data = var.json()

    urls = "http://localhost:3000/post?data="

    return response_data


def get_youtube_video_data_from_keyword(keyword: str, limit: int = 10) -> list[dict[str, str, str]]:
    """
    Returns list of data we find for the given 'keyword'
    """
    count = 0
    video_search = VideosSearch(keyword, 100)
    res = video_search.result()['result']
    return [{'link': r['link'], 'publisher': r['channel']['name'],
             'transcript': get_youtube_video_transcript(r['id'])} for r in res]


def get_youtube_video_transcript(video_id: str) -> str:
    """"
    Returns transcript of the given 'video_id'
    """
    try:
        transcript = YouTubeTranscriptApi.get_transcript(
            video_id, languages=['en-US', 'en']
        )
        utterances = [p['text'] for p in transcript]
        return ' '.join(utterances)

    except Exception as e:
        pass


if __name__ == '__main__':
    app.run(debug=True, port=5001)
    home()











