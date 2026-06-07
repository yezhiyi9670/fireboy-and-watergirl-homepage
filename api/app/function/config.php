<?php

function is_editing_allowed() {
    $edit_allow_ips_file = CONFIG_PATH . 'edit_allow_ips.json5';
    if(!file_exists($edit_allow_ips_file)) {
        return false;
    }
    $allowed_ips = json5_decode_file($edit_allow_ips_file, false);
    return in_array($_SERVER['REMOTE_ADDR'], $allowed_ips);
}
