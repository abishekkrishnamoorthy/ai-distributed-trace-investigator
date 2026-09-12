import { Icon } from '../common/Icon'

export const Topbar = ({ onOpenNavigation }) => (
  <header className="topbar">
    <div className="mobile-topbar-brand">
      <button className="icon-button menu-button" type="button" onClick={onOpenNavigation} aria-label="Open navigation">
        <Icon name="menu" />
      </button>
      <span className="mobile-brand-lockup">
        <span className="brand-mark">A</span>
        <strong>Atatus</strong>
      </span>
    </div>
    <div className="topbar-actions">
      <button className="icon-button theme-button" type="button" aria-label="Toggle theme">
        <Icon name="sun" />
      </button>
      <button className="icon-button notification" type="button" aria-label="Notifications">
        <Icon name="bell" />
      </button>
      <span className="avatar">A</span>
    </div>
  </header>
)
