<!DOCTYPE html>
<html>

<head>
    <title>Account Approved</title>
</head>

<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50;">Welcome to Foodie!</h2>
        <p>Dear {{ $owner->name }},</p>
        <p>We are pleased to inform you that your restaurant account has been <strong>approved</strong>.</p>
        <p>You can now log in to your dashboard and start managing your restaurant.</p>
        <p>
            <a href="{{ url('/login') }}"
                style="display: inline-block; padding: 10px 20px; background-color: #3490dc; color: #ffffff; text-decoration: none; border-radius: 5px;">Login
                to Dashboard</a>
        </p>
        <p>If you have any questions, please feel free to contact our support team.</p>
        <p>Best regards,<br>The Foodie Team</p>
    </div>
</body>

</html>