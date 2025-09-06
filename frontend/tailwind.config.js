/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class', // چالاککردنی دۆخی تاریک
  theme: {
    extend: {
      colors: {
        'bg-main': 'var(--bg-main)',
        'bg-sidebar': 'var(--bg-sidebar)',
        'bg-content': 'var(--bg-content)',
        'bg-card': 'var(--bg-card)',
        'bg-input': 'var(--bg-input)',
        'bg-hover': 'var(--bg-hover)',
        'bg-selected': 'var(--bg-selected)',
        'bg-code': 'var(--bg-code)',
        'text-main': 'var(--text-main)',
        'text-muted': 'var(--text-muted)',
        'text-dark': 'var(--text-dark)',
        'accent-primary': 'var(--accent-primary)',
        'accent-secondary': 'var(--accent-secondary)',
        'accent-tertiary': 'var(--accent-tertiary)',
        'accent-success': 'var(--accent-success)',
        'accent-danger': 'var(--accent-danger)',
        'border-color': 'var(--border-color)',
      },
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '20px',
        'xl': '24px',
      },
      boxShadow: {
        'custom': '0 4px 12px var(--shadow-color)',
        'custom-lg': '0 8px 24px var(--shadow-color)',
        'primary': '0 4px 14px 0 rgba(47, 129, 247, 0.3)',
      }
    },
  },
  plugins: [],
}