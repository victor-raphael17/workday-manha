<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Exceptions\TooManyRequestsException;
use App\Repositories\LoginAttemptRepository;

/**
 * Brute-force protection for POST /api/auth/login.
 *
 * Failed attempts are tracked in two independent "buckets" — one per client
 * IP and one per email address — so an attacker can't dodge the limit by
 * rotating IPs against a single account, nor by spraying many accounts from
 * one IP. Either bucket tripping the limit blocks the request with 429 until
 * the lockout expires. A successful login clears both buckets.
 */
class LoginRateLimiter
{
    /** Failed attempts allowed within the decay window before locking out. */
    private readonly int $maxAttempts;

    /** Rolling window (seconds) that failed attempts are counted within. */
    private readonly int $decaySeconds;

    /** How long a bucket stays locked once the limit is reached. */
    private readonly int $lockoutSeconds;

    public function __construct(
        private readonly LoginAttemptRepository $attempts = new LoginAttemptRepository(),
    ) {
        $this->maxAttempts = max(1, (int) config('auth.login_throttle.max_attempts', 5));
        $this->decaySeconds = max(1, (int) config('auth.login_throttle.decay_seconds', 900));
        $this->lockoutSeconds = max(1, (int) config('auth.login_throttle.lockout_seconds', 900));
    }

    /**
     * Throw a 429 if the IP or the email bucket is currently locked out.
     * Call this *before* verifying credentials.
     */
    public function ensureNotLocked(string $ip, string $email): void
    {
        foreach ($this->buckets($ip, $email) as $identifier) {
            $row = $this->attempts->find($identifier);

            if ($row === null || $row['locked_until'] === null) {
                continue;
            }

            $retryAfter = $this->secondsUntil((string) $row['locked_until']);

            if ($retryAfter > 0) {
                throw new TooManyRequestsException(
                    'Too many login attempts. Please try again later.',
                    $retryAfter
                );
            }
        }
    }

    /** Record a failed attempt for both the IP and email buckets. */
    public function recordFailure(string $ip, string $email): void
    {
        foreach ($this->buckets($ip, $email) as $identifier) {
            $this->registerFailure($identifier);
        }
    }

    /** Reset both buckets after a successful login. */
    public function recordSuccess(string $ip, string $email): void
    {
        foreach ($this->buckets($ip, $email) as $identifier) {
            $this->attempts->clear($identifier);
        }
    }

    /**
     * @return array<int, string>
     */
    private function buckets(string $ip, string $email): array
    {
        return [
            'ip:' . $ip,
            'email:' . strtolower($email),
        ];
    }

    private function registerFailure(string $identifier): void
    {
        $now = new \DateTimeImmutable();
        $row = $this->attempts->find($identifier);

        if ($row === null) {
            $this->attempts->upsert($identifier, 1, $now->format('Y-m-d H:i:sP'), null);

            return;
        }

        $firstAttemptAt = new \DateTimeImmutable((string) $row['first_attempt_at']);
        $windowExpired = ($now->getTimestamp() - $firstAttemptAt->getTimestamp()) > $this->decaySeconds;

        $lockedUntil = $row['locked_until'] !== null
            ? new \DateTimeImmutable((string) $row['locked_until'])
            : null;
        $lockExpired = $lockedUntil !== null && $lockedUntil->getTimestamp() <= $now->getTimestamp();

        // Rolling window or a previous lockout has expired: start fresh.
        if ($windowExpired || $lockExpired) {
            $this->attempts->upsert($identifier, 1, $now->format('Y-m-d H:i:sP'), null);

            return;
        }

        $newAttempts = (int) $row['attempts'] + 1;
        $newLockedUntil = $newAttempts >= $this->maxAttempts
            ? $now->modify("+{$this->lockoutSeconds} seconds")->format('Y-m-d H:i:sP')
            : null;

        $this->attempts->upsert($identifier, $newAttempts, (string) $row['first_attempt_at'], $newLockedUntil);
    }

    private function secondsUntil(string $timestamp): int
    {
        $until = new \DateTimeImmutable($timestamp);
        $now = new \DateTimeImmutable();

        return $until->getTimestamp() - $now->getTimestamp();
    }
}