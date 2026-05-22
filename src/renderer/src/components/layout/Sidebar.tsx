import React from 'react'
import { useAppStore } from '../../store/appStore'

type Tab = 'dashboard' | 'keywords' | 'logs' | 'settings'

interface NavItem {
  id: Tab
  label: string
  icon: string
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '⬡' },
  { id: 'keywords', label: 'Keywords', icon: '◈' },
  { id: 'logs', label: 'Logs', icon: '≡' },
  { id: 'settings', label: 'Ajustes', icon: '⚙' }
]

export function Sidebar(): React.ReactElement {
  const { activeTab, setActiveTab } = useAppStore()

  return (
    <aside className="w-52 h-full bg-sentinel-surface border-r border-sentinel-border flex flex-col">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-sentinel-border">
        <div className="flex items-center gap-2">
          <span className="text-sentinel-accent text-xl font-bold">▲</span>
          <div>
            <h1 className="text-sentinel-text font-bold text-sm leading-tight">
              HN Sentinel
            </h1>
            <p className="text-sentinel-text-muted text-xs">Monitor de HN</p>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-2 py-3 space-y-1">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`
              w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm
              transition-colors duration-150 text-left
              ${
                activeTab === item.id
                  ? 'bg-sentinel-accent/15 text-sentinel-accent border border-sentinel-accent/20'
                  : 'text-sentinel-text-muted hover:text-sentinel-text hover:bg-sentinel-muted'
              }
            `}
          >
            <span className="text-base">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-sentinel-border">
        <p className="text-sentinel-text-muted text-xs">v1.0.0</p>
      </div>
    </aside>
  )
}