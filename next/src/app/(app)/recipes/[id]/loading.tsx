export default function Loading() {
  return (
    <div
      role="status"
      aria-label="読み込み中"
      className="flex justify-center py-24"
    >
      <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin motion-reduce:animate-none" />
    </div>
  )
}
