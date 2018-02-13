<?php
$include_path = get_include_path();
include_once $include_path . '/public_html/classes/AllClasses.php';

function sec_session_start(){
    $session_name = 'sec_session_id';
    $secure = false;
    // This stops Javascript being able to access the session id
    $httponly = true;
    // Forces sessions to only use cookies.
    if (ini_set('session.use_only_cookies',1) === FALSE){
        header("Location: ../error.php?err=Could not initiate a safe session (ini_set)");
        exit();
    }
    //Gets current cookie params.
    $cookieParams = session_get_cookie_params();
    session_set_cookie_params($cookieParams["lifetime"], $cookieParams["path"], $cookieParams["domain"], $secure, $httponly);
    //Sets the session name to the one set above
    session_name($session_name);
    session_start();
    session_regenerate_id(true);
}

function end_session(){
    if (session_status() == PHP_SESSION_NONE) {
        sec_session_start();
    }
    session_unset();
    session_destroy();
}

function logout(){
    if (session_status() == PHP_SESSION_NONE) {
        sec_session_start();
    }
    if (isset($_SESSION['user'])) {
        unset($_SESSION['user']);
    }
    if (isset($_SESSION['timeout'])) {
        unset($_SESSION['timeout']);
    }
}

function checkUserLoginStatus($url){
    //See if there is a logged in user
    if(isset($_SESSION['user'])){
        $user = $_SESSION['user'];
        $userid = $user->getUserId();
        $username = $user->getEmail();
        $timeout = $_SESSION['timeout'];
        if(isset($timeout)){
            if($timeout + 12*60*60 < time()){
                //Session timed out so save the users url and log them out
                if(isset($url)){
                    $_SESSION['url'] = $url;
                    $_SESSION['urlid'] = $userid;
                }
                logout();
                $url = "Location: ../login.php?email=$username";
                $bool = false;
            }else{
                //All good so carry on!
                $_SESSION['timeout'] = time();
                $url = '';
                $bool = true;
            }
        }else{
            //No timeout information so log out
            $url = "Location: ../login.php?email=$username";
            $bool = false;
        }
    }else{
        //Not logged in user so go to homepage
        $url = "Location: ../login.php";
        $bool = false;
    }
    $resultArray = array($bool, $url);
    return $resultArray;
}

function authoriseUserRoles($userRole, $roles){
    if ($userRole === "EXTERNAL") {
        return true;
    }
    foreach($roles as $role){
        if($userRole === $role){
            return true;
        }
    }
    return false;
}

function clearAllTemporaryVariables(){
    $tempVariables = array("message");
    foreach($tempVariables as $variable){
        unset($_SESSION[$variable]);
    }
}
