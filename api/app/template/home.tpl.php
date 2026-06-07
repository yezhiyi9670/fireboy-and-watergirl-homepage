<?php

$req = get_request_json__(true);

// TODO: Parse and serve introduction.md and modification-notes.md to frontend.

$games = get_games();
foreach($games as $k=>&$v) {
    unset($v->path);
    $game_info = get_validated_game_info_of__($k);
    unset($game_info->path);
    unset($game_info->__original);
    $v->info = $game_info;
}

$cheat_flag_defs = get_cheat_flag_defs();

$pd = new Parsedown();
$pd->setSafeMode(false);

$texts = (object)[];
foreach(['homepage_pre', 'gamelist_post', 'progress_post', 'homepage_post', 'modification_notes'] as $text_name) {
    $text_path = RES_PATH . "$text_name.md";
    $parsed = '';
    if(file_exists($text_path)) {
        $parsed = $pd->text(file_get_contents($text_path));
    }
    $texts->{$text_name} = $parsed;
}

return_success((object)[
    'games' => $games,
    'cheat_flag_defs' => $cheat_flag_defs,
    'texts' => $texts,
]);
