import { http, HttpResponse } from 'msw'

export const handlers = [
  // POST /api/likes/:recipeId → いいね作成 (liked: true)
  http.post('/api/likes/:recipeId', () => {
    return HttpResponse.json({ liked_by_current_user: true })
  }),

  // DELETE /api/likes/:recipeId → いいね削除 (liked: false)
  http.delete('/api/likes/:recipeId', () => {
    return HttpResponse.json({ liked_by_current_user: false })
  }),

  // POST /api/bookmarks → ブックマーク作成
  http.post('/api/bookmarks', () => {
    return HttpResponse.json({ bookmarked: true })
  }),

  // DELETE /api/bookmarks/:recipeId → ブックマーク削除
  http.delete('/api/bookmarks/:recipeId', () => {
    return HttpResponse.json({ bookmarked: false })
  }),
]
