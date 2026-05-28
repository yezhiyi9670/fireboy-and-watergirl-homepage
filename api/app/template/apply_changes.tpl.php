<?php

$req = get_request_json__(false);

if(!is_editing_allowed()) {
    return_json(403, 'Editing is not allowed.', 'editing_not_allowed');
}

return_json(503, 'Not implemented yet.', 'not_implemented');
