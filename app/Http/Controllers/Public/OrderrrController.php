// --- Generate unique order_code ---
$today = now()->startOfDay();
$yearDigit = now()->format('y')[1]; // Last digit of year
$months = ['A','B','C','D','E','F','G','H','I','J','K','L'];
$monthLetter = $months[intval(now()->format('m')) - 1]; 
$day = now()->format('d');

$maxRetries = 1000; // safety limit
$seq = 1;
$orderCode = '';

for ($i = 0; $i < $maxRetries; $i++) {
    $seqFormatted = str_pad($seq, 3, '0', STR_PAD_LEFT);
    $orderCodeCandidate = "($yearDigit$monthLetter$day$seqFormatted)";

    // Check uniqueness
    if (!Order::where('order_code', $orderCodeCandidate)->exists()) {
        $orderCode = $orderCodeCandidate;
        break;
    }
    $seq++;
}

if (!$orderCode) {
    throw new \Exception("Unable to generate unique order code for today.");
}

// --- Create order ---
$order = Order::create([
    'branch_id' => $branch->id,
    'restaurant_table_id' => $table->id,
    'order_type' => 'walk_in',
    'status' => 'pending',
    'subtotal' => 0,
    'item_discount_total' => 0,
    'order_level_discount' => 0,
    'delivery_partner_discount' => 0,
    'order_discount_amount' => 0,
    'tax_rate' => $taxRate,
    'tax_amount' => 0,
    'order_code' => $orderCode,
]);



return DB::transaction(function () use ($validated, $branch, $table, $telegram) {
    $subtotal = 0;
    $itemDiscountTotal = 0;
    
    $taxRate = $branch->tax_rate ?? 0.00;
    $taxIsActive = $branch->tax_is_active ?? true;
    $taxAmount = 0;

    // --- Generate order_code ---
    $today = now()->startOfDay();
    
    // Daily sequence
    $dailySequence = Order::whereDate('created_at', $today)->count() + 1;

    // Year last digit
    $yearDigit = now()->format('y')[1]; // '26' -> '6'

    // Month to letter
    $months = ['A','B','C','D','E','F','G','H','I','J','K','L'];
    $monthLetter = $months[intval(now()->format('m')) - 1]; // Jan=0 -> A

    // Day
    $day = now()->format('d'); // e.g., 19

    // Sequence formatted as 3 digits
    $seq = str_pad($dailySequence, 3, '0', STR_PAD_LEFT);

    $orderCode = "($yearDigit$monthLetter$day$seq)";

    // --- Create order ---
    $order = Order::create([
        'branch_id' => $branch->id,
        'restaurant_table_id' => $table->id,
        'order_type' => 'walk_in',
        'status' => 'pending',
        'subtotal' => 0,
        'item_discount_total' => 0,
        'order_level_discount' => 0,
        'delivery_partner_discount' => 0,
        'order_discount_amount' => 0,
        'tax_rate' => $taxRate,
        'tax_amount' => 0,
        'order_code' => $orderCode, // <-- store formatted code
    ]);

    // --- existing item processing logic ---
    foreach ($validated['items'] as $item) {
        // ... your current item logic unchanged ...
    }

    // --- update order totals ---
    $orderLevelDiscount = 0;
    $deliveryPartnerDiscount = 0;
    $totalDiscount = $itemDiscountTotal;
    $taxableAmount = $subtotal - $totalDiscount;
    
    if ($taxIsActive && $taxRate > 0) {
        $taxAmount = $taxableAmount * ($taxRate / 100);
    }
    
    $total = $taxableAmount + $taxAmount;
    
    $order->update([
        'subtotal' => $subtotal,
        'item_discount_total' => $itemDiscountTotal,
        'order_level_discount' => $orderLevelDiscount,
        'delivery_partner_discount' => $deliveryPartnerDiscount,
        'order_discount_amount' => $totalDiscount,
        'tax_amount' => $taxAmount,
        'tax_rate' => $taxRate
    ]);
    
    $order->load(['items.product', 'restaurantTable', 'branch']);
    $telegram->sendOrderNotification($order);
    broadcast(new NewOrderRegistered($order))->toOthers();
    
    return response()->json([
        'message' => 'Order placed successfully!',
        'order_id' => $order->id,
        'order_code' => $orderCode, // <-- return formatted code
        'order_total' => $total,
        'subtotal' => $subtotal,
        'item_discount_total' => $itemDiscountTotal,
        'order_level_discount' => $orderLevelDiscount,
        'delivery_partner_discount' => $deliveryPartnerDiscount,
        'total_discount' => $totalDiscount,
        'tax' => $taxAmount,
        'tax_rate' => $taxRate
    ]);
});
