import { NavLink } from 'react-router-dom'
import { Icon } from '../common/Icon'

export const Sidebar = ({ open = false, onClose, onLogout, onNavigate, user }) => (
  <>
    <button
      className={`sidebar-backdrop ${open ? 'open' : ''}`}
      type="button"
      onClick={onClose}
      aria-label="Close navigation"
    />
    <aside className={`sidebar ${open ? 'open' : ''}`}>
    <div>
      <NavLink className="brand" to="/traces">
        <span>
          <strong>TRACE INVESTIGATOR</strong>
          <small>Observe. Understand. Fix.</small>
        </span>
      </NavLink>
      <button className="icon-button sidebar-close" type="button" onClick={onClose} aria-label="Close navigation">
        <Icon name="x" />
      </button>

      <nav className="side-nav" aria-label="Primary">
        <NavLink className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`} to="/traces" onClick={onNavigate}>
          <Icon name="network" />
          <span>Traces</span>
        </NavLink>
        <NavLink className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`} to="/ai-insights" onClick={onNavigate}>
          <Icon name="ai" />
          <span>AI Insights</span>
        </NavLink>
        <NavLink className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`} to="/compare" onClick={onNavigate}>
          <Icon name="activity" />
          <span>Compare</span>
        </NavLink>
      </nav>
    </div>

    <div className="sidebar-footer">
      <div className="user-card">
        <span className="avatar muted">A</span>
        <span>
          <strong>{user?.username || 'Admin'}</strong>
          <small>Administrator</small>
        </span>
        <Icon name="chevronRight" size={18} />
      </div>
      <button className="logout-link" type="button" onClick={onLogout}>
        <Icon name="logout" />
        <span>Logout</span>
      </button>
    </div>
  </aside>
  </>
)
