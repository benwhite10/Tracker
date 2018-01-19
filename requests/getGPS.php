<?php

//$include_path = get_include_path();
//include_once $include_path . '/includes/db_functions.php';

$dir    = "../uploads";
$files = array_diff(scandir($dir), array('.', '..'));
echo json_encode($files);
exit();
//echo "Hello";
/*
$response = array(
        "success" => TRUE,
        "staff" => $staff);
echo json_encode($response);

function failRequest($message){
    errorLog("There was an error in the get staff request: " . $message);
    $response = array(
        "success" => FALSE);
    echo json_encode($response);
    exit();
}*/
