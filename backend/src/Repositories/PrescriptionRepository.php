<?php

declare(strict_types=1);

namespace App\Repositories;

/**
 * Data access for prescriptions. Reads join patient and medication so the API
 * can return human-readable names alongside the foreign keys.
 */
final class PrescriptionRepository extends Repository
{
    private const SELECT = 'SELECT
            p.id, p.code, p.patient_id, p.medication_id, p.quantity, p.unit,
            p.prescriber, p.state, p.flag, p.created_at, p.updated_at,
            pt.name AS patient_name, pt.code AS patient_code,
            m.name AS medication_name, m.strength AS medication_strength,
            m.controlled AS medication_controlled
        FROM prescriptions p
        JOIN patients pt ON pt.id = p.patient_id
        JOIN medications m ON m.id = p.medication_id';

    /**
     * @param array{state?: string, patient_id?: int, search?: string} $filters
     * @return array<int, array<string, mixed>>
     */
    public function all(array $filters = [], int $page = 1, int $perPage = 25): array
    {
        $sql = self::SELECT;
        $where = [];
        $bindings = [];

        if (!empty($filters['state'])) {
            $where[] = 'p.state = :state';
            $bindings['state'] = $filters['state'];
        }

        if (!empty($filters['patient_id'])) {
            $where[] = 'p.patient_id = :patient_id';
            $bindings['patient_id'] = $filters['patient_id'];
        }

        if (!empty($filters['search'])) {
            $where[] = '(pt.name ILIKE :search1 OR p.code ILIKE :search2 OR m.name ILIKE :search3)';
            $bindings['search1'] = '%' . $filters['search'] . '%';
            $bindings['search2'] = '%' . $filters['search'] . '%';
            $bindings['search3'] = '%' . $filters['search'] . '%';
        }

        if ($where !== []) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }

        $sql .= ' ORDER BY p.created_at DESC LIMIT :limit OFFSET :offset';

        $total = (int) ($this->fetchOne(
            'SELECT COUNT(*) AS n FROM prescriptions p
             JOIN patients pt ON pt.id = p.patient_id
             JOIN medications m ON m.id = p.medication_id'
            . ($where !== [] ? ' WHERE ' . implode(' AND ', $where) : ''),
            $bindings
        )['n'] ?? 0);

        $offset = ($page - 1) * $perPage;

        return [
            'data'      => $this->fetchAll($sql, $bindings + ['limit' => $perPage, 'offset' => $offset]),
            'total'     => $total,
            'page'      => $page,
            'per_page'  => $perPage,
            'last_page' => (int) ceil($total / $perPage),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    public function find(int $id): ?array
    {
        return $this->fetchOne(self::SELECT . ' WHERE p.id = :id', ['id' => $id]);
    }

    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    public function create(array $data): array
    {
        $sql = 'INSERT INTO prescriptions (code, patient_id, medication_id, quantity, unit, prescriber, state, flag)
                VALUES (:code, :patient_id, :medication_id, :quantity, :unit, :prescriber, :state, :flag)
                RETURNING id';

        $id = (int) ($this->fetchOne($sql, $data)['id'] ?? 0);

        return $this->find($id) ?? [];
    }

    /**
     * @return array<string, mixed>|null
     */
    public function updateState(int $id, string $state): ?array
    {
        $row = $this->fetchOne(
            'UPDATE prescriptions SET state = :state WHERE id = :id RETURNING id',
            ['id' => $id, 'state' => $state]
        );

        return $row === null ? null : $this->find($id);
    }

    /**
     * @return array<string, int> state => count
     */
    public function countsByState(): array
    {
        $rows = $this->fetchAll('SELECT state, COUNT(*) AS total FROM prescriptions GROUP BY state');
        $counts = [];

        foreach ($rows as $row) {
            $counts[(string) $row['state']] = (int) $row['total'];
        }

        return $counts;
    }
}