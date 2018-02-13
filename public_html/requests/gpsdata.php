<?php

$include_path = get_include_path();
include_once $include_path . '/includes/db_functions.php';
include_once $include_path . '/includes/session_functions.php';

$query = "SELECT * FROM `TUSERS`;";

try{
    $result = db_select_exception($query);
    print_r($result);
} catch (Exception $ex) {
    print_r($ex);
}
