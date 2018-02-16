<?php

$include_path = get_include_path();
include_once $include_path . '/includes/db_functions.php';
//include_once $include_path . '/includes/session_functions.php';

$request_type = filter_input(INPUT_POST,'type',FILTER_SANITIZE_STRING);
$user_id = filter_input(INPUT_POST,'user',FILTER_SANITIZE_NUMBER_INT);
$username = filter_input(INPUT_POST,'username',FILTER_SANITIZE_STRING);
$session_id = filter_input(INPUT_POST,'session',FILTER_SANITIZE_STRING);

switch($request_type) {
    case "LOGIN":
        loginUser($username);
        break;
    case "CHECKSESSION":
        checkSession($user_id, $session_id);
        break;
    default:
        failRequest("Invalid request type.");
        break;
}

function loginUser($username) {
    // Validate login
    $query = "SELECT `ID`, `FirstName`, `Surname`, `Email` FROM `TUSERS` WHERE `Email` = '$username'";
    try {
        $result = db_select_exception($query);
        if (count($result) > 0) {
            $user = $result[0];
        } else {
            failRequest("Unable to login: No user found with that username.");
        }
    } catch (Exception $ex) {
        failRequest("Unable to login");
    }

    //$session_id = createUserSession($user_id);
    $session_id = createNewSessionID();
    $user["SessionID"] = $session_id;
    succeedRequest($user);
}

function createUserSession($user_id) {
    $session_id = createNewSessionID();
    $query = "INSERT INTO `TSESSIONS`(SessionID`, `UserID`, `TimeStarted`, `LastActive`, `Active`)
                VALUES ('$session_id',$user_id,NOW(),NOW(),1)";
    try {
        $result = db_insert_query_exception($query);
        return $session_id;
    } catch (Exception $ex) {
        failRequest("Unable to create secure session: " . $ex->getMessage());
    }
}

function createNewSessionID() {
    while(true) {
        $string = generateRandomString(20);
        $query = "SELECT * FROM `TSESSIONS` WHERE `SessionID` = '$string'";
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

function checkSession($user_id, $session_id) {
    $valid_session = checkUserLoginStatus($user_id, $session_id);
    succeedRequest(array(
        "ValidSession" => $valid_session
    ));
}

function checkUserLoginStatus($user_id, $session_id) {

    if (is_null($session_id) || $session_id === "") return false;
    return true;
    /*
    $query = "SELECT * FROM `TSESSIONS` WHERE `SessionID` = '$session_id' AND `UserID` = $user_id;";
    try {
        $result = db_select_exception($query);
    } catch (Exception $ex) {
        return false;
    }
    // Check if session exists

    // Check last activity is within the last hour

    // If invaluid then update the old session and create a new session

    // If valid then update the session info

    return false;*/
}
