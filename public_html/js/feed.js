$(document).ready(function(){
	checkLoginStatus();
});

function setUpUploadButton() {
	$("#upload_form").submit(function(event) {
		event.preventDefault();
		$("#upload_button").html('Uploading...');

		user = JSON.parse(localStorage.user);

		var formData = new FormData(this);
		formData.append("userid", user["ID"]);

		$.ajax({
			type: "POST",
			url: "requests/upload.php",
			data: formData,
			contentType: false,
			cache: false,
			processData: false,
	        success: function(data) {
				console.log(data);
				$("#file_select").val("");
	        },
	        error: function(data) {
				console.log("Failure");
				console.log(data);
	        }
		});
	});
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
                addNameToHeader();
				setUpUploadButton();
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
