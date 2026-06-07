<?php

function return_success($data): void {
    http_response_code(200);
    header('Content-Type: application/json');
    echo json_network_encode((object)[
        'success' => true,
        'code' => 200,
        'data' => $data
    ]);
    exit();
}

function return_failure(int $response_code, string $error_id, array $args, string $message): void {
    http_response_code($response_code);
    header('Content-Type: application/json');
    echo json_network_encode((object)[
        'success' => false,
        'code' => $response_code,
        'data' => (object)[
            'error_id' => $error_id,
            'args' => $args,
            'message' => $message
        ]
    ]);
    exit();
}

function return_action_not_found(string $path) {
    return_failure(
        404,
        'action_not_found', [$path],
        'Action ' . $path . ' is not found.'
    );
}

/**
 * Returns request headers with keys in lower case. Never returns false.
 */
function get_request_headers_normalized() {
    $headers = getallheaders();
    if($headers === false) {
        $headers = [];
    }
    $ret = [];
    foreach($headers as $k => $v) {
        $ret[strtolower($k)] = $v;
    }
    return $ret;
}

/**
 * Get JSON request body.
 * 
 * The request body is obtained from the POST payload, for which the application/json MIME type is required.
 * If $use_data_from_get_param is true, JSON can also be provided as the `data` URL parameter in a GET request.
 * 
 * Allow $use_data_from_get_param only if the action makes no persistent changes. It is definitely not CSRF-proof.
 */
function get_request_json__(bool $use_data_from_get_param = false) {
    $json = null;
    if($_SERVER['REQUEST_METHOD'] == 'GET' && $use_data_from_get_param) {
        $json = $_GET['data'] ?? 'null';
    }
    if($_SERVER['REQUEST_METHOD'] == 'POST') {
        $headers = get_request_headers_normalized();
        $content_type = $headers['content-type'] ?? '';
        if($content_type != 'application/json') {
            return_failure(
                422,
                'unprocessable_entity', [],
                'POST request validation failed: Content-Type must be application/json.'
            );
        }
        $json = file_get_contents('php://input');
    }
    if($json === null) {
        return_failure(
            422,
            'unprocessable_entity', [],
            'JSON request body is required.'
        );
    }

    $data = null;
    try {
        $data = json_decode($json, false, 512, JSON_THROW_ON_ERROR);
    } catch(JsonException $e) {
        return_failure(
            422,
            'unprocessable_entity', [],
            'Failed to parse JSON request body.'
        );
    } catch(ValueError $e) {
        return_failure(
            422,
            'unprocessable_entity', [],
            'JSON request body is too deep.'
        );
    }
    return $data;
}
