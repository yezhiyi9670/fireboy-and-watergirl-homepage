<?php

$req = get_request_json__(true);

$game_id = $req->game ?? '';
$game_info = get_validated_game_info_of__($game_id);
$game_path = BASE_PATH . $game_info->path;

$temple_id = $req->temple ?? '';
$temple_data = get_validated_temple_data_of__($game_info, $temple_id);
$temple_fn = str_replace('/', '-', $temple_id);
$levels = $temple_data->levels;

$level_filter = $req->level_filter ?? (object)[];
$level = find_from_object_array($levels, $level_filter);
if($level === null) {
    return_failure(
        404,
        'level_not_found', [],
        'Level satisfying the filter not found.'
    );
}
$level_filename = $level->filename;
if(!is_safe_multipart_filename($level_filename, '.json')) {
    return_failure(
        500,
        'level_filename_invalid', [],
        "Level filename `$level_filename` is invalid."
    );
}
$level_path = $game_path . '/data/' . $level_filename;
if(!file_exists($level_path)) {
    return_failure(
        500,
        'level_missing', [],
        "Level file `$level_filename` is missing."
    );
}
$level_mtime = filemtime($level_path);
$level_fn = str_replace('/', '--', $level_filename);
$level_fn = substr($level_fn, 0, strlen($level_fn) - 5);  // strip suffix

$is_dark = ($level->type ?? 'general') == 'dark';

$cache_name = $game_id . '/level_preview/' . $level_fn . ($is_dark ? '--dark' : '') . '.png';
$cache_mtime = max($level_mtime, filemtime(__FILE__));
if(cache_can_use($cache_name, $cache_mtime)) {
    header('Content-Type: image/png');
    echo file_get_contents(CACHE_PATH . $cache_name);
    exit();
} else if(CACHE_ONLY) {
    return_failure(
        404,
        'cache_miss', [],
        'Cache misses and the configuration disallows new image creation.'
    );
}

$tile_size = 8;
$level_data = json_decode(file_get_contents($level_path), false);
$width = $level_data->width ?? 1;
$height = $level_data->height ?? 1;

$grounds_first_gid = 0;
foreach($level_data->tilesets as &$v_item) {
	if(str_ends_with($v_item->source, 'Ground.json') !== false) {
		$grounds_first_gid = $v_item->firstgid;
		break;
	}
}
$data_arr = [];
foreach($level_data->layers as &$v_layer) {
    if($v_layer->name == 'Ground') {
        $data_arr = $v_layer->data;
    }
}

$level_tile_width = $level_data->tilewidth;
$level_tile_height = $level_data->tileheight;
$chars_first_gid = 0;
foreach($level_data->tilesets as &$v_item) {
	if(str_ends_with($v_item->source, 'Chars.json') !== false) {
		$chars_first_gid = $v_item->firstgid;
		break;
	}
}
$initial_lights_list = [];
foreach($level_data->layers as &$v_layer) {
    if($v_layer->name == 'Chars') {
        $objects = $v_layer->objects ?? [];
        foreach($objects as &$v_object) {
            $object_id = ($v_object->gid ?? 0) - $chars_first_gid;
            if(2 <= $object_id && $object_id < 8) {
                // id 2-7 are for doors and diamonds which does not emit light.
                continue;
            }
            $initial_lights_list[] = (object)[
                'x' => ($v_object->x + $v_object->width / 2) / $level_tile_width,
                'y' => ($v_object->y - $v_object->height / 2) / $level_tile_height,
                'radius' => ($object_id < 2) ? 5 : 4
            ];
        }
    }
}

$img_orig_grounds = imagecreatefrompng(RES_PATH . 'Ground.png');
$grounds_len = intval(imagesx($img_orig_grounds) / imagesy($img_orig_grounds));
$img_grounds = image_create_filled($grounds_len * $tile_size, 1 * $tile_size, 127 << 24);
imagecopyresampled(
    /*dst,src*/ $img_grounds, $img_orig_grounds,
    /*p_dst,p_src*/ 0, 0, 0, 0,
    /*s_dst,s_src*/ imagesx($img_grounds), imagesy($img_grounds), imagesx($img_orig_grounds), imagesy($img_orig_grounds)
);

$pad = $tile_size / 2;
$img = image_create_filled($pad * 2 + $width * $tile_size, $pad * 2 + $height * $tile_size, 0x1C1C1D);
imagealphablending($img, false);
imagefilledrectangle(
    $img,
    /*p1*/ $pad, $pad,
    /*p2*/ imagesx($img)-1-$pad, imagesy($img)-1-$pad,
    0x0C0C0D
);
imagealphablending($img, true);
for($y = 0; $y < $height; $y++) {
    for($x = 0; $x < $width; $x++) {
        $tile_obscurity = 1;
        if($is_dark) {
            $cx = $x + 0.5;
            $cy = $y + 0.5;
            foreach($initial_lights_list as &$v_light) {
                $distance = pow(pow($cx - $v_light->x, 2) + pow($cy - $v_light->y, 2), 1/2);
                $radius = $v_light->radius;
                $radius_low = $radius / 2;
                $radius_high = $radius + 0.5;
                if($distance < $radius_low) {
                    $tile_obscurity = 0;
                    break;
                } else if($distance < $radius_high) {
                    $tile_obscurity = min($tile_obscurity, ($distance - $radius_low) / ($radius_high - $radius_low));
                }
            }
        } else {
            $tile_obscurity = 0;
        }
        if($tile_obscurity < 1) {
            $i = $y * $width + $x;
            if($i > count($data_arr)) {
                break;
            }
            $tile_type = $data_arr[$i] - $grounds_first_gid;
            if($tile_type >= 0 && $tile_type <= $grounds_len) {
                imagecopy(
                    /*dst,src*/ $img, $img_grounds,
                    /*p_dst,p_src*/ $pad + $x*$tile_size, $pad + $y*$tile_size, $tile_type*$tile_size, 0,
                    /*s*/ $tile_size, $tile_size
                );
            }
        }
        imagefilledrectangle(
            $img,
            /*p1*/ $pad + $x*$tile_size, $pad + $y*$tile_size,
            /*p2*/ $pad + $x*$tile_size + $tile_size-1, $pad + $y*$tile_size + $tile_size-1,
            /*color*/ (intval(round(127 * (1 - $tile_obscurity))) << 24) | (0x08 * 0x010101)
        );
    }
}

imagesavealpha($img, true);
if(CACHE_DO_STORE) {
    cache_prep($cache_name);
    imagepng($img, CACHE_PATH . $cache_name);
    cache_touch($cache_name, $cache_mtime);
}
header('Content-Type: image/png');
imagepng($img);
