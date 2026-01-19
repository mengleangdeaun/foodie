<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use App\Models\Order;

class TelegramService
{
    /**
     * Parses the remark string into structured sections for the chef.
     */
/**
 * Parses the remark string into structured sections for the chef.
 */
private function formatRemarkForChef($remark)
{
    if (!$remark) return ['size' => '', 'details' => ''];

    // 1. Extract Size (e.g., [Size: ចានតូច])
    $size = '';
    if (preg_match('/\[Size:\s*([^\]]+)\]/i', $remark, $sizeMatch)) {
        $size = " [" . trim($sizeMatch[1]) . "]";
        $remark = str_replace($sizeMatch[0], '', $remark);
    }

    // 2. Extract Additions (e.g., + Egg + Vige)
    // Captures everything after '+' until the next '[' or end of string
    $adds = [];
    if (preg_match('/\+\s*([^\[]+)/', $remark, $addMatches)) {
        // Split by comma in case of multiple modifiers, keeping "Egg + Vige" together
        $adds = array_map('trim', explode(',', $addMatches[1]));
        $remark = str_replace($addMatches[0], '', $remark);
    }

    // 3. Extract Presets (e.g., [Sugar Level: 70 %])
    $presets = [];
    if (preg_match_all('/\[([^\]]+)\]/', $remark, $presetMatches)) {
        $presets = array_map('trim', $presetMatches[1]);
        foreach ($presetMatches[0] as $match) {
            $remark = str_replace($match, '', $remark);
        }
    }

    // 4. Remaining text is the Manual Note (e.g., អត់យកបន្លែ)
    $note = trim($remark);

    // Build the formatted details
    $details = "";
    if (!empty($adds)) {
        $details .= "\n➕ Add: " . implode(', ', $adds);
    }
    if (!empty($presets)) {
        $details .= "\n⚙️ " . implode(' | ', $presets);
    }
    if ($note) {
        $details .= "\n⚠️ *NOTE: {$note}*";
    }

    return ['size' => $size, 'details' => $details];
}

    public function sendOrderNotification(Order $order)
    {
        $branch = $order->branch;

        if (!$branch->telegram_bot_token || !$branch->telegram_chat_id) {
            return false;
        }

        $url = "https://api.telegram.org/bot{$branch->telegram_bot_token}/sendMessage";
        
        $tableDisplay = $order->restaurantTable?->table_number ?? 'Delivery/Takeaway';

        $message = "🔔 *NEW ORDER: {$tableDisplay}*\n";
        $message .= "━━━━━━━━━━━━━━━━━━━━\n";
        
        foreach ($order->items as $item) {
            $parsed = $this->formatRemarkForChef($item->remark);
            
            // 📦 1x Product Name [Size]
            $message .= "📦 {$item->quantity}x *{$item->product->name}*{$parsed['size']}\n";
            
            // Show Additions, Presets, and Notes
            if ($parsed['details']) {
                $message .= "{$parsed['details']}\n";
            }
            $message .= "━━━━━━━━━━━━━━━━━━━━\n";
        }
        
        $message .= "💰 *Total: \${$order->total}*";

        $keyboard = [
            'inline_keyboard' => [[
                ['text' => '✅ Confirm', 'callback_data' => "confirm_{$order->id}"],
                ['text' => '❌ Cancel', 'callback_data' => "cancel_{$order->id}"]
            ]]
        ];

        $payload = [
            'chat_id' => $branch->telegram_chat_id,
            'text' => $message,
            'parse_mode' => 'Markdown',
            'reply_markup' => json_encode($keyboard)
        ];

        if ($branch->telegram_topic_id) {
            $payload['message_thread_id'] = $branch->telegram_topic_id;
        }

        return Http::post($url, $payload);
    }
}