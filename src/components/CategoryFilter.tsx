'use client'

interface CategoryFilterProps {
  categories: string[]
  selected: string | null
  onSelect: (category: string | null) => void
  showFavorites: boolean
  onToggleFavorites: () => void
}

export default function CategoryFilter({
  categories,
  selected,
  onSelect,
  showFavorites,
  onToggleFavorites,
}: CategoryFilterProps) {
  return (
    <div className="space-y-1">
      {/* Botón "Todos" */}
      <button
        onClick={() => onSelect(null)}
        className={`
          w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
          ${!selected && !showFavorites
            ? 'bg-blue-600 text-white'
            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
          }
        `}
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          Todos los canales
        </div>
      </button>

      {/* Botón de Favoritos */}
      <button
        onClick={onToggleFavorites}
        className={`
          w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
          ${showFavorites
            ? 'bg-yellow-600 text-white'
            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
          }
        `}
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill={showFavorites ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          Favoritos
        </div>
      </button>

      {/* Separador */}
      <div className="border-t border-gray-700 my-2" />

      {/* Categorías */}
      <p className="text-xs text-gray-500 px-3 mb-1 uppercase tracking-wider">Categorías</p>
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onSelect(category)}
          className={`
            w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
            ${selected === category
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }
          `}
        >
          {category}
        </button>
      ))}
    </div>
  )
}