<?php

$req = get_request_json__(false);

if(!is_editing_allowed()) {
    return_failure(
        403,
        'editing_not_allowed', [],
        'Editing is not allowed.'
    );
}
if(!is_object($req)) {
    return_failure(
        422,
        'unprocessable_entity', [],
        'Request body must be a JSON object.'
    );
}

$game_id = $req->game ?? null;
if(!is_string($game_id)) {
    return_failure(
        422,
        'unprocessable_entity', [],
        'String value `game` is missing.'
    );
}
$game_info = get_validated_game_info_of__($game_id);
$game_path = BASE_PATH . $game_info->path;

// Hold an exclusive lock for the whole operation; temples endpoint waits on it.
$lock = apply_lock_exclusive__();

// State check: default level must be readable.
$default_level_path = $game_path . '/assets/tilemaps/tilesets/default_level.json';
if(!is_file($default_level_path) || !is_readable($default_level_path)) {
    return_failure(
        500,
        'default_level_unavailable', [],
        'The default level file cannot be read.'
    );
}

// --- validate temples -------------------------------------------------------

$temples = $req->temples ?? null;
if(!is_object($temples)) {
    return_failure(
        422,
        'unprocessable_entity', [],
        '`temples` must be an object.'
    );
}

$validated_temples = [];
$temple_json_paths = [];
foreach(get_object_vars($temples) as $temple_key => $temple_value) {
    if(!in_array($temple_key, $game_info->temples)) {
        return_failure(
            404,
            'temple_not_found', [$temple_key],
            "Temple `$temple_key` is not found."
        );
    }
    $temple_json_path = get_temple_data_path__($game_info, $temple_key);
    if(!file_exists($temple_json_path)) {
        return_failure(
            500,
            'temple_json_missing', [],
            "The temple.json file for `$temple_key` is missing."
        );
    }
    if(!can_write_file_where($temple_json_path)) {
        return_failure(
            500,
            'temple_json_not_writable', [],
            "The temple.json file for `$temple_key` is not writable."
        );
    }
    if(!validate_temple_data($temple_value)) {
        return_failure(
            422,
            'unprocessable_entity', [],
            "Temple data for `$temple_key` is invalid."
        );
    }
    $validated_temples[$temple_key] = $temple_value;
    $temple_json_paths[$temple_key] = $temple_json_path;
}

// --- strip derived metadata -------------------------------------------------

foreach(get_object_vars($temples) as $temple_key => &$v_temple) {
    foreach($v_temple->levels as &$v_level) {
        if(isset($v_level->__metadata)) {
            unset($v_level->__metadata);
        }
    }
}

// --- compute file add/remove lists ------------------------------------------

$before_files = [];
$after_files = [];
foreach($validated_temples as $temple_key => $temple_value) {
    $original_temple = get_validated_temple_data_of__($game_info, $temple_key);
    foreach($original_temple->levels as $level) {
        $before_files[$level->filename] = true;
    }
    foreach($temple_value->levels as $level) {
        $after_files[$level->filename] = true;
    }
}
$delete_files = [];
$new_files = [];
foreach(array_keys($before_files) as $filename) {
    if(!isset($after_files[$filename])) {
        $delete_files[] = $filename;
    }
}
foreach(array_keys($after_files) as $filename) {
    if(!isset($before_files[$filename])) {
        $new_files[] = $filename;
    }
}
sort($delete_files);
sort($new_files);

// --- validate files ---------------------------------------------------------

$files = $req->files ?? null;
if(!is_object($files)) {
    return_failure(
        422,
        'unprocessable_entity', [],
        '`files` must be an object.'
    );
}
$sources = $files->sources ?? null;
if(!is_object($sources)) {
    return_failure(
        422,
        'unprocessable_entity', [],
        '`files.sources` must be an object.'
    );
}
foreach(get_object_vars($sources) as $new_filename => $source_filename) {
    if(!is_string($new_filename) || !is_string($source_filename)) {
        return_failure(
            422,
            'unprocessable_entity', [],
            '`files.sources` keys and values must be strings.'
        );
    }
}

foreach(array_merge($new_files, $delete_files) as $filename) {
    if(!is_safe_multipart_filename($filename, '.json')) {
        return_failure(
            422,
            'unprocessable_entity', [],
            "Level filename `$filename` is invalid."
        );
    }
}
foreach($new_files as $filename) {
    $level_path = $game_path . '/data/' . $filename;
    if(!can_write_file_where($level_path)) {
        return_failure(
            500,
            'level_not_writable', [],
            "Level file `$filename` cannot be written."
        );
    }
}
foreach($delete_files as $filename) {
    $level_path = $game_path . '/data/' . $filename;
    if(!can_delete_file_where($level_path)) {
        return_failure(
            500,
            'level_not_deletable', [],
            "Level file `$filename` cannot be deleted."
        );
    }
}
foreach(get_object_vars($sources) as $source_filename) {
    $source_path = $game_path . '/data/' . $source_filename;
    if(file_exists($source_path) && !is_readable($source_path)) {
        return_failure(
            500,
            'source_not_readable', [],
            "Source file `$source_filename` is not readable."
        );
    }
}

// --- create new level files -------------------------------------------------

foreach($new_files as $filename) {
    $level_path = $game_path . '/data/' . $filename;
    if(file_exists($level_path)) {
        continue;
    }
    $copied = false;
    $source_filename = $sources->{$filename} ?? null;
    if(is_string($source_filename)) {
        $source_path = $game_path . '/data/' . $source_filename;
        if(is_file($source_path)) {
            if(!@copy($source_path, $level_path)) {
                return_failure(
                    500,
                    'level_copy_failed', [],
                    "Failed to copy `$source_filename` to `$filename`."
                );
            }
            $copied = true;
        }
    }
    if(!$copied) {
        if(!@copy($default_level_path, $level_path)) {
            return_failure(
                500,
                'level_create_failed', [],
                "Failed to create level file `$filename`."
            );
        }
    }
}

// --- write temple.json ------------------------------------------------------

foreach($validated_temples as $temple_key => $temple_value) {
    $json = json_encode($temple_value, JSON_UNESCAPED_UNICODE + JSON_UNESCAPED_SLASHES + JSON_PRETTY_PRINT);
    if($json === false) {
        return_failure(
            500,
            'temple_json_encode_failed', [],
            "Failed to encode temple data for `$temple_key`."
        );
    }
    if(@file_put_contents($temple_json_paths[$temple_key], $json) === false) {
        return_failure(
            500,
            'temple_json_write_failed', [],
            "Failed to write temple.json for `$temple_key`."
        );
    }
}

// --- delete old level files -------------------------------------------------

foreach($delete_files as $filename) {
    $level_path = $game_path . '/data/' . $filename;
    if(!file_exists($level_path)) {
        continue;
    }
    if(!@unlink($level_path)) {
        return_failure(
            500,
            'level_delete_failed', [],
            "Failed to delete level file `$filename`."
        );
    }
}

return_success((object)[]);
