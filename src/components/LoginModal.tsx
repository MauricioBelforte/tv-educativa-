'use client'

import { useState } from 'react'

interface Props {
  onLogin: (password: string) => Promise<boolean>
}

export default function LoginModal({ onLogin }: Props) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(false)
    const ok = await onLogin(password)
    if (!ok) setError(true)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <form onSubmit={handleSubmit}
        className="bg-slate-800 border border-gray-700 rounded-2xl p-8 w-80 shadow-2xl space-y-4"
      >
        <h2 className="text-xl font-bold text-white text-center">Acceso Privado</h2>
        <p className="text-sm text-gray-400 text-center">Ingresá la contraseña para ver tus listas</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          autoFocus
          className="w-full px-4 py-2.5 rounded-lg bg-slate-700 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {error && <p className="text-red-400 text-sm text-center">Contraseña incorrecta</p>}
        <button
          type="submit"
          disabled={loading || !password}
          className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium transition-colors"
        >
          {loading ? 'Verificando...' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
