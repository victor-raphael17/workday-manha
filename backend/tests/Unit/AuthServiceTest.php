<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Core\Exceptions\UnauthorizedException;
use App\Repositories\SessionRepository;
use App\Repositories\UserRepository;
use App\Services\AuthService;
use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\MockObject\MockObject;

final class AuthServiceTest extends TestCase
{
    private UserRepository&MockObject $users;
    private SessionRepository&MockObject $sessions;
    private AuthService $service;

    protected function setUp(): void
    {
        $this->users = $this->getMockBuilder(UserRepository::class)
            ->disableOriginalConstructor()
            ->getMock();

        $this->sessions = $this->getMockBuilder(SessionRepository::class)
            ->disableOriginalConstructor()
            ->getMock();

        $this->service = new AuthService($this->users, $this->sessions);
    }

    // --- login() ---

    public function test_login_throws_with_wrong_password(): void
    {
        $this->users->method('findByEmail')->willReturn([
            'id'            => 1,
            'password_hash' => password_hash('correct', PASSWORD_BCRYPT),
        ]);

        $this->expectException(UnauthorizedException::class);

        $this->service->login('user@example.com', 'wrong');
    }

    public function test_login_throws_when_user_not_found(): void
    {
        $this->users->method('findByEmail')->willReturn(null);

        $this->expectException(UnauthorizedException::class);

        $this->service->login('nobody@example.com', 'password');
    }

    public function test_login_returns_token_on_success(): void
    {
        $this->users->method('findByEmail')->willReturn($this->sampleUser());
        $this->sessions->method('create')->willReturn([]);

        $result = $this->service->login('user@example.com', 'secret');

        $this->assertArrayHasKey('token', $result);
        $this->assertArrayHasKey('expires_at', $result);
        $this->assertArrayHasKey('user', $result);
        $this->assertArrayNotHasKey('password_hash', $result['user']);
    }

    // --- authenticate() ---

    public function test_authenticate_throws_with_empty_token(): void
    {
        $this->expectException(UnauthorizedException::class);

        $this->service->authenticate('');
    }

    public function test_authenticate_throws_with_invalid_token(): void
    {
        $this->sessions->method('findValid')->willReturn(null);

        $this->expectException(UnauthorizedException::class);

        $this->service->authenticate('invalidtoken');
    }

    public function test_authenticate_returns_user_on_valid_token(): void
    {
        $this->sessions->method('findValid')->willReturn(['user_id' => 1]);
        $this->users->method('find')->willReturn($this->sampleUser());

        $result = $this->service->authenticate('validtoken');

        $this->assertSame(1, $result['id']);
        $this->assertArrayNotHasKey('password_hash', $result);
    }

    // --- logout() ---

    public function test_logout_with_empty_token_does_nothing(): void
    {
        $this->sessions->expects($this->never())->method('deleteByTokenHash');

        $this->service->logout('');
    }

    public function test_logout_deletes_session(): void
    {
        $this->sessions->expects($this->once())->method('deleteByTokenHash');

        $this->service->logout('sometoken');
    }

    // --- helpers ---

    private function sampleUser(): array
    {
        return [
            'id'            => 1,
            'name'          => 'Jade Okafor',
            'email'         => 'user@example.com',
            'role'          => 'pharmacist',
            'password_hash' => password_hash('secret', PASSWORD_BCRYPT),
            'created_at'    => '2026-01-01 00:00:00',
            'updated_at'    => '2026-01-01 00:00:00',
        ];
    }
}