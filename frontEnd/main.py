from flask import Flask, render_template, request, flash, redirect, url_for, jsonify
import json
import logging, sys
import requests
app = Flask(__name__)

url = "http://localhost:3000/post?data="

app.logger.addHandler(logging.StreamHandler(sys.stdout))
app.logger.setLevel(logging.INFO)

categories = {'Transit': 'protransit', 'Housing': 'prohousing', 'Crime': 'anticrime'}
people = [
    {
        'name': 'Ana Bailao',
        'last': 'bailao',
        'socials' : ['https://twitter.com/anabailaoto?s=21&t=0hUer5sbI_vXxFVCBF5Ltw',
                     'https://instagram.com/anabailaoto?igshid=YmMyMTA2M2Y=', 'https://anabailao.ca/latest-news']

    },
    {
        'name': 'Brad Bradford',
        'last': 'bradford',
        'socials' : ['https://twitter.com/bradmbradford?s=21&t=0hUer5sbI_vXxFVCBF5Ltw',
                     'https://instagram.com/bradfordgrams?igshid=YmMyMTA2M2Y=', 'https://www.votebradford.ca/priorities']
    },
    {
        'name': 'Josh Matlow',
        'last': 'matlow',
        'socials': ['https://twitter.com/joshmatlow?s=21&t=0hUer5sbI_vXxFVCBF5Ltw',
                     'https://instagram.com/joshmatlow?igshid=YmMyMTA2M2Y=', 'https://www.votematlow.ca/news']
    },
    {
        'name': 'Mark Saunders',
        'last': 'saunders',
        'socials': ['https://twitter.com/marksaunders_to?s=21&t=0hUer5sbI_vXxFVCBF5Ltw',
                     'https://instagram.com/mark_saunders_to?igshid=YmMyMTA2M2Y=', 'https://marksaundersfortoronto.ca/news']
    },
    {
        'name': 'Mitzie Hunter',
        'last': 'hunter',
        'socials': ['https://twitter.com/mitziehunter?s=21&t=0hUer5sbI_vXxFVCBF5Ltw',
                     'https://instagram.com/mppmitziehunter?igshid=YmMyMTA2M2Y=', 'https://www.mitzieformayor.ca/news']
    },
    {
        'name': 'Olivia Chow',
        'last': 'chow',
        'socials' : [' https://twitter.com/oliviachow?s=21&t=0hUer5sbI_vXxFVCBF5Ltw',
                     'https://instagram.com/oliviachow?igshid=YmMyMTA2M2Y=', 'https://www.oliviachow.ca/updates']

    }]


count  = 0
stuff = []
@app.route("/", methods=['GET', 'POST'])
def home():
    global stuff
    url = "http://localhost:3000/post?data="
    if request.method == 'POST':
        if "submit" in request.form:
            getUrl = request.form.get("give url")
            if "youtube" in getUrl.lower():
                data = {"url": getUrl}
                data = json.dumps(data)
                response = requests.post("http://localhost:5001/", json=data)
                response_data = response.json()
                if response_data == 200:
                    print("okay")


            return render_template('home.html', options=stuff[0], categories=stuff[1], politician=stuff[2],
                                   category=stuff[3], info=stuff[4])

        if "politician" in request.form and "categories" in request.form:
            temp_pep = people.copy()
            temp_cat = categories.copy()
            politician = request.form.get('politician')
            category = request.form.get('categories')
            theperson = ""
            for pep in people:
                if pep['name'] == politician:
                    theperson = pep
                    temp_pep.remove(pep)

            theCategory = categories[category]
            temp_cat.pop(category)

            data = {"action": "retrieveArticle", "candidate": theperson["last"], "sentiment": theCategory}
            json_data = json.dumps(data)
            url += json_data
            response = requests.post(url, json=json_data)
            response_data = response.json()

            make_info = []

            print(response_data)

            for respon in response_data['message']['documents']:
                if respon['sentiment'] == 'protransit':
                    make_info.append([respon['summary'][:200], round(float(respon['transitSentiment']), 2),
                                      respon['link'], respon['network']])

                if respon['sentiment'] == 'prohousing':
                    make_info.append([respon['summary'][:200], round(float(respon['housingSentiment']), 2),
                                      respon['link'], respon['network']])

                if respon['sentiment'] == 'anticrime':
                    make_info.append([respon['summary'][:200], round(float(respon['crimeSentiment']), 2),
                                      respon['link'], respon['network']])

            stuff = [temp_pep, temp_cat, theperson, category, make_info]
            return render_template('home.html', options=temp_pep, categories=temp_cat, politician=theperson,
                                   category=category, info=make_info)

        if "categories" in request.form:
            temp_cat = categories.copy()
            category = request.form.get('categories')
            theCategory = categories[category]
            temp_cat.pop(category)
            return render_template('home.html', options=people, categories=temp_cat, category=theCategory)

        if "politician" in request.form:
            temp_pep = people.copy()
            politician = request.form.get('politician')
            theperson = ""
            for pep in people:
                if pep['name'] == politician:
                    theperson = pep
                    temp_pep.remove(pep)
                    return render_template('home.html', options=temp_pep, categories=categories, politician=theperson)

        return redirect(url_for("home"))
    else:
        return render_template('home.html', options=people, categories=categories)


@app.route("/about")
def about():
    return render_template("about.html")


@app.route("/receive_data", methods=["POST"])
def recieve():
    print("here")
    data = request.get_json()
    print(data)
    return redirect(url_for("home"))


if __name__ == "__main__":
    app.run(debug=True, port=5000)

