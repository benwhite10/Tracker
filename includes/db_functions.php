<?php

include_once ('db_connect.php');

function db_begin_transaction(){
   $mysql = db_connect();
   mysqli_query($mysql, "START TRANSACTION");
}

function db_commit_transaction(){
    $mysql = db_connect();
    mysqli_query($mysql, "COMMIT");
}

function db_rollback_transaction(){
    $mysql = db_connect();
    mysqli_query($mysql, "ROLLBACK");
}

function db_query_exception($query){
    $mysql = db_connect();
    $result = mysqli_query($mysql, $query);
    if(!$result){
        throw new Exception(mysqli_error($mysql), 150);
    }
    return $result;
}

function db_insert_query_exception($query){
    $mysql = db_connect();
    $result = mysqli_query($mysql, $query);
    if(!$result){
        throw new Exception(mysqli_error($mysql), 150);
    }
    $array = array();
    array_push($array, $result);
    array_push($array, mysqli_insert_id($mysql));
    return $array;
}

function db_select_exception($query){
    $rows = array();
    $result = db_query_exception($query);

    while($row = mysqli_fetch_assoc($result)){
        $rows[] = $row;
    }
    return $rows;
}

function db_select_single_exception($query, $name){
    $result = db_select($query);
    if(!$result || count($result)===0){
        throw new Exception("Your query returned no results", 199);
    }else{
        return $result[0][$name];
    }
}

function db_error(){
    $mysql = db_connect();
    return mysqli_error($mysql);
}

function db_escape_string($string) {
    $mysql = db_connect();
    return mysqli_real_escape_string($mysql, $string);
}

function succeedRequest($result) {
    $response = array(
        "success" => TRUE,
        "result" => $result);
    echo json_encode($response);
    exit();
}

function failRequest($message){
    //errorLog("There was an error in the get worksheet request: " . $message);
    $response = array(
        "success" => FALSE,
        "message" => $message);
    echo json_encode($response);
    exit();
}
