<?php

$_path = $_GET['_path'] ?? '';
require(__DIR__ . '/function/index.php');

if(!is_safe_multipart_filename($_path)) {
    return_action_not_found($_path);
}

$template_file = __DIR__ . '/template/' . $_path . '.tpl.php';
if(!file_exists($template_file)) {
    return_action_not_found($_path);
}

require($template_file);
