import { Icon } from '../common/Icon'

export const Topbar = ({ onOpenNavigation }) => (
  <header className="topbar">
    <button className="icon-button menu-button" type="button" onClick={onOpenNavigation} aria-label="Open navigation">
      <Icon name="menu" />
    </button>
  </header>
)
