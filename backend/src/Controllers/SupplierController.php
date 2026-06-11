<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Request;
use App\Core\Response;
use App\Services\SupplierService;

/**
 * HTTP endpoints for suppliers.
 */
final class SupplierController extends Controller
{
    public function __construct(
        private readonly SupplierService $suppliers = new SupplierService(),
    ) {
    }

    public function index(Request $request): Response
    {
        return Response::ok($this->suppliers->list());
    }

}
