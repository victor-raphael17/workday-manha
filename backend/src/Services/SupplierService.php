<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Exceptions\NotFoundException;
use App\Repositories\SupplierRepository;

/**
 * Business logic for suppliers.
 */
final class SupplierService
{
    public function __construct(
        private readonly SupplierRepository $suppliers = new SupplierRepository(),
    ) {
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function list(): array
    {
        return array_map([$this, 'present'], $this->suppliers->all());
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function present(array $row): array
    {
        if ($row === []) {
            return $row;
        }

        return [
            'id'            => (int) $row['id'],
            'name'          => $row['name'],
            'contact_email' => $row['contact_email'],
            'phone'         => $row['phone'],
            'created_at'    => $row['created_at'] ?? null,
            'updated_at'    => $row['updated_at'] ?? null,
        ];
    }
}
