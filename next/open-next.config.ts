import { defineCloudflareConfig } from '@opennextjs/cloudflare'

// 認証 Cookie 前提の全ページ動的レンダリングのため、ISR キャッシュは使用しない
export default defineCloudflareConfig()
