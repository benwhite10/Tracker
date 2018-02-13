<?php

$include_path = get_include_path();
include_once $include_path . '/includes/db_functions.php';
include_once $include_path . '/includes/session_functions.php';

$request_type = filter_input(INPUT_POST,'type',FILTER_SANITIZE_STRING);

//$userid = filter_input(INPUT_POST,'userid',FILTER_SANITIZE_NUMBER_INT);
//$userval = base64_decode(filter_input(INPUT_POST,'userval',FILTER_SANITIZE_STRING));

/*$role = validateRequest($userid, $userval, $external);
if(!$role){
    failRequest("There was a problem validating your request");
}*/

switch ($request_type){
    case "GETALLUSERS":
        getAllUsers();
        break;
    default:
        failRequest("Invalid request type.");
        break;
}

function getAllUsers() {
    $query = "SELECT * FROM `TUSERS` WHERE `Deleted` = 0";
    try {
        $users = db_select_exception($query);
        succeedRequest($users);
    } catch (Exception $ex) {
        failRequest($ex->getMessage());
    }
}
