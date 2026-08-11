// Render 無料プランのスリープ (15 分無通信で停止) を防ぐ keepalive ワーカー。
// Cloudflare Workers の Cron Trigger (5 分間隔) から Rails のヘルスチェックを叩く。
// Cloudflare DNS 設定に依存しないよう、Render の直 URL を使用する。
export default {
  async scheduled(event, env, ctx) {
    const res = await fetch(
      "https://ai-meshi-api.onrender.com/api/v1/health_check",
    );
    console.log(`keepalive: ${res.status}`);
  },
};
