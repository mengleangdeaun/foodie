module.exports = {
    content: ["./resources/**/*.blade.php", "./resources/**/*.{js,ts,jsx,tsx}"],
    darkMode: "class",
    theme: {
    	container: {
    		center: true
    	},
    	extend: {
    		colors: {
    			primary: {
    				DEFAULT: 'hsl(var(--primary))',
					// light: '#4361ee',
    				light: '#eaf1ff',
    				'dark-light': 'rgba(67,97,238,.15)',
    				foreground: 'hsl(var(--primary-foreground))'
    			},
    			secondary: {
    				DEFAULT: 'hsl(var(--secondary))',
    				light: '#ebe4f7',
    				'dark-light': 'rgb(128 93 202 / 15%)',
    				foreground: 'hsl(var(--secondary-foreground))'
    			},
    			success: {
    				DEFAULT: '#00ab55',
    				light: '#ddf5f0',
    				'dark-light': 'rgba(0,171,85,.15)'
    			},
    			danger: {
    				DEFAULT: '#e7515a',
    				light: '#fff5f5',
    				'dark-light': 'rgba(231,81,90,.15)'
    			},
    			warning: {
    				DEFAULT: '#e2a03f',
    				light: '#fff9ed',
    				'dark-light': 'rgba(226,160,63,.15)'
    			},
    			info: {
    				DEFAULT: '#2196f3',
    				light: '#e7f7ff',
    				'dark-light': 'rgba(33,150,243,.15)'
    			},
    			dark: {
    				DEFAULT: '#3b3f5c',
    				light: '#eaeaec',
    				'dark-light': 'rgba(59,63,92,.15)'
    			},
    			black: {
    				DEFAULT: '#0e1726',
    				light: '#e3e4eb',
    				'dark-light': 'rgba(14,23,38,.15)'
    			},
    			white: {
    				DEFAULT: '#ffffff',
    				light: '#e0e6ed',
    				dark: '#888ea8'
    			},
    			background: 'hsl(var(--background))',
    			foreground: 'hsl(var(--foreground))',
    			card: {
    				DEFAULT: 'hsl(var(--card))',
    				foreground: 'hsl(var(--card-foreground))'
    			},
    			popover: {
    				DEFAULT: 'hsl(var(--popover))',
    				foreground: 'hsl(var(--popover-foreground))'
    			},
    			muted: {
    				DEFAULT: 'hsl(var(--muted))',
    				foreground: 'hsl(var(--muted-foreground))'
    			},
    			accent: {
    				DEFAULT: 'hsl(var(--accent))',
    				foreground: 'hsl(var(--accent-foreground))'
    			},
    			destructive: {
    				DEFAULT: 'hsl(var(--destructive))',
    				foreground: 'hsl(var(--destructive-foreground))'
    			},
    			border: 'hsl(var(--border))',
    			input: 'hsl(var(--input))',
    			ring: 'hsl(var(--ring))',
    			chart: {
    				'1': 'hsl(var(--chart-1))',
    				'2': 'hsl(var(--chart-2))',
    				'3': 'hsl(var(--chart-3))',
    				'4': 'hsl(var(--chart-4))',
    				'5': 'hsl(var(--chart-5))'
    			}
    		},
    		fontFamily: {
    			nunito: [
    				'Nunito',
    				'sans-serif'
    			],
				sans: ['system-ui', '-apple-system', 'sans-serif'],
        serif: ['Georgia', 'serif'],
        mono: ['monospace'],
        // Custom font classes
        'font-sans': ['system-ui', '-apple-system', 'sans-serif'],
        'font-inter': ['Inter', 'system-ui', 'sans-serif'],
        'font-roboto': ['Roboto', 'system-ui', 'sans-serif'],
        'font-opensans': ['Open Sans', 'system-ui', 'sans-serif'],
        'font-montserrat': ['Montserrat', 'system-ui', 'sans-serif'],
        'font-poppins': ['Poppins', 'system-ui', 'sans-serif'],
        'font-serif': ['Georgia', 'serif'],
        'font-times': ['Times New Roman', 'serif'],
        'font-georgia': ['Georgia', 'serif'],
        'font-playfair': ['Playfair Display', 'serif'],
        'font-mono': ['monospace'],
        'font-robotomono': ['Roboto Mono', 'monospace'],
        'font-kantumruy': ['Kantumruy Pro', 'sans-serif'],
        'font-moul': ['Moul', 'serif'],
    		},
    		spacing: {
    			'4.5': '18px'
    		},
    		boxShadow: {
    			'3xl': '0 2px 2px rgb(224 230 237 / 46%), 1px 6px 7px rgb(224 230 237 / 46%)'
    		},
    		typography: '({ theme }) => ({\n                DEFAULT: {\n                    css: {\n                        "--tw-prose-invert-headings":\n                            theme("colors.white.dark"),\n                        "--tw-prose-invert-links": theme("colors.white.dark"),\n                        h1: {\n                            fontSize: "40px",\n                            marginBottom: "0.5rem",\n                            marginTop: 0,\n                        },\n                        h2: {\n                            fontSize: "32px",\n                            marginBottom: "0.5rem",\n                            marginTop: 0,\n                        },\n                        h3: {\n                            fontSize: "28px",\n                            marginBottom: "0.5rem",\n                            marginTop: 0,\n                        },\n                        h4: {\n                            fontSize: "24px",\n                            marginBottom: "0.5rem",\n                            marginTop: 0,\n                        },\n                        h5: {\n                            fontSize: "20px",\n                            marginBottom: "0.5rem",\n                            marginTop: 0,\n                        },\n                        h6: {\n                            fontSize: "16px",\n                            marginBottom: "0.5rem",\n                            marginTop: 0,\n                        },\n                        p: { marginBottom: "0.5rem" },\n                        li: { margin: 0 },\n                        img: { margin: 0 },\n                    },\n                },\n            })',
    		borderRadius: {
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)'
    		}
    	}
    },
    plugins: [
        require("@tailwindcss/forms")({
            strategy: "class",
        }),
        require("@tailwindcss/typography"),
        require("tailwindcss-animate")
    ],
};
