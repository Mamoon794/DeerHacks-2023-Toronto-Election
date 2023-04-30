from flask import Flask, render_template, request, flash, redirect, url_for, jsonify
import json
import logging, sys
import requests
app = Flask(__name__)

url = "http://localhost:3000/post?data="

app.logger.addHandler(logging.StreamHandler(sys.stdout))
app.logger.setLevel(logging.INFO)

categories = ['protransit', 'prohousing', 'anticrime']
people = [{
    'name': 'Mark saunders',
    'last': 'saunders',
    },
    {
        'name': 'Olivia Chow',
        'last': 'chow',

    },
    {
        'name': 'Ana Bailao',
        'last': 'bailao',

    },
    {
        'name':'Josh Matlow',
        'last': 'matlow',
    },
    {
        'name': 'Brad Bradford',
        'last': 'bradford',
    },
    {
        'name': 'Mitzie Hunter',
        'last': 'hunter',
    }]


count  = 0
@app.route("/", methods=['GET', 'POST'])
def home():
    url = "http://localhost:3000/post?data="
    if request.method == 'POST':
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

            for cat in categories:
                if cat == category:
                    temp_cat.remove(cat)

            # return theperson[f'{category}']
            data = {"action": "retrieveArticle", "candidate": theperson["last"], "sentiment": category}
            json_data = json.dumps(data)
            url += json_data
            response = requests.post(url, json=json_data)
            response_data = response.json()
            print(response_data)

            make_info = []

            for respon in response_data['message']['documents']:
                if respon['sentiment'] == 'protransit':
                    make_info.append([respon['summary'], round(float(respon['transitSentiment']), 2),
                                      respon['link'], respon['network']])

                if respon['sentiment'] == 'prohousing':
                    make_info.append([respon['summary'], round(float(respon['housingSentiment']), 2),
                                      respon['link'], respon['network']])

                if respon['sentiment'] == 'anticrime':
                    make_info.append([respon['summary'], round(float(respon['crimeSentiment']), 2),
                                      respon['link'], respon['network']])




            return render_template('home.html', options=temp_pep, categories=temp_cat, politician=theperson,
                                   category=category, info=make_info)

        if "categories" in request.form:
            temp_cat = categories.copy()
            category = request.form.get('categories')
            for cat in categories:
                if cat == category:
                    temp_cat.remove(cat)
                    return render_template('home.html', options=people, categories=temp_cat, category=category)

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

