let url = "http://localhost:3000/post";

function newArticle() {
    $.post(url+'?data='+JSON.stringify({
        'action': 'newArticle',
        'link': document.getElementById("articleLink").value
    }), response)
    console.log("Sent article!");
}

function retriveArticle() {
    $.post(url+'?data='+JSON.stringify({
        'action': 'retrieveArticle',
        'candidate': document.getElementById("candidate").value,
        'topic': document.getElementById("topic").value
    }), response)
    console.log("Sent article!");
}

function response(data, status) {
    var response = JSON.parse(data);
    console.log(data);
    // if (response['action'] == 'generateNumber') {
    //     userName = response['nameId'];
    //     console.log(userName);
    // }
    // else if (response['action'] == 'guess') {
    //     if (response['result']) {
    //         correctGuess();
    //     }
    //     else {
    //         wrongGuess(response['difference'], response['number']);
    //     }
    // }
}

