import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './styles.css'
import { AppLayout } from './routes/AppLayout'
import { Home } from './routes/Home'
import { Upload } from './routes/Upload'
import { Analysis } from './routes/Analysis'
import { Opportunities } from './routes/Opportunities'
import { Pricing } from './routes/Pricing'
import { Contact } from './routes/Contact'
import { Events } from './routes/Events'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'upload', element: <Upload /> },
      { path: 'analysis', element: <Analysis /> },
      { path: 'opportunities', element: <Opportunities /> },
      { path: 'pricing', element: <Pricing /> },
      { path: 'contact', element: <Contact /> },
      { path: 'events', element: <Events /> },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)

