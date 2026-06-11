<?php

declare(strict_types=1);

namespace App\Core\Exceptions;

/**
 * Thrown when a client has exceeded a rate limit — e.g. too many failed
 * login attempts from the same IP or for the same email. Maps to 429 (Too
 * Many Requests) and carries a `Retry-After` header so well-behaved clients
 * know when to back off.
 */
final class TooManyRequestsException extends HttpException
{
    public function __construct(string $message, int $retryAfterSeconds)
    {
        parent::__construct(
            429,
            $message,
            errors: [],
            headers: ['Retry-After' => (string) max(1, $retryAfterSeconds)],
        );
    }
}