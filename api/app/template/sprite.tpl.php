<?php

$req = get_request_json__(true);

$game_id = $req->game ?? '';
$game_info = get_validated_game_info_of__($game_id);
$game_path = BASE_PATH . $game_info->path;

$atlas_id = $req->atlas ?? '';
if(!is_safe_identifier($atlas_id)) {
    return_json(404, "Atlas ID `$atlas_id` is not valid.", 'atlas_not_found');
}
$atlas_json_path = $game_path . '/assets/atlasses/' . $atlas_id . '.json';
if(!file_exists($atlas_json_path)) {
    return_json(404, "Atlas `$atlas_id` is not found.", 'atlas_not_found');
}
$atlas_data = json_decode(file_get_contents($atlas_json_path), false);
$atlas_image_name = ($atlas_data->meta ?? (object)[])->image ?? '';
if(is_safe_filename($atlas_image_name, '.png')) {
    return_json(
        500,
        "Atlas image name `$atlas_image_name` is not valid. This is an internal data invalidity and not your fault.",
        'atlas_data_invalid'
    );
}
$atlas_image_path = dirname($atlas_json_path) . '/' . $atlas_image_name;

if(!file_exists($atlas_image_path)) {
    return_json(
        500,
        "Atlas image name `$atlas_image_name` is not found. This is an internal data invalidity and not your fault.",
        'atlas_data_invalid'
    );
}
$sprite_id = $req->sprite ?? '';
if(!is_safe_identifier($sprite_id)) {
    return_json(404, "Sprite ID `$sprite_id` is not valid.", 'sprite_not_found');
}
$cache_mtime = max(
    get_games_mtime(),
    filemtime($atlas_json_path),
    filemtime($atlas_image_path)
);
$cache_name = $game_id . '/sprite/' . $atlas_id . '--' . $sprite_id . '.png';
if(cache_can_use($cache_name, $cache_mtime)) {
    header('Content-Type: image/png');
    echo file_get_contents(CACHE_PATH . $cache_name);
    exit();
} else if(CACHE_ONLY) {
    return_json(
        404,
        'Cache misses and the configuration disallows new image creation.',
        'cache_miss'
    );
}

$sprite_data = null;
foreach(($atlas_data->frames ?? []) as &$v) {
    if(($v->filename ?? null) === $sprite_id) {
        $sprite_data = $v;
        break;
    }
}
if($sprite_data === null) {
    return_json(
        404,
        "Sprite `$sprite_id` is not found.",
        'sprite_not_found'
    );
}

$image = imagecreatefrompng($atlas_image_path);
$sprite_rect = $sprite_data->frame ?? (object)[];
$image = imagecrop($image, [
    'x' => $sprite_rect->x ?? 0, 'y' => $sprite_rect->y ?? 0,
    'width' => $sprite_rect->w ?? 1, 'height' => $sprite_rect->h ?? 1
]);

imagesavealpha($image, true);
if(CACHE_DO_STORE) {
    cache_prep($cache_name);
    imagepng($image, CACHE_PATH . $cache_name);
    cache_touch($cache_name, $cache_mtime);
}
header('Content-Type: image/png');
imagepng($image);
