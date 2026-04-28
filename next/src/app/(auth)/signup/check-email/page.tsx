'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { EnvelopeIcon } from '@heroicons/react/24/outline'

type InternalState = 'idle' | 'sending' | 'success'
type ResendState = InternalState | 'cooldown'

const COOLDOWN_SECONDS = 60
const SUCCESS_DISPLAY_MS = 1500

function CheckEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''

  const [internalState, setInternalState] = useState<InternalState>('idle')
  const [cooldownSeconds, setCooldownSeconds] = useState(0)
  const [resendError, setResendError] = useState('')

  const resendState: ResendState =
    cooldownSeconds > 0 ? 'cooldown' : internalState

  useEffect(() => {
    if (cooldownSeconds <= 0) return
    const timer = setTimeout(() => {
      setCooldownSeconds((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearTimeout(timer)
  }, [cooldownSeconds])

  useEffect(() => {
    if (internalState !== 'success') return
    const timer = setTimeout(() => {
      setInternalState('idle')
      setCooldownSeconds(COOLDOWN_SECONDS)
    }, SUCCESS_DISPLAY_MS)
    return () => clearTimeout(timer)
  }, [internalState])

  const handleResend = async () => {
    if (!email) return
    setInternalState('sending')
    setResendError('')

    try {
      const res = await fetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        setResendError('再送信に失敗しました。時間をおいてお試しください。')
        setInternalState('idle')
        return
      }

      setInternalState('success')
    } catch {
      setResendError('ネットワークエラーが発生しました')
      setInternalState('idle')
    }
  }

  const resendButtonDisabled =
    resendState === 'sending' ||
    resendState === 'cooldown' ||
    resendState === 'success' ||
    !email

  const resendButtonText = (() => {
    switch (resendState) {
      case 'sending':
        return '送信中...'
      case 'success':
        return '✓ メールを再送信しました'
      case 'cooldown':
        return `あと ${cooldownSeconds} 秒で再送信できます`
      default:
        return '確認メールを再送信する'
    }
  })()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow p-8 w-full max-w-md relative">
        <button
          onClick={() => router.push('/')}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
          aria-label="閉じる"
        >
          ✕
        </button>

        <div className="flex justify-center mb-6">
          <div className="bg-green-100 rounded-full p-4">
            <EnvelopeIcon className="w-12 h-12 text-green-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          メールを確認してください
        </h1>

        <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-2 text-center">
          <p className="text-gray-800 font-medium break-all">
            {email || '(メールアドレス不明)'}
          </p>
        </div>
        <p className="text-sm text-gray-600 text-center mb-6 leading-relaxed">
          宛に確認メールをお送りしました。
          <br />
          メール内のリンクをクリックして
          <br />
          アカウントを有効化してください。
        </p>

        <button
          onClick={() => router.push('/login')}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 font-medium mb-6"
        >
          ログイン画面へ
        </button>

        <hr className="border-gray-200 mb-4" />

        <p className="text-sm text-gray-700 font-medium mb-1 text-center">
          📬 メールが届きませんか?
        </p>
        <p className="text-xs text-gray-500 mb-3 text-center">
          迷惑メールフォルダもご確認ください
        </p>

        <button
          onClick={handleResend}
          disabled={resendButtonDisabled}
          className={`w-full py-2 rounded font-medium text-sm border transition-colors ${
            resendState === 'success'
              ? 'bg-green-50 border-green-300 text-green-700'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed'
          }`}
        >
          {resendButtonText}
        </button>

        {resendError && (
          <p className="text-red-500 text-xs mt-2 text-center">{resendError}</p>
        )}

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 mb-1">
            メールアドレスが違いますか?
          </p>
          <Link href="/signup" className="text-sm text-green-600 hover:underline">
            登録画面に戻る
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function CheckEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-500">読み込み中...</div>
        </div>
      }
    >
      <CheckEmailContent />
    </Suspense>
  )
}
