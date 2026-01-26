<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        \Illuminate\Support\Facades\Log::info("AppServiceProvider booted! Setting ResetPassword URL.");

        \Illuminate\Auth\Notifications\ResetPassword::createUrlUsing(function (object $notifiable, string $token) {
            return "http://127.0.0.1:8000/reset-password?token={$token}&email={$notifiable->getEmailForPasswordReset()}";
        });
    }
}
