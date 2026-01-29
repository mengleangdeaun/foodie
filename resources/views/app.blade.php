<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, shrink-to-fit=no">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>Foodie - Make your food ordering easy</title>

    <link rel="shortcut icon" href="{{ asset('favicon.png') }}">

    <link href="https://fonts.googleapis.com/css?family=Nunito:400,600,700" rel="stylesheet">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Kantumruy+Pro:wght@300;400;500;600;700&family=Dangrek:wght@300;400;500;700&family=Montserrat:wght@400;500;600;700&family=Moul&family=Open+Sans:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&family=Roboto+Mono:wght@400;500;600;700&family=Roboto:wght@400;500;600;700&display=swap" rel="stylesheet">

    @viteReactRefresh
    @vite(['resources/js/src/main.tsx'])
</head>

<body>
    <noscript>
        <strong>We're sorry but Foodie doesn't work properly without JavaScript enabled. Please enable it to continue.</strong>
    </noscript>

    <div id="root"></div>
</body>

</html>
