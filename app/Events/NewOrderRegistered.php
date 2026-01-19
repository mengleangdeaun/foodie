<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewOrderRegistered implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * The order instance.
     */
    public $order;

    /**
     * Create a new event instance.
     * * We eager-load relationships here so the frontend (Chef/Admin) 
     * gets product names and table numbers immediately.
     */
    public function __construct(Order $order)
    {
        $this->order = $order->load(['items.product', 'restaurantTable', 'user']);
    }

    /**
     * Get the channels the event should broadcast on.
     * * Both the KDS and Order Management listen to the branch channel.
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('branch.' . $this->order->branch_id),
        ];
    }

    /**
     * The event's broadcast name.
     * * This allows us to use .listen('.order.created', ...) in React.
     */
    public function broadcastAs(): string
    {
        return 'order.created';
    }
}