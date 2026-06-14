<?php

/**
 * API route table.
 *
 * Returns a closure that registers every route on the given Router. Handlers
 * are [ControllerClass, method] pairs — the router instantiates the controller
 * and calls the method with the captured Request.
 */

declare(strict_types=1);

use App\Controllers\AuthController;
use App\Controllers\DashboardController;
use App\Controllers\HealthController;
use App\Controllers\MedicationController;
use App\Controllers\PatientController;
use App\Controllers\PrescriptionController;
use App\Controllers\PurchaseOrderController;
use App\Controllers\SaleController;
use App\Controllers\StockMovementController;
use App\Controllers\SupplierController;
use App\Core\Router;

return static function (Router $r): void {
    // Públicas — sem token
    $r->get('/', [HealthController::class, 'index']);
    $r->get('/health', [HealthController::class, 'health']);
    $r->post('/api/auth/login', [AuthController::class, 'login']);

    // Protegidas — exige token válido em todas abaixo
    $r->middleware('auth', function (Router $r): void {

        //Recovered from wrong merge
        $r->get('/api/auth/me', [AuthController::class, 'me']);
        $r->post('/api/auth/logout', [AuthController::class, 'logout']);

        // Stock Movements
        $r->get('/api/stock-movements', [StockMovementController::class, 'index']);

        // Dashboard
        $r->get('/api/dashboard', [DashboardController::class, 'summary']);

        // Medications / inventory
        $r->get('/api/medications', [MedicationController::class, 'index']);
        $r->get('/api/medications/categories', [MedicationController::class, 'categories']);
        $r->get('/api/medications/low-stock', [MedicationController::class, 'lowStock']);
        $r->get('/api/medications/expiring', [MedicationController::class, 'expiring']);
        $r->post('/api/medications', [MedicationController::class, 'store']);
        $r->get('/api/medications/{id}', [MedicationController::class, 'show']);
        $r->put('/api/medications/{id}', [MedicationController::class, 'update']);
        $r->patch('/api/medications/{id}', [MedicationController::class, 'update']);
        $r->post('/api/medications/{id}/stock', [MedicationController::class, 'adjustStock']);
        $r->delete('/api/medications/{id}', [MedicationController::class, 'destroy']);

    // Medications / inventory ----------------------------------------------
    $r->get('/api/medications', [MedicationController::class, 'index']);
    $r->get('/api/medications/categories', [MedicationController::class, 'categories']);
    $r->get('/api/medications/low-stock', [MedicationController::class, 'lowStock']);
    $r->get('/api/medications/expiring', [MedicationController::class, 'expiring']);
    $r->post('/api/medications', [MedicationController::class, 'store']);
    $r->get('/api/medications/{id}', [MedicationController::class, 'show']);
    $r->post('/api/medications/{id}/stock', [MedicationController::class, 'adjustStock']);

    // Patients --------------------------------------------------------------
    $r->get('/api/patients', [PatientController::class, 'index']);
    $r->post('/api/patients', [PatientController::class, 'store']);
    $r->get('/api/patients/{id}', [PatientController::class, 'show']);

        // Suppliers
        $r->get('/api/suppliers', [SupplierController::class, 'index']);

        // Prescriptions
        $r->get('/api/prescriptions', [PrescriptionController::class, 'index']);
        $r->post('/api/prescriptions', [PrescriptionController::class, 'store']);
        $r->get('/api/prescriptions/{id}', [PrescriptionController::class, 'show']);
        $r->patch('/api/prescriptions/{id}/state', [PrescriptionController::class, 'transition']);

        // Purchase orders
        $r->get('/api/purchase-orders', [PurchaseOrderController::class, 'index']);
        $r->post('/api/purchase-orders', [PurchaseOrderController::class, 'store']);
        $r->get('/api/purchase-orders/{id}', [PurchaseOrderController::class, 'show']);
        $r->patch('/api/purchase-orders/{id}/state', [PurchaseOrderController::class, 'transition']);
    });
};