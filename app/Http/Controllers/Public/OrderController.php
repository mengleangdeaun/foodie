<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\RestaurantTable;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\BranchProduct;
use App\Models\BranchProductSize;
use App\Models\Modifier;
use App\Models\Size;
use App\Services\TelegramService;
use Illuminate\Support\Facades\DB;
use App\Events\NewOrderRegistered;

class OrderController extends Controller
{
    public function store(Request $request, $token, TelegramService $telegram)
    {
        $table = RestaurantTable::where('qr_code_token', $token)->firstOrFail();
        $branch = $table->branch;

        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.size_id' => 'nullable|exists:sizes,id', // Changed from selected_size
            'items.*.selected_modifiers' => 'nullable|array',
            'items.*.remark' => 'nullable|string|max:255',
        ]);

        return DB::transaction(function () use ($validated, $branch, $table, $telegram) {
            $subtotal = 0;
            $itemDiscountTotal = 0;
            
            $taxRate = $branch->tax_rate ?? 0.00;
            $taxIsActive = $branch->tax_is_active ?? true;
            $taxAmount = 0;

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
                'tax_amount' => 0
            ]);

            foreach ($validated['items'] as $item) {
                $product = Product::findOrFail($item['product_id']);
                $branchProduct = BranchProduct::where('branch_id', $branch->id)
                    ->where('product_id', $product->id)
                    ->first();
                
                if (!$branchProduct || !$branchProduct->is_available) {
                    throw new \Exception("Product '{$product->name}' is not available in this branch");
                }
                
                // Initialize variables with product-level values
                $basePrice = $product->base_price;
                $originalProductPrice = $product->base_price;
                $discountPercentage = 0;
                $hasActiveDiscount = false;
                $appliedDiscountType = 'product';
                $branchProductSize = null;
                $sizeId = $item['size_id'] ?? null;
                $sizeName = null;
                $branchProductSizeId = null;
                
                // Apply branch product overrides
                if ($branchProduct->branch_price !== null) {
                    $basePrice = $branchProduct->branch_price;
                    $originalProductPrice = $branchProduct->branch_price;
                }
                
                if ($branchProduct->has_active_discount && $branchProduct->discount_percentage > 0) {
                    $discountPercentage = $branchProduct->discount_percentage;
                    $hasActiveDiscount = true;
                    $appliedDiscountType = 'branch_product';
                }
                
                // Apply size-specific overrides if size is selected
                if ($sizeId) {
                    $branchProductSize = BranchProductSize::where('branch_product_id', $branchProduct->id)
                        ->where('size_id', $sizeId)
                        ->first();
                    
                    if ($branchProductSize) {
                        if (!$branchProductSize->is_available) {
                            throw new \Exception("Selected size is not available for this product");
                        }
                        
                        // Use size-specific price if available
                        if ($branchProductSize->branch_size_price !== null) {
                            $basePrice = $branchProductSize->branch_size_price;
                            $originalProductPrice = $branchProductSize->branch_size_price;
                        }
                        
                        // Size discount overrides everything
                        if ($branchProductSize->is_discount_active && $branchProductSize->discount_percentage > 0) {
                            $discountPercentage = $branchProductSize->discount_percentage;
                            $hasActiveDiscount = true;
                            $appliedDiscountType = 'branch_product_size';
                        } else {
                            // If size discount is inactive, NO discount should be applied
                            $hasActiveDiscount = false;
                            $discountPercentage = 0;
                        }
                        
                        $branchProductSizeId = $branchProductSize->id;
                        $size = Size::find($sizeId);
                        $sizeName = $size ? $size->name : null;
                    }
                }
                
                // Calculate modifiers total price
                $modifierTotalPrice = 0;
                $selectedModifiersData = [];
                
                if (!empty($item['selected_modifiers'])) {
                    foreach ($item['selected_modifiers'] as $modifierId) {
                        $modifier = Modifier::find($modifierId);
                        if ($modifier && $modifier->is_available) {
                            $modifierTotalPrice += $modifier->price;
                            $selectedModifiersData[] = [
                                'id' => $modifier->id,
                                'name' => $modifier->name,
                                'price' => $modifier->price
                            ];
                        }
                    }
                }
                
                // Calculate item subtotal and discount
                $itemSubtotal = ($basePrice + $modifierTotalPrice) * $item['quantity'];
                $itemDiscount = 0;
                
                // Only apply discount if it's active
                if ($hasActiveDiscount && $discountPercentage > 0) {
                    // Apply discount to base price only (not modifiers)
                    $itemDiscount = ($basePrice * ($discountPercentage / 100)) * $item['quantity'];
                }
                
                $itemFinalPrice = $itemSubtotal - $itemDiscount;
                $finalUnitPrice = $itemFinalPrice / $item['quantity'];
                
                // Build kitchen remark
                $customizationParts = [];
                
                if ($sizeName) {
                    $customizationParts[] = "[Size: $sizeName]";
                }
                
                if (!empty($selectedModifiersData)) {
                    $modifierNames = array_column($selectedModifiersData, 'name');
                    $customizationParts[] = "+ " . implode(', ', $modifierNames);
                }
                
                $customizationString = implode(' ', $customizationParts);
                $finalRemark = trim($customizationString . ' ' . ($item['remark'] ?? ''));
                
                // Create order item with size information
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'branch_product_size_id' => $branchProductSizeId,
                    'size_id' => $sizeId,
                    'size_name' => $sizeName,
                    'base_price' => $basePrice,
                    'original_product_price' => $originalProductPrice,
                    'modifier_total_price' => $modifierTotalPrice,
                    'item_discount_amount' => $itemDiscount,
                    'applied_discount_percentage' => $discountPercentage,
                    'applied_discount_type' => $appliedDiscountType,
                    'final_unit_price' => $finalUnitPrice,
                    'quantity' => $item['quantity'],
                    'selected_modifiers' => !empty($selectedModifiersData) ? json_encode($selectedModifiersData) : null,
                    'remark' => $finalRemark
                ]);
                
                // Update order totals
                $subtotal += $itemSubtotal;
                $itemDiscountTotal += $itemDiscount;
            }
            
            // Calculate tax and totals
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
    }

    
}