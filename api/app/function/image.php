<?php

function image_create_filled(int $width, int $height, int $background) {
    $img = imagecreatetruecolor($width, $height);
    imagealphablending($img, false);
    imagefilledrectangle(
        $img,
        /*p1*/ 0, 0,
        /*p2*/ $width-1, $height-1,
        /*color*/ $background
    );
    imagealphablending($img, true);
    return $img;
}
