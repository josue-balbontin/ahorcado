import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";

/**
 * Lee el puerto del backend desde ../backend_port.json
 * (generado automaticamente por el backend al arrancar).
 */
function getBackendPort(): number {
  try {
    const portFile = path.resolve(__dirname, "..", "backend_port.json");
    const data = JSON.parse(fs.readFileSync(portFile, "utf-8"));
    console.log(`[vite] Backend detectado en puerto: ${data.port}`);
    return data.port;
  } catch {
    console.log("[vite] No se encontro backend_port.json, usando puerto por defecto 8000");
    return 8000;
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const backendPort = getBackendPort();
  return {
    server: {
      host: "0.0.0.0",
      port: 5173,
      strictPort: false,
    },
    define: {
      __BACKEND_PORT__: JSON.stringify(backendPort),
    },
    plugins: [
      react(),
      mode === 'development' &&
      componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
