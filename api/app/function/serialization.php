<?php

function json_network_encode($data) {
    return json_encode($data, JSON_UNESCAPED_UNICODE+JSON_UNESCAPED_SLASHES);
}
