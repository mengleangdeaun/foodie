<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PermissionMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
public function handle(Request $request, Closure $next, string $module, string $action = null): Response
{
    // If only one string was passed (like 'menu.read'), split it manually
    if ($action === null && str_contains($module, '.')) {
        [$module, $action] = explode('.', $module);
    }

    $user = $request->user();

    if (!$user) {
        return response()->json(['message' => 'Unauthenticated.'], 401);
    }

    // Bypass for high-level roles
    if ($user->role === 'owner' || $user->role === 'super_admin') {
        return $next($request);
    }

    // Check keyed object: $user->permissions['menu']['read']
    $permissions = $user->permissions;
    if (isset($permissions[$module][$action]) && $permissions[$module][$action] === true) {
        return $next($request);
    }

    return response()->json([
        'message' => "Forbidden: Missing permission [$module.$action]"
    ], 403);
}
}