$(document).ready(function(){
	checkLoginStatus();
});

function checkLoginStatus() {
    if(localStorage.user === "") {
        window.location.replace("/login.html");
    }
    user = JSON.parse(localStorage.user);
    var data = {
        type: "CHECKSESSION",
        user: user["ID"],
        session: user["SessionID"]
    };
    $.ajax({
        type: "POST",
        data: data,
        url: "requests/sessions.php",
        dataType: "json",
        success: function(json) {
            if (json["success"] && json["result"]["ValidSession"]) {
                addNameToHeader();
            } else {
                console.log("Bad");
                localStorage.user = "";
                //window.location.replace("/login.html");
            }
        },
        error: function(json) {
            localStorage.user = "";
            console.log(json);
        }
    });
}

function addNameToHeader() {
    user = JSON.parse(localStorage.user);
    $("#header_name").html(user["FirstName"] + " " + user["Surname"]);
}
