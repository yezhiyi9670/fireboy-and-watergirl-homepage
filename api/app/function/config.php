<?php

function is_editing_allowed() {
    $edit_allow_ips_file = CONFIG_PATH . 'edit_allow_ips.json';
    if(!file_exists($edit_allow_ips_file)) {
        return false;
    }
    $allowed_ips = json_decode(file_get_contents($edit_allow_ips_file), false);
    return in_array($_SERVER['REMOTE_ADDR'], $allowed_ips);
}
