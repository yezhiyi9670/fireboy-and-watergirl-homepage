<?php

// IMPORTANT: The path constants below must end with a `/` character, since the rest of the codebase assumes so.

define('BASE_PATH', rtrim(str_replace(
    "\\", '/', dirname(__FILE__)
), '/') . '/');

function check_app_data_dir__(string $dir_relpath, bool $check_htaccess) {
    if(!file_exists(BASE_PATH . $dir_relpath)) {
        die('dir existence check failed: ' . $dir_relpath);
    }
    if($check_htaccess && !file_exists(BASE_PATH . $dir_relpath . '.htaccess')) {
        die('htaccess file check failed: ' . $dir_relpath);
    }
}

check_app_data_dir__('app/', true);
define('APP_PATH', BASE_PATH . 'app/');

check_app_data_dir__('res/', false);
define('RES_PATH', BASE_PATH . 'res/');

check_app_data_dir__('cache/', true);
define('CACHE_PATH', BASE_PATH . 'cache/');

check_app_data_dir__('config/', true);
define('CONFIG_PATH', BASE_PATH . 'config/');

require(__DIR__ . '/config/config.php');
require(__DIR__ . '/app/app.php');
