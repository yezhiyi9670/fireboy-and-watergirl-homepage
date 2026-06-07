<?php

$req = get_request_json__(false);

if(!is_editing_allowed()) {
    return_failure(
        403,
        'editing_not_allowed', [],
        'Editing is not allowed.'
    );
}

return_failure(
    503,
    'not_implemented', [],
    'Not implemented yet.'
);
