var heatmapInstance;
var points;

$(document).ready(function(){
	getGPSData();
});

function getGPSData() {
    $.ajax({
        type: "POST",
        data: null,
        url: "requests/getGPS.php",
        dataType: "json",
        success: function(json) {
            for (i in json) {
				$("#gps_select").append($('<option>',{text : json[i]}));
			}
			$("#gps_select").select(0);
			createMap();
        },
        error: function(json) {
            console.log(json);
        }
    });
}

function createMap() {
	var val = $("#gps_select").val();
	$.get("uploads/" + val, function(data) {
		storeData(data);
		clearMaps();
		convertTrackingToCoordinates();
		initMap();
	});
}

function clearMaps() {
	$("#heatmap").html("");
	$("#map").html("");
}

function storeData(data) {
	var json_object = xmlToJson(data);
	var tracking = json_object["gpx"]["trk"]["trkseg"]["trkpt"];
	localStorage.setItem("original_tracking_data", JSON.stringify(tracking));
}

function getMaxAndMin(tracking) {
	var min_lon = tracking[0]["@attributes"]["lon"];
	var max_lon = tracking[0]["@attributes"]["lon"];
	var min_lat = tracking[0]["@attributes"]["lat"];
	var max_lat = tracking[0]["@attributes"]["lat"];

	for (var i = 0; i < tracking.length; i++) {
		var point = tracking[i];
		var lon = point["@attributes"]["lon"];
		var lat = point["@attributes"]["lat"];
		min_lon = Math.min(lon, min_lon);
		max_lon = Math.max(lon, max_lon);
		min_lat = Math.min(lat, min_lat);
		max_lat = Math.max(lat, max_lat);
	}

	var x_dist = getDistanceBetweenGPS(min_lon, min_lat, max_lon, min_lat);
	var y_dist = getDistanceBetweenGPS(min_lon, min_lat, min_lon, max_lat);

	return [min_lon, max_lon, min_lat, max_lat, x_dist, y_dist];
}

function convertTrackingToCoordinates() {
	var tracking = JSON.parse(localStorage.getItem("original_tracking_data"));
	var max_mins = getMaxAndMin(tracking);

	var min_lon = max_mins[0];
	var max_lon = max_mins[1];
	var min_lat = max_mins[2];
	var max_lat = max_mins[3];

	var coordinates = [];

	for (var i = 0; i < tracking.length; i++) {
		var point = tracking[i];
		var lon = point["@attributes"]["lon"];
		var lat = point["@attributes"]["lat"];
		var date = new Date(point["time"]["#text"]);
		var time = date.getTime() / 1000;
		var x = getDistanceBetweenGPS(min_lon, min_lat, lon, min_lat);
		var y = getDistanceBetweenGPS(min_lon, min_lat, min_lon, lat);
		coordinates.push({x: x, y: y, time: time});
	}

	var max_x = getDistanceBetweenGPS(min_lon, min_lat, max_lon, min_lat);
	var max_y = getDistanceBetweenGPS(min_lon, min_lat, min_lon, max_lat);

	var xy_tracking_data = {
		coordinates: coordinates,
		max_vals: {x: max_x, y: max_y}
	};

	localStorage.setItem("xy_tracking_data", JSON.stringify(xy_tracking_data));
	createHeatmap();
	getStats();
}

function getStats() {
	var xy_tracking_data = JSON.parse(localStorage.getItem("xy_tracking_data"));
	var xy_points = xy_tracking_data["coordinates"];
	var length = xy_points.length;
	var quickest_dist_1 = 50;
	var quickest_dist_2 = 250;
	var quickest_dist_3 = 500;

	// Total time
	var t1 = xy_points[0].time;
	var t2 = xy_points[length - 1].time;
	var total_time = t2 - t1;
	var half_time = (t1 + t2) / 2;

	// Total distance
	var total_distance = 0;
	var first_half_distance = 0;
	var second_half_distance = 0;
	var max_speed = 0;
	var start_time = xy_points[0].time;

	for (var i = 0; i < xy_points.length - 1; i++) {
		x1 = xy_points[i].x;
		x2 = xy_points[i + 1].x;
		y1 = xy_points[i].y;
		y2 = xy_points[i + 1].y;
		t1 = xy_points[i].time;
		t2 = xy_points[i + 1].time;
		dist = Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1));
		speed = dist / (t2 - t1);
		max_speed = Math.max(max_speed, speed);
		total_distance += dist;
		if (t2 < half_time) {
			first_half_distance += dist;
		} else {
			second_half_distance += dist;
		}
	}

	var skew = Math.round(100 * (second_half_distance - first_half_distance) / total_distance);

	quickest_time_1 = 999999999;
	quickest_time_2 = 999999999;
	quickest_time_3 = 999999999;
	for (var i = 0; i < xy_points.length; i++) {
		start_time = xy_points[i].time;
		total_dist = 0;
		quick_1 = true;
		quick_2 = true;
		quick_3 = true;
		for (var j = i; j < xy_points.length - 1; j++) {
			x1 = xy_points[j].x;
			x2 = xy_points[j + 1].x;
			y1 = xy_points[j].y;
			y2 = xy_points[j + 1].y;
			t1 = xy_points[j].time;
			t2 = xy_points[j + 1].time;
			dist = Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1));
			total_dist += dist;
			if (quick_1 && total_dist >= quickest_dist_1) {
				quickest_time_1 = Math.min(quickest_time_1, t2 - start_time);
				quick_1 = false;
			}
			if (quick_2 && total_dist >= quickest_dist_2) {
				quickest_time_2 = Math.min(quickest_time_2, t2 - start_time);
				quick_2= false;
			}
			if (quick_3 && total_dist >= quickest_dist_3) {
				quickest_time_3 = Math.min(quickest_time_3, t2 - start_time);
				quick_3 = false;
			}
			if (!quick_1 && !quick_2 && !quick_3) break;
		}
	}

	$("#stats_table").html("<div class='stats_table_row title'>Stats</div>");
	$("#stats_table").append(parseStatsRow("Time", convertTimeToString(total_time)));
	$("#stats_table").append(parseStatsRow("Total Distance", round(total_distance/1000, 1) + " km"));
	$("#stats_table").append(parseStatsRow("First Half", round(first_half_distance/1000, 1) + " km"));
	$("#stats_table").append(parseStatsRow("Second Half", round(second_half_distance/1000, 1) + " km"));
	$("#stats_table").append(parseStatsRow("Skew", skew + "%"));
	$("#stats_table").append(parseStatsRow("Max Speed", round(max_speed, 1) + " m/s"));
	$("#stats_table").append(parseStatsRow("Quickest 50 m", convertTimeToString(quickest_time_1)));
	$("#stats_table").append(parseStatsRow("Quickest 250 m", convertTimeToString(quickest_time_2)));
	$("#stats_table").append(parseStatsRow("Quickest 500 m", convertTimeToString(quickest_time_3)));
}

function convertTimeToString(time) {
	if (time < 60) {
		return time + " s";
	} else if (time < 3600) {
		mins = Math.floor(time/60);
		secs = round(time - (mins * 60), 0);
		return mins + " m " + secs + " s";
	} else {
		hours = Math.floor(time/3600);
		mins = Math.floor(60 * (Math.floor(time/3600) - hours));
		secs = round(time - (mins * 60), 0);
		return hours + " h " + mins + " m " + secs + " s";
	}
}
function parseStatsRow(heading, detail) {
	var html_string = "<div class='stats_table_row'>";
	html_string += "<div class='stats_table_row_heading'>" + heading + "</div>";
	html_string += "<div class='stats_table_row_detail'>" + detail + "</div>";
	html_string += "</div>";
	return html_string;
}

function round(val, dp) {
	pow = Math.pow(10, dp);
	return  Math.round(pow * parseFloat(val)) / pow;
}

function createHeatmap() {
	var xy_tracking_data = JSON.parse(localStorage.getItem("xy_tracking_data"));
	var coordinates = xy_tracking_data.coordinates;
	var max_x = xy_tracking_data.max_vals.x;
	var max_y = xy_tracking_data.max_vals.y;
	var radius = 30;
	var blur = 0.60;
	var min = 0;
	var max = 20;
	var height = 500;
	var width = height * max_x / max_y;
	var x_scale = width / max_x;
	var y_scale = height / max_y;
	var time_scale = 0.5;

	$("#blur_input").val(blur * 100);
	$("#radius_input").val(radius);
	$("#max_input").val(max);
	$("#max_input").val(max);

	$("#heatmap").css("height", height + "px");
	$("#heatmap").css("width", width + "px");
	var margin = "0 calc(50% - " + (width / 2) + "px)";
	$("#heatmap").css("margin", margin);

	var config = createConfig();
	// minimal heatmap instance configuration
	heatmapInstance = h337.create(config);

	// Turn coordinates into points
	points = [];

	for (var i = 0; i < coordinates.length - 1; i++) {
		x1 = coordinates[i].x;
		y1 = coordinates[i].y;
		x2 = coordinates[i + 1].x;
		y2 = coordinates[i + 1].y;
		t1 = coordinates[i].time;
		t2 = coordinates[i + 1].time;
		var time = 0;
		var gap = t2 - t1;
		var segments = gap / time_scale;
		for (var j = 0; j < segments; j++) {
			x = x1 + (x2 - x1) * time / gap;
			y = y1 + (y2 - y1) * time / gap;
			time += time_scale;
			points.push({
				x: x * x_scale,
				y: height - (y * y_scale),
				val: 1
			})
		}

	}

	heatmapInstance.setData(creataData(points));
	updateInputs();
}

function updateHeatmapSettings() {
	var config = createConfig();
	$("#heatmap").html("");
	heatmapInstance = h337.create(config);
	heatmapInstance.setData(creataData(points));
}

function setCanvas() {
	var position = $("#heatmap_container").position();
	$("#heatmap_overlay_div").css("top", position.top);
	$("#heatmap_overlay_div").css("left",position.left);
	$("#heatmap_overlay_div").css("width",$("#heatmap_container").width());
	$("#heatmap_overlay_div").css("height",$("#heatmap_container").height());
}

function updatePitch() {
	var c = document.getElementById("heatmap_overlay");
	var ctx=c.getContext("2d");
	c.width = $("#heatmap_overlay_div").width();
	c.height = $("#heatmap_overlay_div").height();
	var margin_left = parseFloat($("#heatmap").css("margin-left"));

	var xy_tracking_data = JSON.parse(localStorage.getItem("xy_tracking_data"));
	var pitch_coords = JSON.parse(localStorage.getItem("pitch_coords"));
	var max_x = xy_tracking_data.max_vals.x;
	var max_y = xy_tracking_data.max_vals.y;

	var tracking = JSON.parse(localStorage.getItem("original_tracking_data"));
	var max_mins = getMaxAndMin(tracking);

	var min_lon = max_mins[0];
	var max_lon = max_mins[1];
	var min_lat = max_mins[2];
	var max_lat = max_mins[3];

	var height = 500;
	var width = height * max_x / max_y;
	var x_scale = width / max_x;
	var y_scale = height / max_y;

	for (var i = 0; i < pitch_coords.length; i++) {
		pitch_1 = pitch_coords[i];
		pitch_2 = i === pitch_coords.length - 1 ? pitch_coords[0] : pitch_coords[i+1];
		var x_1 = margin_left + x_scale * getDistanceBetweenGPS(min_lon, min_lat, pitch_1.lng, min_lat);
		var x_2 = margin_left + x_scale * getDistanceBetweenGPS(min_lon, min_lat, pitch_2.lng, min_lat);
		var y_1 = height - y_scale * getDistanceBetweenGPS(min_lon, min_lat, min_lon, pitch_1.lat);
		var y_2 = height - y_scale * getDistanceBetweenGPS(min_lon, min_lat, min_lon, pitch_2.lat);
		ctx.moveTo(x_1,y_1);
		ctx.lineTo(x_2,y_2);
		ctx.stroke();
	}
}

function createConfig() {
	return {
		container: document.getElementById('heatmap'),
		radius: $("#radius_input").val(),
		maxOpacity: .9,
		minOpacity: 0,
		blur: $("#blur_input").val() / 100
	};
}

function creataData(points) {
	return {
		min: $("#min_input").val(),
		max: $("#max_input").val(),
	  	data: points
	};
}

function getLocationOfPoint(coord, gap, max) {
	if (coord < 0 || coord > max) return false;
	if (coord === max) return Math.floor(coord/gap) - 1;
	return Math.floor(coord/gap);
}

function getDistanceBetweenGPS(lon1, lat1, lon2, lat2) {
	var R = 6371e3; // metres
	var latr1 = deg2rad(lat1);
	var latr2 = deg2rad(lat2);
	var dlatr = deg2rad(lat2-lat1);
	var dlonr = deg2rad(lon2-lon1);

	var a = Math.sin(dlatr/2) * Math.sin(dlatr/2) +
			Math.cos(latr1) * Math.cos(latr2) *
			Math.sin(dlonr/2) * Math.sin(dlonr/2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

	return R * c;
}

function getPercentage(val, min, max) {
	return (val - min) / (max - min);
}

function getCoordinate(perc, min, max) {
	return min + perc * (max - min);
}

function deg2rad(deg) {
    return (deg * Math.PI / 180.0);
}

function initMap() {

	var tracking = JSON.parse(localStorage.getItem("original_tracking_data"));
	var coordinates = [];
	for (var i = 0; i < tracking.length; i++) {
		var point = tracking[i];
		coordinates.push({lat: parseFloat(point["@attributes"]["lat"]), lng: parseFloat(point["@attributes"]["lon"])})
	}

	var max_mins = getMaxAndMin(tracking);
	var lon_cen = (max_mins[0] + max_mins[1]) / 2;
	var lat_cen = (max_mins[2] + max_mins[3]) / 2;

	var map = new google.maps.Map(document.getElementById('map'), {
		zoom: 19,
		center: {lat: lat_cen, lng: lon_cen},
		mapTypeId: 'satellite'
	});

	var flightPath = new google.maps.Polyline({
		path: coordinates,
		geodesic: true,
		strokeColor: '#FF0000',
		strokeOpacity: 1.0,
		strokeWeight: 2
	});

	flightPath.setMap(map);

	var pitchCoords = [
          {lat: parseFloat(max_mins[2]), lng: parseFloat(max_mins[0])},
          {lat: parseFloat(max_mins[2]), lng: parseFloat(max_mins[1])},
          {lat: parseFloat(max_mins[3]), lng: parseFloat(max_mins[1])},
          {lat: parseFloat(max_mins[3]), lng: parseFloat(max_mins[0])}
        ];

	localStorage.setItem("pitch_coords", JSON.stringify(pitchCoords));

    // Construct the polygon.
    var pitchPath = new google.maps.Polygon({
          paths: pitchCoords,
          strokeColor: '#00FF00',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#00FF00',
          fillOpacity: 0.35,
		  editable: true
    });
    pitchPath.setMap(map);

	pitchPath.getPaths().forEach(function(path, index){
		google.maps.event.addListener(path, 'set_at', function(){
			var paths = path.b;
			var pitch_coords = [];
			for (var i = 0; i < paths.length; i++) {
				var point = paths[i];
				pitch_coords.push({
					lat: point.lat(),
					lng: point.lng()
				})
			}
			localStorage.setItem("pitch_coords", JSON.stringify(pitch_coords));
			updatePitch();
		});
	});

	setCanvas();
	updatePitch();
}

// Changes XML to JSON
function xmlToJson(xml) {

	// Create the return object
	var obj = {};

	if (xml.nodeType == 1) { // element
		// do attributes
		if (xml.attributes.length > 0) {
		obj["@attributes"] = {};
			for (var j = 0; j < xml.attributes.length; j++) {
				var attribute = xml.attributes.item(j);
				obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
			}
		}
	} else if (xml.nodeType == 3) { // text
		obj = xml.nodeValue;
	}

	// do children
	if (xml.hasChildNodes()) {
		for(var i = 0; i < xml.childNodes.length; i++) {
			var item = xml.childNodes.item(i);
			var nodeName = item.nodeName;
			if (typeof(obj[nodeName]) == "undefined") {
				obj[nodeName] = xmlToJson(item);
			} else {
				if (typeof(obj[nodeName].push) == "undefined") {
					var old = obj[nodeName];
					obj[nodeName] = [];
					obj[nodeName].push(old);
				}
				obj[nodeName].push(xmlToJson(item));
			}
		}
	}
	return obj;
};

function updateInputs() {
	$("#min_input_label").html("Min (" + $("#min_input").val() + ")");
	$("#max_input_label").html("Max (" + $("#max_input").val() + ")");
	$("#radius_input_label").html("Radius (" + $("#radius_input").val() + ")");
	$("#blur_input_label").html("Blur (" + ($("#blur_input").val() / 100) + ")");
	updateHeatmapSettings();
}

function addNewGPX() {
	$("#upload_button").addClass("hidden");
	$("#gps_select").addClass("hidden");
	$("#upload_form").removeClass("hidden");
}
