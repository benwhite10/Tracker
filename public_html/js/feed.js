$(document).ready(function(){
	checkLoginStatus();
});

function setUpFeed() {
    addNameToHeader();
	setUpUploadButton();
	requestActivity();
}

function setUpUploadButton() {
	$("#file_select").change(function () {
		path = $("#file_select").val();
		split = path.split("\\");
		name = split[split.length - 1];
	   $("#file_display").html(name);
	});

	$("#file_display").click(function() {
		$("#file_select").click();
	})

	$("#submit_button").click(function() {
		var formData = new FormData(document.getElementById("upload_form"));
		user = JSON.parse(localStorage.user);
		formData.append("userid", user["ID"]);

		$.ajax({
			type: "POST",
			url: "requests/upload.php",
			data: formData,
			contentType: false,
			cache: false,
			processData: false,
	        success: function(data) {
				uploadSuccess(JSON.parse(data));
	        },
	        error: function(data) {
				console.log("Failure");
				console.log(json);
	        }
		});
	});
}

function uploadSuccess(json) {
	if (json["success"]) {
		$("#file_select").val("");
		$("#file_display").html("Click here to upload file...");
		requestActivity();
	} else {
		console.log(json["message"]);
	}
}

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
				setUpFeed();
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

function requestActivity() {
	user = JSON.parse(localStorage.user);
	var data = {
        type: "GETACTIVITY",
        userid: user["ID"],
        session: user["SessionID"]
    };
    $.ajax({
        type: "POST",
        data: data,
        url: "requests/activity.php",
        dataType: "json",
        success: function(json) {
            requestActivitySuccess(json);
        },
        error: function(json) {
            console.log(json);
        }
    });
}

function requestActivitySuccess(json) {
	if (json["success"]) {
		parseActivities(json["result"]);
	} else {
		console.log("There was an error retrieving your activity.");
		console.log(json["message"]);
	}
}

function parseActivities(activities) {
	activities_html = "";
	for (i = 0; i < activities.length; i++) {
		activity = activities[i];
		activities_html += activityHTML(activity);
	}
	$("#activity_feed_container").html(activities_html);
}

function activityHTML(activity) {
	date = moment(activity["Date"]);
	date_string = date.format("DD/MM/YY");
	html = "<div class='activity'>";
	html += "<div class='activity_top_container'>";
	html += "<div class='activity_title'>" + activity["Name"] + "</div>";
	html += "<div class='activity_date'>" + date_string + "</div>";
	html += "</div>";
	html += "<div class='activity_main'></div>";
	html += "</div>";
	return html;
}

function addNameToHeader() {
    user = JSON.parse(localStorage.user);
    $("#header_name").html(user["FirstName"] + " " + user["Surname"]);
}

function clickName() {
	window.location.href = "/login.html";
}

function clickAddGPS() {
	display = $("#add_gps_container").css("display");
	$("#add_gps_container").css("display", display === "block" ? "none" : "block");
}
