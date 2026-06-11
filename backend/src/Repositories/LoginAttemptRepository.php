<?php

declare(strict_types=1);

namespace App\Repositories;

/**
 * Tracks failed login attempts for rate limiting (brute-force protection).
 * Each row is keyed by an arbitrary "bucket" identifier — e.g. `ip:1.2.3.4`
 * or `email:user@example.com` — so callers can throttle by IP, by email, or
 * both independently.
 */
final class LoginAttemptRepository extends Repository
{
    /**
     * @return array<string, mixed>|null
     */
    public function find(string $identifier): ?array
    {
        return $this->fetchOne(
            'SELECT identifier, attempts, first_attempt_at, locked_until
               FROM login_attempts
              WHERE identifier = :identifier',
            ['identifier' => $identifier]
        );
    }

    /**
     * Insert or replace the counter state for a bucket.
     */
    public function upsert(string $identifier, int $attempts, string $firstAttemptAt, ?string $lockedUntil): void
    {
        $this->execute(
            'INSERT INTO login_attempts (identifier, attempts, first_attempt_at, locked_until)
             VALUES (:identifier, :attempts, :first_attempt_at, :locked_until)
             ON CONFLICT (identifier) DO UPDATE
                SET attempts = EXCLUDED.attempts,
                    first_attempt_at = EXCLUDED.first_attempt_at,
                    locked_until = EXCLUDED.locked_until',
            [
                'identifier'       => $identifier,
                'attempts'         => $attempts,
                'first_attempt_at' => $firstAttemptAt,
                'locked_until'     => $lockedUntil,
            ]
        );
    }

    /** Clear the counter for a bucket (e.g. after a successful login). */
    public function clear(string $identifier): void
    {
        $this->execute('DELETE FROM login_attempts WHERE identifier = :identifier', ['identifier' => $identifier]);
    }
}