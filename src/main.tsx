import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import BookForm from './app/insert/book/page'
import SeriesForm from './app/insert/series/page'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<BookForm />} />
        <Route path="/insert/series" element={<SeriesForm />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)