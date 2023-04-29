from flask import Flask, render_template, request, flash, redirect, url_for, jsonify
import json
import requests
app = Flask(__name__)

url = "http://localhost:3000/post?"

categories = ['tax', 'transit', 'therapy', 'drug', 'water', 'fire']
people = [{
    'name': 'Mark saunders',
    },
    {
        'name': 'Olivia Chow',
        'categories': ['tax', 'transit']

    },
    {
        'name': 'Ana Bailao',
        'categories': ['drug therapy', 'tax']

    },
    {
        'name':'Josh Matlow',
        'categories': ['transit', 'water']
    },
    {
        'name': 'Brad Bradford',
        'categories': ['water', 'fire']
    },
    {
        'name': 'Mitzie Hunter',
        'categories': ['fire', 'police', 'military'],
        "fire": [
            ["this is a pretty long heading that is going to be used for the main program"
                 " which has not been properly made yet", "0.3", "CBC news"],
            ["this is another pretty long heading that is going to be used for the main program"
                 " which has not been properly made yet", "0.9", "CBC news"]
                 ]
    }]


@app.route("/", methods=['GET', 'POST'])
def home():
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
            data = {'action': 'retrieveArticle', 'candidate': theperson['name'], 'topic': category}
            json_data = json.dumps(data)

            requests.post(url, json=json_data)
            return render_template('home.html', options=temp_pep, categories=temp_cat, politician=theperson,
                                   category=category, info=theperson[category])

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

if __name__ == "__main__":
    app.run(debug=True, port=5000)

