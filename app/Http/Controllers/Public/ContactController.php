<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
// use App\Mail\ContactFormSubmitted; // Assuming we might want a mailable later

class ContactController extends Controller
{
    /**
     * Handle incoming contact form submission
     */
    public function submit(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:50',
            'subject' => 'nullable|string|max:255',
            'message' => 'required|string',
        ]);

        $submission = \App\Models\ContactSubmission::create($validated);

        return response()->json([
            'message' => 'Thank you for contacting us! We will get back to you soon.',
            'data' => $submission
        ]);
    }

    /**
     * Get list of submissions for Admin
     */
    public function index()
    {
        return response()->json(\App\Models\ContactSubmission::latest()->paginate(20));
    }
}
