<?php

$include_path = get_include_path();
include_once $include_path . '/includes/db_functions.php';

$request_type = filter_input(INPUT_POST,'type',FILTER_SANITIZE_STRING);
$user_id = filter_input(INPUT_POST,'userid',FILTER_SANITIZE_NUMBER_INT);

switch ($request_type){
    case "GETACTIVITY":
        getActivityForUser($user_id);
        break;
    default:
        failRequest("Invalid request type.");
        break;
}

function getActivityForUser($user_id) {
    $query = "SELECT * FROM `tactivity`
            WHERE `UserID` = $user_id
            AND `Deleted` = 0
            ORDER BY `Date` DESC";
    try {
        $activity = db_select_exception($query);
    } catch (Exception $ex) {
        failRequest($ex->getMessage());
    }
    succeedRequest($activity);
}
