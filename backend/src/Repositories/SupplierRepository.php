<?php

declare(strict_types=1);

namespace App\Repositories;

/**
 * Data access for suppliers.
 */
final class SupplierRepository extends Repository
{
    private const COLUMNS = 'id, name, contact_email, phone, created_at, updated_at';

    /**
     * @return array<int, array<string, mixed>>
     */
    public function all(): array
    {
        return $this->fetchAll('SELECT ' . self::COLUMNS . ' FROM suppliers ORDER BY name ASC');
    }

    public function find(int $id): ?array
    {
        return $this->fetchOne(
            'SELECT id, name, contact_email, phone, created_at, updated_at
            FROM suppliers
            WHERE id = :id',
            ['id' => $id]
        ) ?: null;
    }
}
