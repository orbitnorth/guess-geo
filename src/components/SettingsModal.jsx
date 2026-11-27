'use client'

import { Icon } from './Icons'
import { Modal } from './Modal'
import { GLOBE_TEXTURES } from '@/game/GlobeEngine'

const TEXTURE_OPTIONS = [
  {
    id: 'day',
    name: 'Day Satellite',
    tag: 'Natural',
    description: 'Natural daylight satellite photography & terrain',
    previewClass: 'preview-day',
  },
  {
    id: 'marble',
    name: 'Blue Marble',
    tag: 'Vibrant',
    description: 'Vivid NASA azure oceans & crisp continents',
    previewClass: 'preview-marble',
  },
  {
    id: 'atlas',
    name: 'Cartographic Atlas',
    tag: 'Topographic',
    description: 'Light geographic relief with visible graticule',
    previewClass: 'preview-atlas',
  },
]

export function SettingsModal({
  isOpen,
  onClose,
  theme,
  onThemeChange,
  globeTexture,
  onGlobeTextureChange,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      badge={
        <>
          <Icon name="settings" size={13} />
          <span>Game Preferences</span>
        </>
      }
      badgeVariant="blue"
      title="Settings"
      subtitle="Customize your visual theme and 3D Earth globe appearance."
      maxWidth={520}
      className="settings-modal"
      footer={
        <button
          type="button"
          className="btn-modal-action btn-full-action"
          onClick={onClose}
        >
          <Icon name="check" size={17} strokeWidth={2.4} />
          Done
        </button>
      }
    >
      <div className="settings-section">
        <div className="settings-section-header">
          <span className="settings-label">Color Theme</span>
          <span className="settings-sublabel">Select light daytime sky or deep midnight mode</span>
        </div>

        <div className="theme-toggle-grid">
          <button
            type="button"
            className={`theme-card ${theme === 'light' ? 'is-active' : ''}`}
            onClick={() => onThemeChange('light')}
          >
            <div className="theme-card-preview light-preview">
              <div className="theme-preview-sun">
                <Icon name="sun" size={20} strokeWidth={2.2} />
              </div>
              <div className="theme-preview-bar" />
            </div>
            <div className="theme-card-meta">
              <div className="theme-card-title">
                <span>Light Sky</span>
                {theme === 'light' && (
                  <span className="selection-pill">
                    <Icon name="check" size={11} strokeWidth={3} />
                  </span>
                )}
              </div>
              <p className="theme-card-desc">Daytime sky & vibrant pastel colors</p>
            </div>
          </button>

          <button
            type="button"
            className={`theme-card ${theme === 'dark' ? 'is-active' : ''}`}
            onClick={() => onThemeChange('dark')}
          >
            <div className="theme-card-preview dark-preview">
              <div className="theme-preview-moon">
                <Icon name="moon" size={18} strokeWidth={2.2} />
              </div>
              <div className="theme-preview-bar" />
            </div>
            <div className="theme-card-meta">
              <div className="theme-card-title">
                <span>Dark Mode</span>
                {theme === 'dark' && (
                  <span className="selection-pill">
                    <Icon name="check" size={11} strokeWidth={3} />
                  </span>
                )}
              </div>
              <p className="theme-card-desc">Nocturnal dark canvas & midnight hues</p>
            </div>
          </button>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-header">
          <span className="settings-label">Earth Globe Texture</span>
          <span className="settings-sublabel">Choose the 3D satellite skin mapped on the sphere</span>
        </div>

        <div className="texture-grid">
          {TEXTURE_OPTIONS.map((item) => {
            const activeId =
              globeTexture === 'night' ? 'marble' : globeTexture === 'dark' ? 'atlas' : (globeTexture || 'day')
            const isSelected = activeId === item.id
            return (
              <button
                key={item.id}
                type="button"
                className={`texture-card ${isSelected ? 'is-active' : ''}`}
                onClick={() => onGlobeTextureChange(item.id)}
              >
                <div className={`texture-preview-orb ${item.previewClass}`}>
                  <div className="orb-atmosphere" />
                  <div className="orb-details" />
                </div>
                <div className="texture-meta">
                  <div className="texture-meta-top">
                    <span className="texture-name">{item.name}</span>
                    <span className="texture-tag">{item.tag}</span>
                  </div>
                  <p className="texture-desc">{item.description}</p>
                </div>
                {isSelected && (
                  <span className="texture-check">
                    <Icon name="check" size={12} strokeWidth={3} />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}
