<?php

$req = get_request_json__(true);

$games = get_games();
foreach($games as $k=>&$v) {
    unset($v->path);
    $game_info = get_validated_game_info_of__($k);
    unset($game_info->path);
    unset($game_info->__original);
    $v->info = $game_info;
}

return_json(200, $games);
