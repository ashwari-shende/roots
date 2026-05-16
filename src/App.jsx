import { Routes, Route } from 'react-router-dom'
import Landing from './Landing'
import Archive from './Archive'
import Chatbot from './Chatbot'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/archive" element={<Archive />} />
      <Route path="/chat" element={<Chatbot />} />
    </Routes>
  )
}