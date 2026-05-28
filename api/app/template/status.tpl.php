<?php

$data = get_request_json__(true);

return_json(200, (object)[
    'editing_allowed' => is_editing_allowed()
]);
