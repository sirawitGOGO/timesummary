import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './component/Dashboard';


function App() {
  return (
    <BrowserRouter basename='/'>
      <Routes>
        <Route path='/' element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
