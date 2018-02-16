<?php

$include_path = get_include_path();
include_once $include_path . '/includes/db_functions.php';

function getInfoFromRoute($name) {
    $file = "../../uploads/$name.gpx";
    $xml = simplexml_load_file($file);
    $xml_arr = json_decode( json_encode($xml) , 1);
    $gps_points = $xml_arr["trk"]["trkseg"]["trkpt"];

    $start_time = $gps_points[0]["time"];
    $min_lon = $gps_points[0]["@attributes"]["lon"];
    $max_lon = $gps_points[0]["@attributes"]["lon"];
    $min_lat = $gps_points[0]["@attributes"]["lat"];
    $max_lat = $gps_points[0]["@attributes"]["lat"];
    
    foreach($gps_points as $point) {
        $end_time = $point["time"];
        $min_lon = min($min_lon, $point["@attributes"]["lon"]);
        $max_lon = max($max_lon, $point["@attributes"]["lon"]);
        $min_lat = min($min_lat, $point["@attributes"]["lat"]);
        $max_lat = max($max_lat, $point["@attributes"]["lat"]);
    }

    return array(
        "StartTime" => $start_time,
        "EndTime" => $end_time,
        "MinLat" => $min_lat,
        "MaxLat" => $max_lat,
        "MinLng" => $min_lon,
        "MaxLng" => $max_lon
    );
}
