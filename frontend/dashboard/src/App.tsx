import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import ProductRegistry from './pages/ProductRegistry';
import CounterfeitReports from './pages/CounterfeitReports';

function App() {
  return (
    <Box sx={{ display: 'flex' }}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<ProductRegistry />} />
          <Route path="reports" element={<CounterfeitReports />} />
        </Route>
      </Routes>
    </Box>
  );
}

export default App;
