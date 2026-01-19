<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\ReceiptSetting;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ReceiptPrintController extends Controller
{
    /**
     * Print receipt for a specific order
     */
    public function printReceipt($orderId)
    {
        // Get the order with all necessary relationships
        $order = Order::with([
            'items.product',
            'user',
            'restaurantTable',
            'deliveryPartner',
            'creator'
        ])->findOrFail($orderId);

        // Verify the order belongs to the user's branch
        if ($order->branch_id !== auth()->user()->branch_id) {
            abort(403, 'Unauthorized to view this order');
        }

        // Get receipt settings for the branch
        $receiptSettings = ReceiptSetting::where('branch_id', $order->branch_id)->first();

        // Get branch details for tax and address
        $branch = Branch::find($order->branch_id);

        // Prepare order data for receipt
        $receiptData = [
            'id' => $order->id,
            'total' => number_format($order->total, 2),
            'subtotal' => number_format($order->subtotal ?? $order->total, 2),
            'tax' => number_format($order->tax ?? 0, 2),
            'delivery_fee' => $order->delivery_fee ? number_format($order->delivery_fee, 2) : null,
            'table_number' => $order->restaurantTable?->table_number,
            'order_type' => $order->order_type,
            'payment_method' => $order->payment_method,
            'payment_status' => $order->payment_status,
            'customer_name' => $order->customer_name,
            'phone' => $order->phone,
            'created_at' => $order->created_at,
            'items' => $order->items->map(function ($item) {
                return [
                    'id' => $item->id,
                    'quantity' => $item->quantity,
                    'total' => number_format($item->total, 2),
                    'product' => [
                        'name' => $item->product->name,
                        'price' => number_format($item->product->price, 2),
                    ]
                ];
            }),
            'branch' => [
                'branch_name' => $branch->branch_name,
                'location' => $branch->location,
                'contact_phone' => $branch->contact_phone,
                'tax_name' => $branch->tax_name,
                'tax_is_active' => $branch->tax_is_active,
                'tax_rate' => $branch->tax_rate,
            ]
        ];

        return response()->json([
            'success' => true,
            'order' => $receiptData,
            'receipt_settings' => $receiptSettings,
            'print_data' => [
                'order_number' => $order->id,
                'date' => $order->created_at->format('Y-m-d H:i:s'),
                'total_amount' => $order->total,
                'status' => $order->status,
            ]
        ]);
    }

    /**
     * Print receipt directly (for thermal printers)
     * This endpoint can be called by the thermal printer
     */
    public function printThermalReceipt($orderId)
    {
        $order = Order::with(['items.product', 'restaurantTable'])
                     ->findOrFail($orderId);

        // Verify branch ownership
        if ($order->branch_id !== auth()->user()->branch_id) {
            abort(403, 'Unauthorized');
        }

        $receiptSettings = ReceiptSetting::where('branch_id', $order->branch_id)->first();
        $branch = Branch::find($order->branch_id);

        // Generate ESC/POS receipt commands
        $receipt = $this->generateESCPOSReceipt($order, $receiptSettings, $branch);

        return response($receipt)
            ->header('Content-Type', 'text/plain')
            ->header('Content-Length', strlen($receipt));
    }

    /**
     * Generate ESC/POS formatted receipt for thermal printers
     */
    private function generateESCPOSReceipt($order, $settings, $branch)
    {
        $receipt = "";
        
        // Initialize printer
        $receipt .= chr(27) . "@"; // Reset printer
        $receipt .= chr(27) . "!" . chr(1); // Select emphasized mode
        
        // Store name
        $storeName = $settings->store_name ?? $branch->branch_name;
        $receipt .= $this->centerText($storeName) . "\n";
        
        $receipt .= chr(27) . "!" . chr(0); // Cancel emphasized mode
        
        // Branch info
        if ($branch->location) {
            $receipt .= $this->centerText($branch->location) . "\n";
        }
        if ($branch->contact_phone) {
            $receipt .= $this->centerText("Tel: " . $branch->contact_phone) . "\n";
        }
        
        $receipt .= str_repeat("-", 32) . "\n";
        
        // Order info
        $receipt .= "Order #: " . $order->id . "\n";
        $receipt .= "Date: " . $order->created_at->format('Y-m-d H:i') . "\n";
        
        if ($order->table_number) {
            $receipt .= "Table: " . $order->table_number . "\n";
        }
        
        if ($order->customer_name) {
            $receipt .= "Customer: " . $order->customer_name . "\n";
        }
        
        $receipt .= str_repeat("-", 32) . "\n";
        
        // Items header
        $receipt .= "Qty Description        Amount\n";
        $receipt .= str_repeat("-", 32) . "\n";
        
        // Items
        foreach ($order->items as $item) {
            $name = substr($item->product->name, 0, 18);
            $qty = str_pad($item->quantity, 3, " ", STR_PAD_LEFT);
            $amount = str_pad(number_format($item->total, 2), 8, " ", STR_PAD_LEFT);
            $receipt .= "{$qty} {$name}{$amount}\n";
        }
        
        $receipt .= str_repeat("-", 32) . "\n";
        
        // Totals
        $receipt .= "Subtotal:" . str_pad(number_format($order->subtotal ?? $order->total, 2), 23, " ", STR_PAD_LEFT) . "\n";
        
        if ($branch->tax_is_active && $branch->tax_rate > 0) {
            $taxAmount = ($order->subtotal ?? $order->total) * ($branch->tax_rate / 100);
            $receipt .= "{$branch->tax_name} ({$branch->tax_rate}%):" . 
                       str_pad(number_format($taxAmount, 2), 15, " ", STR_PAD_LEFT) . "\n";
        }
        
        if ($order->delivery_fee) {
            $receipt .= "Delivery:" . str_pad(number_format($order->delivery_fee, 2), 23, " ", STR_PAD_LEFT) . "\n";
        }
        
        $receipt .= "TOTAL:" . str_pad(number_format($order->total, 2), 27, " ", STR_PAD_LEFT) . "\n";
        
        $receipt .= str_repeat("-", 32) . "\n";
        
        // Payment info
        $receipt .= "Payment: " . strtoupper($order->payment_method) . "\n";
        $receipt .= "Status: " . strtoupper($order->payment_status) . "\n";
        
        $receipt .= "\n" . $this->centerText("Thank you for your visit!") . "\n";
        
        // Footer text
        if ($settings && $settings->footer_text) {
            $receipt .= $this->centerText($settings->footer_text) . "\n";
        }
        
        // Cut paper (partial cut)
        $receipt .= "\n\n\n\n"; // Add some blank lines
        $receipt .= chr(29) . "V" . chr(66) . chr(0); // Partial cut
        
        return $receipt;
    }
    
    private function centerText($text, $width = 32)
    {
        $textLength = strlen($text);
        $padding = max(0, floor(($width - $textLength) / 2));
        return str_repeat(" ", $padding) . $text;
    }

    /**
     * Get receipt settings for printing
     */
    public function getReceiptSettings()
    {
        $branchId = auth()->user()->branch_id;
        $settings = ReceiptSetting::where('branch_id', $branchId)->first();
        $branch = Branch::find($branchId);

        return response()->json([
            'settings' => $settings,
            'branch' => [
                'branch_name' => $branch->branch_name,
                'location' => $branch->location,
                'contact_phone' => $branch->contact_phone,
                'tax_name' => $branch->tax_name,
                'tax_is_active' => $branch->tax_is_active,
                'tax_rate' => $branch->tax_rate,
            ]
        ]);
    }

    /**
     * Batch print multiple orders
     */
    public function batchPrint(Request $request)
    {
        $request->validate([
            'order_ids' => 'required|array',
            'order_ids.*' => 'exists:orders,id'
        ]);

        $printedOrders = [];
        foreach ($request->order_ids as $orderId) {
            $order = Order::find($orderId);
            
            // Verify branch ownership
            if ($order->branch_id !== auth()->user()->branch_id) {
                continue;
            }
            
            $printedOrders[] = [
                'id' => $order->id,
                'status' => $order->status,
                'total' => $order->total,
            ];
        }

        return response()->json([
            'success' => true,
            'message' => 'Receipts sent to printer',
            'printed_orders' => $printedOrders,
            'count' => count($printedOrders)
        ]);
    }
}