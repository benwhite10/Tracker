$(document).ready(function(){
	getAllUsers();
});

function getAllUsers() {
    var data = {
        type: "GETALLUSERS"
    };
    $.ajax({
        type: "POST",
        data: data,
        url: "requests/users.php",
        dataType: "json",
        success: function(json) {
            if (json["success"]) {
                createLoginTiles(json["result"]);
            } else {
                console.log(json["message"]);
            }
        },
        error: function(json) {
            console.log(json);
        }
    });
}

function createLoginTiles(users) {
    tiles_html = "";
    for (var i = 0; i < users.length; i++) {
        tiles_html += createLoginTile(users[i]);
    }
    $("#login_tiles").html(tiles_html);
}

function createLoginTile(user) {
    var tile_html = "<div id='tile_" + user["ID"] + "' class='login_tile' onclick='clickLoginTile(\"" + user["Email"] + "\")'>";
    tile_html += "<div class='login_tile_photo'>";
    tile_html += "<img class='login_tile_photo_img' src='user_photos/" + user["ID"] + ".jpg'/>";
    tile_html += "</div>"
    tile_html += "<div class='login_tile_text'><h1>" + user["FirstName"] + " " + user["Surname"] + "</h1></div></div>";
    return tile_html;
}

function clickLoginTile(username) {
    localStorage.user = "";
    var data = {
        type: "LOGIN",
        username: username
    };
    $.ajax({
        type: "POST",
        data: data,
        url: "requests/sessions.php",
        dataType: "json",
        success: function(json) {
            if (json["success"]) {
                localStorage.user = JSON.stringify(json["result"]);
                window.location.href = "/feed.html";
            }
        },
        error: function(json) {
            console.log(json);
        }
    });
}
