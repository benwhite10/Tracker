<?php

$include_path = get_include_path();
include_once $include_path . '/includes/db_functions.php';
include_once $include_path . '/includes/session_functions.php';

$user_id = filter_input(INPUT_POST,'userid',FILTER_SANITIZE_NUMBER_INT);

$target_dir = "../uploads/";
$target_file = $target_dir . basename($_FILES["gps"]["name"]);

validateFile(basename($_FILES["gps"]["name"]), $_FILES["gps"]["size"]);
// Create name
$route_name = createNewRouteName();
$target_file = "../uploads/" . $route_name . ".gpx";
checkFileDoesntExist($target_file);
$info = getInfoFromRoute();
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

function checkFileDoesntExist($target_file) {
    // Check if file already exists
    if (file_exists($target_file)) {
        failRequest("There was an error saving your file.");
    }
    if (!move_uploaded_file($_FILES["gps"]["tmp_name"], $target_file)) {
        failRequest("There was an error saving your file.");
    }
}

function getInfoFromRoute() {
    return array();
}

function addRouteToDB($info, $route_name, $user_id) {
    db_begin_transaction();
    $insert_route = "INSERT INTO `TGPSROUTES`(`Name`, `StartTime`, `EndTime`, `Lat1`, `Lng1`, `Lat2`, `Lng2`)
                    VALUES ('$route_name',NOW(),NOW(),0,0,0,0)";
    try {
        $result = db_insert_query_exception($insert_route);
        $route_id = $result[1];
    } catch (Exception $ex) {
        db_rollback_transaction();
        failRequest("There was an error creating your route.");
    }

    // Create activity
    $insert_activity = "INSERT INTO `TACTIVITY`(`UserID`, `RouteID`, `Name`, `Date`, `Distance`, `Deleted`, `DateAdded`)
                        VALUES ($user_id,$route_id,'Test Name',NOW(),0,0,NOW())";
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
?>
