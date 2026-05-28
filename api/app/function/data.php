<?php

function get_games() {
    return json_decode(file_get_contents(CONFIG_PATH . 'games.json'), false);
}
function get_games_mtime() {
    return filemtime(CONFIG_PATH . 'games.json');
}

function is_safe_identifier(string $id) {
    return !!preg_match('/^(\w+(-\w+)*)$/', $id);
}
function is_safe_multipart_identifier(string $id) {
    return !!preg_match('/^(\w+(-\w+)*)(\/\w+(-\w+)*)*$/', $id);
}
function is_safe_multipart_filename(string $fn, string $desired_suffix='') {
    if($fn == '') {
        return false;
    }
    $forbidden_chars = [':', '*', '?', '"', '<', '>', '|'];
    for($i = 0; $i < strlen($fn); $i++) {
        if(in_array($fn[$i], $forbidden_chars)) {
            return false;
        }
    }
    if(false !== strpos($fn, '..')) {
        return false;
    }
    if($desired_suffix != '' && !str_ends_with($fn, $desired_suffix)) {
        return false;
    }
    return true;
}
function is_safe_filename(string $fn, string $desired_suffix='') {
    $forbidden_chars = ["\\", '/'];
    for($i = 0; $i < strlen($fn); $i++) {
        if(in_array($fn[$i], $forbidden_chars)) {
            return false;
        }
    }
    return is_safe_multipart_filename($fn, $desired_suffix);
}

/**
 * Validated keys: path (string), temples (list of multipart_identifier), type (string)
 */
function get_validated_game_info_of__(string $game_id) {
    if(!is_safe_identifier($game_id)) {
        return_json(404, "Game ID `$game_id` is not valid.", 'game_not_found');
    }
    $games = get_games();
    if(!isset($games->{$game_id})) {
        return_json(404, "Game `$game_id` is not found.", 'game_not_found');
    }
    $game = $games->{$game_id};
    $game_path = BASE_PATH . $game->path;

    $game_json_path = $game_path . '/' . 'game.json';
    if(!file_exists($game_json_path)) {
        return_json(
            500,
            "The game.json file cannot be found. This is an internal data invalidity and not your fault.",
            'game_data_missing'
        );
    }
    $game_data = json_decode(file_get_contents($game_json_path), false);
    
    if(!is_string($game_data->type ?? null)) {
        return_json(
            500,
            "String value `type` missing in game.json. This is an internal data invalidity and not your fault.",
            'game_data_invalid'
        );
    }
    $is_multi = $game_data->type == 'multi';
    $temples = [];
    if($is_multi) {
        $temples = $game_data->temples;
    } else {
        $temples = [ $game_data->temples ];
    }
    if(!is_array($temples)) {
        return_json(
            500,
            "Array value `temples` not found in game.json for multi-temple game. " .
            "This is an internal data invalidity and not your fault.",
            'game_data_invalid'
        );
    }
    foreach($temples as &$v) {
        if(!is_string($v)) {
            return_json(
                500,
                "Non-string temple ID found in game.json. This is an internal data invalidity and not your fault.",
                'game_data_invalid'
            );
        }
        if(!is_safe_multipart_identifier($v)) {
            return_json(
                500,
                "Invalid temple ID `$v` found in game.json. This is an internal data invalidity and not your fault.",
                'game_data_invalid'
            );
        }
    }
    return (object)[
        'type' => $game_data->type,
        'path' => $game->path,
        'temples' => $temples,
        '__original' => $game_data
    ];
}

/**
 * Validated keys: levels.[].filename (string)
 */
function validate_temple_data(&$temple_data) {
    $valid = false;
    if(is_object($temple_data)) {
        $levels =& $temple_data->levels;
        if(is_array($levels)) {
            $valid = true;
            foreach($levels as &$v) {
                if(!is_object($v) || !is_string($v->filename ?? null)) {
                    $valid = false;
                    break;
                }
            }
        }
    }
    return $valid;
}

/**
 * Validated keys: levels.[].filename (string)
 */
function get_validated_temple_data_of__(object &$game_info, string $temple_id) {
    if(!in_array($temple_id, $game_info->temples)) {
        return_json(404, "Temple `$temple_id` is not found.", 'temple_not_found');
    }
    $temple_json_path = BASE_PATH . $game_info->path . '/data/' . $temple_id . '/temple.json';
    if(!file_exists($temple_json_path)) {
        return_json(
            500,
            "The temple.json file is not found. This is an internal data invalidity and not your fault.",
            'temple_json_missing'
        );
    }
    $temple_data = json_decode(file_get_contents($temple_json_path), false);
    if(!validate_temple_data($temple_data)) {
        return_json(
            500,
            "The temple.json data failed validation. This is an internal data invalidity and not your fault.",
            'temple_data_invalid'
        );
    }
    return $temple_data;
}

function get_level_metadata_of__(object &$game_info, string $level_filename) {
    $game_path = BASE_PATH . $game_info->path;
    $level_path = $game_path . '/data/' . $level_filename;
    if(!is_safe_multipart_filename($level_filename, '.json')) {
        return_json(
            500,
            "Level filename `$level_filename` is invalid. This is an internal data invalidity and not your fault.",
            "level_filename_invalid"
        );
    }
    if(!file_exists($level_path)) {
        return_json(
            500,
            "Level file `$level_filename` is missing. This is an internal data invalidity and not your fault.",
            "level_missing"
        );
    }
    $level_data = json_decode(file_get_contents($level_path), false);
    return (object)[
        'width' => $level_data->width ?? null,
        'height' => $level_data->height ?? null,
        'title' => ($level_data->properties ?? (object)[])->title ?? null
    ];
}

/**
 * Find from object list.
 */
function find_from_object_array(array &$arr, object &$filter) {
    foreach($arr as &$v_item) {
        $matches = true;
        foreach($filter as $k_filter => &$v_filter) {
            if(($v_item->{$k_filter} ?? null) != $v_filter) {
                $matches = false;
                break;
            }
        }
        if($matches) {
            return $v_item;
        }
    }
    return null;
}


function cache_can_use($cache_name, $cache_mtime) {
    if(!CACHE_DO_USE) {
        return false;
    }
    $cache_path = CACHE_PATH . $cache_name;
    if(!file_exists($cache_path)) {
        return false;
    }
    if(filemtime($cache_path) != $cache_mtime) {
        return false;
    }
    return true;
}
function cache_prep($cache_name) {
    $cache_path = CACHE_PATH . $cache_name;
    $dirname = dirname($cache_path);
    if(!file_exists($dirname)) {
        mkdir($dirname, 0777, true);
    }
}
function cache_touch($cache_name, $cache_mtime) {
    $cache_path = CACHE_PATH . $cache_name;
    touch($cache_path, $cache_mtime);
}
