<?php

declare(strict_types=1);

namespace App\Repositories;
class StockMovementRepository extends Repository
{
    public function create(int $medicationId, int $delta, ?string $reason): void
    {
        $this->execute(
            'INSERT INTO stock_movements (medication_id, delta, reason)
             VALUES (:medication_id, :delta, :reason)',
            [
                'medication_id' => $medicationId,
                'delta' => $delta,
                'reason' => $reason,
            ]
        );
    }

    public function all(): array
    {
        return $this->fetchAll(
            'SELECT
                sm.id,
                sm.medication_id,
                m.name AS medication_name,
                m.sku,
                sm.delta,
                sm.reason,
                sm.created_at
             FROM stock_movements sm
             INNER JOIN medications m ON m.id = sm.medication_id
             ORDER BY sm.created_at DESC'
        );
    }
}