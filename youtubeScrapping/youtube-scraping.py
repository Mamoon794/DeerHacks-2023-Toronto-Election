
from bs4 import BeautifulSoup as bs
from urllib.request import urlopen, Request
from typing import List, Dict
import csv
import json
from pathlib import Path
import pymongo
import requests

from youtubesearchpython import VideosSearch
from youtube_transcript_api import YouTubeTranscriptApi


def get_youtube_video_data_from_url(url) -> list[dict[str, str, str]]:
    """
        Returns list of video data for the given url
     """

    id = url[url.index('?v=') + 3:]
    url_opener = urlopen(Request(url, headers={'User-Agent': 'Mozilla'}))
    videoInfo = bs(url_opener, features="html.parser")
    channel_title = str(videoInfo.find("link", itemprop="name"))
    publisher = channel_title[len('<link content="'):-len('" itemprop="name"/>')]
    x = {'link': url, 'network': publisher, 'transcript': get_youtube_video_transcript(id)}
    x = json.dumps(x)
    urls = 'https://localhost:3000/post?data='
    urls += x
    requests.post(urls)


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
    channels = ['cbc', 'ctv', 'cp24', 'thestar']
    candidates = ['olivia chow', 'ana bailao', 'josh matlow', 'mark saunders', 'brad bradford', 'mitzie hunter']
    myclient = pymongo.MongoClient("mongodb://localhost:27017/")
    mydb = myclient["mydatabase"]
    mycol = mydb["customers"]
    # print list of the _id values of the inserted documents:

    f = open("transcript_sample.json", "w")
    urls = ['https://www.youtube.com/watch?v=0KYQYc8MZNE','https://www.youtube.com/watch?v=RCtIHYA3Zm4',
            'https://www.youtube.com/watch?v=sE1tra0B9oE','https://www.youtube.com/watch?v=FjtzgnfIFZI',
            'https://www.youtube.com/watch?v=1cT1FQ5JBXk', 'https://www.youtube.com/watch?v=mUdB_THPJe8',
            'https://www.youtube.com/watch?v=TY4PoW0mNqE', 'https://www.youtube.com/watch?v=MQbSRmQhugo',
            'https://www.youtube.com/watch?v=0vKp8vR4v-A', 'https://www.youtube.com/watch?v=QrDuckA7d4c']
    result = []
    for url in urls:
        result.append({'link': url, 'transcript': get_youtube_video_data_from_url(url)['transcript']})
    print(result)









