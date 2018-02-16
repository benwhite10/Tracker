<?php

$include_path = get_include_path();
include_once $include_path . '/includes/db_functions.php';
include_once $include_path . '/includes/gpsdata.php';

$user_id = filter_input(INPUT_POST,'userid',FILTER_SANITIZE_NUMBER_INT);

validateFile(basename($_FILES["gps"]["name"]), $_FILES["gps"]["size"]);
// Create name
$route_name = createNewRouteName();
$target_file = "../../uploads/" . $route_name . ".gpx";
checkFileDoesntExistAndSave($target_file);
$info = getInfoFromRoute($route_name);
$activity_id = addRouteToDB($info, $route_name, $user_id);
succeedRequest(array(
    "ActivityID" => $activity_id
));

function validateFile($name, $size) {
    // Check file size
    if ($size > 99999999) {
        failRequest("Sorry, your file is too large.");
    }
    // Allow certain file formats
    if(strtolower(pathinfo($name,PATHINFO_EXTENSION)) != "gpx") {
        failRequest("Sorry, only .gpx files are allowed.");
    }
}

function checkFileDoesntExistAndSave($target_file) {
    // Check if file already exists
    if (file_exists($target_file)) {
        failRequest("There was an error saving your file.");
    }
    if (!move_uploaded_file($_FILES["gps"]["tmp_name"], $target_file)) {
        failRequest("There was an error saving your file.");
    }
}

function addRouteToDB($info, $route_name, $user_id) {
    $start_text = $info["StartTime"];
    $start_time = strtotime($info["StartTime"]);
    $end_time = strtotime($info["EndTime"]);
    $day = date("l", $start_time);
    $time = getTimeOfDayString($start_time);
    $name = $day . " " . $time . " Football";
    $start_time_db = date("Y-m-d H:i:s", $start_time);
    $end_time_db = date("Y-m-d H:i:s", $end_time);
    $min_lat = $info["MinLat"];
    $max_lat = $info["MaxLat"];
    $min_lng = $info["MinLng"];
    $max_lng = $info["MaxLng"];

    db_begin_transaction();
    $insert_route = "INSERT INTO `TGPSROUTES`(`Name`, `StartTime`, `EndTime`, `Lat1`, `Lng1`, `Lat2`, `Lng2`)
                    VALUES ('$route_name','$start_time_db','$end_time_db',$min_lat,$min_lng,$max_lat,$max_lng)";
    try {
        $result = db_insert_query_exception($insert_route);
        $route_id = $result[1];
    } catch (Exception $ex) {
        db_rollback_transaction();
        failRequest("There was an error creating your route.");
    }

    // Create activity
    $insert_activity = "INSERT INTO `TACTIVITY`(`UserID`, `RouteID`, `Name`, `Date`, `Distance`, `Deleted`, `DateAdded`)
                        VALUES ($user_id,$route_id,'$name','$start_time_db',0,0,NOW())";
    try {
        $result = db_insert_query_exception($insert_activity);
        $activity_id = $result[1];
    } catch (Exception $ex) {
        db_rollback_transaction();
        failRequest("There was an error creating your activity. " . $ex->getMessage());
    }
    db_commit_transaction();
    return $activity_id;
}

function createNewRouteName() {
    while(true) {
        $string = generateRandomString(10);
        $query = "SELECT * FROM `TGPSROUTES` WHERE `Name` = '$string'";
        try {
            $result = db_select_exception($query);
            if (count($result) === 0) return $string;
        } catch (Exception $ex) {
            return false;
        }
    }
}

function generateRandomString($length) {
    return substr(str_shuffle(str_repeat($x='0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', ceil($length/strlen($x)) )),1,$length);
}

function getTimeOfDayString($timestamp) {
    $hour = intval(date("G", $timestamp));
    if ($hour > 4 && $hour < 13) {
        return "Morning";
    } else if ($hour > 12 && $hour < 18) {
        return "Afternoon";
    } else if ($hour > 17 && $hour < 21) {
        return "Evening";
    } else {
        return "Night";
    }
}
?>
