import { NavLink, Outlet } from 'react-router-dom'
import './App.css'

const menuItems = [
  { to: '/', label: 'Users', end: true },
  { to: '/recipes', label: 'Recipes' },
  { to: '/cart', label: 'Cart' },
  { to: '/post-demo', label: 'Post Demo' },
  { to: '/quote-demo', label: 'Quote Demo' },
]

function App() {
  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="sidebar__header">
          <p className="sidebar__eyebrow">DummyJSON Browser</p>
          <h1>Data panels</h1>
          <p className="sidebar__copy">
            Switch between users, recipes, carts, and crash demos from the left menu.
          </p>
        </div>

        <nav className="sidebar__nav" aria-label="Main navigation">
          {menuItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="content-panel">
        <Outlet />
      </main>
    </div>
  )
}

export default App
