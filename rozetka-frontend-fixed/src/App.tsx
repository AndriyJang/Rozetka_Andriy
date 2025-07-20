import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import RegisterUser from './pages/RegisterUser';
import ProductSearch from "./pages/ProductSearch";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<RegisterUser />} />
        <Route path="/search" element={<ProductSearch />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
