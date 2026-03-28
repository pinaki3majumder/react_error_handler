import { createBrowserRouter } from 'react-router-dom'
import App from './App'
import PostDemoPage from './pages/PostDemoPage'
import QuoteDemoPage from './pages/QuoteDemoPage'
import ResourcePage from './pages/ResourcePage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: (
          <ResourcePage
            title="Users"
            description="People records from DummyJSON users."
            endpoint="https://dummyjson.com/users"
            resourceKey="users"
            emptyMessage="No users were returned."
            pageName="Page A"
            functionName="loadUsers"
          />
        ),
      },
      {
        path: 'recipes',
        element: (
          <ResourcePage
            title="Recipes"
            description="Browse recipe records from DummyJSON."
            endpoint="https://dummyjson.com/recipes"
            resourceKey="recipes"
            emptyMessage="No recipes were returned."
            pageName="Page B"
            functionName="loadRecipes"
          />
        ),
      },
      {
        path: 'cart',
        element: (
          <ResourcePage
            title="Cart"
            description="Cart summaries from DummyJSON."
            endpoint="https://dummyjson.com/carts"
            resourceKey="carts"
            emptyMessage="No carts were returned."
            pageName="Page C"
            functionName="loadCart"
          />
        ),
      },
      {
        path: 'post-demo',
        element: <PostDemoPage />,
      },
      {
        path: 'quote-demo',
        element: <QuoteDemoPage />,
      },
    ],
  },
])

export default router
