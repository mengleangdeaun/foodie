<?php 

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use Illuminate\Support\Facades\Http;

class TelegramWebhookController extends Controller
{
    public function handle(Request $request)
    {
        $callback = $request->input('callback_query');
        if (!$callback) return response()->json(['status' => 'no callback']);

        $data = $callback['data']; // e.g., "confirm_12"
        $chatId = $callback['message']['chat']['id'];
        $messageId = $callback['message']['message_id'];
        $originalText = $callback['message']['text'];

        if (str_starts_with($data, 'confirm_')) {
            $orderId = str_replace('confirm_', '', $data);
            $order = Order::find($orderId);

            if ($order && $order->status === 'pending') {
                $order->update(['status' => 'confirmed']);

                event(new \App\Events\OrderStatusUpdated($order));

                // 1. Update the Telegram message UI (Remove buttons, show confirmed)
                $this->updateTelegramMessage($order->branch, $chatId, $messageId, $originalText, "✅ Confirmed by Chef");

                // 2. Here is where you would trigger the feedback to the customer
                // (e.g., via Pusher/WebSockets)
            }
        }

        return response()->json(['status' => 'success']);
    }

    private function updateTelegramMessage($branch, $chatId, $messageId, $text, $statusText)
    {
        Http::post("https://api.telegram.org/bot{$branch->telegram_bot_token}/editMessageText", [
            'chat_id' => $chatId,
            'message_id' => $messageId,
            'text' => $text . "\n\n" . $statusText,
            'parse_mode' => 'Markdown'
        ]);
    }
}