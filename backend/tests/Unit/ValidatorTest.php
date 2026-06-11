<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Core\Validator;
use App\Core\Exceptions\ValidationException;
use PHPUnit\Framework\TestCase;

final class ValidatorTest extends TestCase
{
    public function test_required_field_missing_throws(): void
    {
        $this->expectException(ValidationException::class);

        Validator::validate([], ['name' => 'required|string']);
    }

    public function test_valid_string_passes(): void
    {
        $result = Validator::validate(['name' => 'Amoxicillin'], ['name' => 'required|string']);

        $this->assertSame('Amoxicillin', $result['name']);
    }

    public function test_string_is_trimmed(): void
    {
        $result = Validator::validate(['name' => '  Amoxicillin  '], ['name' => 'required|string']);

        $this->assertSame('Amoxicillin', $result['name']);
    }

    public function test_invalid_email_throws(): void
    {
        $this->expectException(ValidationException::class);

        Validator::validate(['email' => 'not-an-email'], ['email' => 'required|email']);
    }

    public function test_valid_email_passes(): void
    {
        $result = Validator::validate(['email' => 'test@example.com'], ['email' => 'required|email']);

        $this->assertSame('test@example.com', $result['email']);
    }

    public function test_integer_cast(): void
    {
        $result = Validator::validate(['qty' => '10'], ['qty' => 'required|integer']);

        $this->assertSame(10, $result['qty']);
    }

    public function test_invalid_integer_throws(): void
    {
        $this->expectException(ValidationException::class);

        Validator::validate(['qty' => 'abc'], ['qty' => 'required|integer']);
    }

    public function test_min_constraint_throws(): void
    {
        $this->expectException(ValidationException::class);

        Validator::validate(['price' => 0], ['price' => 'required|numeric|min:1']);
    }

    public function test_max_constraint_throws(): void
    {
        $this->expectException(ValidationException::class);

        Validator::validate(['name' => 'ab'], ['name' => 'required|string|max:1']);
    }

    public function test_in_constraint_throws(): void
    {
        $this->expectException(ValidationException::class);

        Validator::validate(['role' => 'admin'], ['role' => 'required|string|in:pharmacist,technician']);
    }

    public function test_in_constraint_passes(): void
    {
        $result = Validator::validate(['role' => 'pharmacist'], ['role' => 'required|string|in:pharmacist,technician']);

        $this->assertSame('pharmacist', $result['role']);
    }

    public function test_nullable_field_accepts_null(): void
    {
        $result = Validator::validate(['expiry' => null], ['expiry' => 'nullable|date']);

        $this->assertNull($result['expiry']);
    }

    public function test_boolean_cast(): void
    {
        $result = Validator::validate(['controlled' => '1'], ['controlled' => 'required|boolean']);

        $this->assertTrue($result['controlled']);
    }
}