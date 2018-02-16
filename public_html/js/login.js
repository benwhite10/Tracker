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
	for (var i = 0; i < users.length; i++) {
		setFontSize(users[i]["ID"]);
	}
}

function createLoginTile(user) {
    var tile_html = "<div id='tile_" + user["ID"] + "' class='login_tile' onclick='clickLoginTile(\"" + user["Email"] + "\")'>";
	tile_html += "<input type='hidden' class='login_user' value='" + user["ID"] + "'>";
    tile_html += "<div class='login_tile_photo'>";
    tile_html += "<img class='login_tile_photo_img' src='user_photos/" + user["ID"] + ".jpg'/>";
    tile_html += "</div>"
    tile_html += "<div class='login_tile_text' id='login_tile_" + user["ID"] + "'><span id='login_tile_text_" + user["ID"] + "'>" + user["FirstName"] + " " + user["Surname"] + "</span></div></div>";
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

function setFontSize(id) {
	var div_width = $("#login_tile_" + id).width();
	var font_size = 40;
	$("#login_tile_text_" + id).css("font-size", font_size + "px");
	while ($("#login_tile_text_" + id).width() > div_width - 10) {
		font_size = font_size - 2;
		$("#login_tile_text_" + id).css("font-size", font_size + "px");
	}
}

window.onresize = function(event) {
	var user_divs = document.getElementsByClassName("login_user");
	for (var i = 0; i < user_divs.length; i++) {
		user_id = user_divs[i].value;
		setFontSize(user_id);
	}
};
