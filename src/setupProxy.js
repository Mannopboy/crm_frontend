const { createProxyMiddleware } = require("http-proxy-middleware");

// Dev serverdagi /api so'rovlari shu manzilga uzatiladi.
// Host .env.development dagi REACT_APP_API_PROXY_TARGET dan olinadi — kodda qattiq yozilmaydi.
const TARGET = process.env.REACT_APP_API_PROXY_TARGET || "http://crm.gennis.uz";

module.exports = function (app) {
    app.use(
        "/api",
        createProxyMiddleware({
            target: TARGET,
            changeOrigin: true,
            secure: false,
            // SSE (/api/stream) uchun javob buferlanmasligi kerak
            onProxyRes(proxyRes) {
                if ((proxyRes.headers["content-type"] || "").includes("text/event-stream")) {
                    proxyRes.headers["cache-control"] = "no-cache, no-transform";
                }
            },
        })
    );
};
