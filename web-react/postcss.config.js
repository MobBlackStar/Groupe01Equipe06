import { fileURLToPath } from 'node:url';

export default {
  plugins: {
    // Absolute config path so the build works whatever directory Vite is launched from
    tailwindcss: { config: fileURLToPath(new URL('./tailwind.config.js', import.meta.url)) },
    autoprefixer: {},
  },
};
