<?php

$req = get_request_json__(true);

$game_id = $req->game ?? '';
$game_info = get_validated_game_info_of__($game_id);
$game_path = BASE_PATH . $game_info->path;
$temples = $game_info->temples;

$ret_data = (object)[];

foreach($temples as $temple_id) {
    $temple_data = get_validated_temple_data_of__($game_info, $temple_id);
    $ret_data->{$temple_id} = $temple_data;
    foreach($temple_data->levels as &$v_level) {
        $level_filename = $v_level->filename;
        $level_metadata = get_level_metadata_of__($game_info, $level_filename);
        $v_level->__metadata = $level_metadata;
    }
}

return_json(200, $ret_data);
