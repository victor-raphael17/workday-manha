<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Request;
use App\Core\Response;
use App\Services\StockMovementService;

final class StockMovementController extends Controller
{
    public function __construct(
        private readonly StockMovementService $stockMovements = new StockMovementService(),
    ) {
    }

    public function index(Request $request): Response
    {
        return Response::ok($this->stockMovements->list());
    }
}