<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $order; // Send the full order object for the Admin Dashboard
    public $orderId;
    public $status;

    public function __construct(Order $order)
    {
        // Load relationships so the Admin sees product names and tables immediately
        $this->order = $order->load(['items.product', 'restaurantTable', 'deliveryPartner']);
        $this->orderId = $order->id;
        $this->status = $order->status;
    }

    /**
     * Broadcast on multiple channels:
     * 1. The specific order channel (for the Customer)
     * 2. The branch-wide channel (for the Admin Live Monitor)
     */
    public function broadcastOn(): array
    {
        return [
            // Channel for the specific Customer
            new Channel('order.' . $this->orderId),
            
            // Channel for the Admin Live Dashboard
            new Channel('branch.' . $this->order->branch_id),
        ];
    }

    public function broadcastAs(): string
    {
        // Using 'order.updated' to match the listener in your Admin Dashboard
        return 'order.updated';
    }

    /**
     * Define exactly what data is sent to the frontend.
     */
    public function broadcastWith(): array
    {
        return [
            'order' => $this->order,
            'status' => $this->status,
            'orderId' => $this->orderId,
        ];
    }
}