
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import MainGame from './sites/MainGame'

function App() {

  return (
    <Router>
      <Routes>
        <Route path='/' index element={<MainGame />} />
      </Routes>
    </Router>
  )
}

export default App
