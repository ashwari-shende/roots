import { Routes, Route } from 'react-router-dom'
import Landing from './Landing'
import Archive from './Archive'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/archive" element={<Archive />} />
    </Routes>
  )
}