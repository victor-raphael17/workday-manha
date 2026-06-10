<?php

declare(strict_types=1);

namespace App\Services;

use App\Repositories\StockMovementRepository;

final class StockMovementService
{
    public function __construct(
        private readonly StockMovementRepository $stockMovements = new StockMovementRepository(),
    ) {
    }

    public function list(): array
    {
        return array_map([$this, 'present'], $this->stockMovements->all());
    }

    private function present(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'medication_id' => (int) $row['medication_id'],
            'medication_name' => $row['medication_name'],
            'sku' => $row['sku'],
            'delta' => (int) $row['delta'],
            'reason' => $row['reason'],
            'created_at' => $row['created_at'],
        ];
    }
}