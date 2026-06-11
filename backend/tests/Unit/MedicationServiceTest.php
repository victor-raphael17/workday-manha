<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Core\Exceptions\DomainException;
use App\Core\Exceptions\NotFoundException;
use App\Repositories\MedicationRepository;
use App\Services\MedicationService;
use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\MockObject\MockObject;

final class MedicationServiceTest extends TestCase
{
    private MedicationRepository&MockObject $repo;
    private MedicationService $service;

    protected function setUp(): void
    {
        $this->repo = $this->getMockBuilder(MedicationRepository::class)
            ->disableOriginalConstructor()
            ->getMock();

        $stockMovements = $this->getMockBuilder(\App\Repositories\StockMovementRepository::class)
            ->disableOriginalConstructor()
            ->getMock();

        $this->service = new MedicationService($this->repo, $stockMovements);
    }

    // --- get() ---

    public function test_get_throws_not_found_when_missing(): void
    {
        $this->repo->method('find')->willReturn(null);

        $this->expectException(NotFoundException::class);

        $this->service->get(99);
    }

    public function test_get_returns_presented_medication(): void
    {
        $this->repo->method('find')->willReturn($this->sampleRow());

        $result = $this->service->get(1);

        $this->assertSame(1, $result['id']);
        $this->assertSame('CA-AMX-500', $result['sku']);
        $this->assertArrayHasKey('status', $result);
    }

    // --- adjustStock() ---

    public function test_adjust_stock_throws_not_found_when_missing(): void
    {
        $this->repo->method('find')->willReturn(null);

        $this->expectException(NotFoundException::class);

        $this->service->adjustStock(99, 10);
    }

    public function test_adjust_stock_throws_domain_exception_when_rejected(): void
    {
        $this->repo->method('find')->willReturn($this->sampleRow());
        $this->repo->method('adjustStock')->willReturn(null);

        $this->expectException(DomainException::class);

        $this->service->adjustStock(1, -999);
    }

    public function test_adjust_stock_returns_updated_medication(): void
    {
        $updated = array_merge($this->sampleRow(), ['on_hand' => 60]);

        $this->repo->method('find')->willReturn($this->sampleRow());
        $this->repo->method('adjustStock')->willReturn($updated);

        $result = $this->service->adjustStock(1, 10);

        $this->assertSame(60, $result['on_hand']);
    }

    // --- create() ---

    public function test_create_throws_domain_exception_on_duplicate_sku(): void
    {
        $this->repo->method('findBySku')->willReturn($this->sampleRow());

        $this->expectException(DomainException::class);

        $this->service->create(['sku' => 'CA-AMX-500', 'name' => 'Amoxicillin']);
    }

    // --- deriveStatus via get() ---

    public function test_status_is_out_when_on_hand_is_zero(): void
    {
        $row = array_merge($this->sampleRow(), ['on_hand' => 0]);
        $this->repo->method('find')->willReturn($row);

        $result = $this->service->get(1);

        $this->assertSame('out', $result['status']);
    }

    public function test_status_is_low_when_on_hand_at_reorder_point(): void
    {
        $row = array_merge($this->sampleRow(), ['on_hand' => 10, 'reorder_point' => 10]);
        $this->repo->method('find')->willReturn($row);

        $result = $this->service->get(1);

        $this->assertSame('low', $result['status']);
    }

    public function test_status_is_recalled(): void
    {
        $row = array_merge($this->sampleRow(), ['recalled' => true]);
        $this->repo->method('find')->willReturn($row);

        $result = $this->service->get(1);

        $this->assertSame('recalled', $result['status']);
    }

    public function test_status_is_expired(): void
    {
        $row = array_merge($this->sampleRow(), ['expiry' => '2000-01-01']);
        $this->repo->method('find')->willReturn($row);

        $result = $this->service->get(1);

        $this->assertSame('expired', $result['status']);
    }

    // --- helpers ---

    private function sampleRow(): array
    {
        return [
            'id'             => 1,
            'sku'            => 'CA-AMX-500',
            'name'           => 'Amoxicillin',
            'strength'       => '500mg',
            'form'           => 'Capsule',
            'category'       => 'Antibiotics',
            'on_hand'        => 50,
            'reorder_point'  => 10,
            'price'          => '12.40',
            'expiry'         => '2027-08-12',
            'controlled'     => false,
            'recalled'       => false,
            'created_at'     => '2026-01-01 00:00:00',
            'updated_at'     => '2026-01-01 00:00:00',
        ];
    }
}