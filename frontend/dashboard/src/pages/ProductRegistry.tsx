import { useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Alert,
  Snackbar,
} from '@mui/material';
import { Add as AddIcon, CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import QRCode from 'qrcode';
import CryptoJS from 'crypto-js';

// Get signing secret from environment variables
const SIGNING_SECRET = import.meta.env.VITE_SIGNING_SECRET;
if (!SIGNING_SECRET) {
  throw new Error('VITE_SIGNING_SECRET environment variable is not set');
}

interface Product {
  id: string;
  name: string;
  manufacturer: string;
  category: string;
  description: string;
  price: string;
  dateRegistered: string;
  status: 'active' | 'inactive';
  imageUrl?: string;
  batchNumber?: string;
  expiryDate?: string;
}

const PRODUCT_CATEGORIES = [
  'Electronics',
  'Clothing',
  'Food & Beverages',
  'Cosmetics',
  'Pharmaceuticals',
  'Automotive',
  'Others'
];

const initialProducts: Product[] = [
  {
    id: '1',
    name: 'Premium Headphones',
    manufacturer: 'AudioTech Inc.',
    category: 'Electronics',
    description: 'High-quality wireless headphones with noise cancellation',
    price: '299.99',
    dateRegistered: '2025-01-24',
    status: 'active',
    batchNumber: 'BATCH001',
    expiryDate: '2027-01-24'
  },
  {
    id: '2',
    name: 'Organic Green Tea',
    manufacturer: 'Natural Beverages Co.',
    category: 'Food & Beverages',
    description: 'Premium organic green tea from selected estates',
    price: '19.99',
    dateRegistered: '2025-01-23',
    status: 'active',
    batchNumber: 'BATCH002',
    expiryDate: '2026-01-23'
  },
];

interface NewProduct {
  name: string;
  manufacturer: string;
  category: string;
  description: string;
  price: string;
  batchNumber: string;
  expiryDate: string;
  image?: File;
}

export default function ProductRegistry() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState<NewProduct>({
    name: '',
    manufacturer: '',
    category: '',
    description: '',
    price: '',
    batchNumber: '',
    expiryDate: '',
  });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  const handleOpen = () => {
    setOpen(true);
    setError(null);
  };

  const handleClose = () => {
    setOpen(false);
    setError(null);
    setNewProduct({
      name: '',
      manufacturer: '',
      category: '',
      description: '',
      price: '',
      batchNumber: '',
      expiryDate: '',
    });
  };

  const validateProduct = (product: NewProduct): string | null => {
    if (!product.name.trim()) return 'Product name is required';
    if (!product.manufacturer.trim()) return 'Manufacturer is required';
    if (!product.category) return 'Category is required';
    if (!product.price.trim() || isNaN(Number(product.price))) return 'Valid price is required';
    if (!product.batchNumber.trim()) return 'Batch number is required';
    if (!product.expiryDate) return 'Expiry date is required';
    return null;
  };

  const handleAddProduct = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate product
      const validationError = validateProduct(newProduct);
      if (validationError) {
        setError(validationError);
        return;
      }

      // Call blockchain to register product
      const transaction = {
        function: `${config.CONTRACT_ADDRESS}::product::register_product`,
        type_arguments: [],
        arguments: [newProduct.name, newProduct.manufacturer]
      };

      // Get current product count to use as ID
      const countResponse = await client.view({
        function: `${config.CONTRACT_ADDRESS}::product::get_product_count`,
        type_arguments: [],
        arguments: [config.CONTRACT_ADDRESS]
      }).catch(error => {
        throw new Error(`Failed to get product count: ${error.message}`);
      }) as unknown as string;

      const productId = countResponse;

      const product: Product = {
        id: productId,
        name: newProduct.name,
        manufacturer: newProduct.manufacturer,
        category: newProduct.category,
        description: newProduct.description,
        price: newProduct.price,
        dateRegistered: new Date().toISOString().split('T')[0],
        status: 'active',
        batchNumber: newProduct.batchNumber,
        expiryDate: newProduct.expiryDate,
      };

      setProducts(prevProducts => [...prevProducts, product]);
      handleClose();

      // Generate QR code for the new product
      await generateQRCode(product);
    } catch (error) {
      console.error('Error adding product:', error);
      setError(error instanceof Error ? error.message : 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async (product: Product) => {
    try {
      setLoading(true);
      setError(null);

      // Create the product data
      const productData = {
        id: product.id,
        name: product.name,
        manufacturer: product.manufacturer,
        category: product.category,
        description: product.description,
        price: product.price,
        batchNumber: product.batchNumber,
        expiryDate: product.expiryDate,
        timestamp: new Date().getTime()
      };

      // Create a signature of the data
      const dataString = JSON.stringify(productData);
      const signature = CryptoJS.HmacSHA256(dataString, SIGNING_SECRET).toString();

      // Combine data and signature
      const qrData = JSON.stringify({
        ...productData,
        signature
      });
      
      const url = await QRCode.toDataURL(qrData);
      setQrCodeUrl(url);
      setSelectedProduct(product);
    } catch (err) {
      console.error("Error generating QR code:", err);
      setError(err instanceof Error ? err.message : 'Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Product Registry
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpen}
        >
          Add Product
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={2} sx={{ mb: 4 }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.main' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ID</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Manufacturer</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Category</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Description</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Price</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Date Registered</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product) => (
              <TableRow
                key={product.id}
                sx={{
                  '&:nth-of-type(odd)': {
                    backgroundColor: 'action.hover',
                  },
                  '&:hover': {
                    backgroundColor: 'action.selected',
                  },
                }}
              >
                <TableCell>{product.id}</TableCell>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.manufacturer}</TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{
                      backgroundColor: 'primary.light',
                      color: 'white',
                      py: 0.5,
                      px: 1,
                      borderRadius: 1,
                      display: 'inline-block'
                    }}
                  >
                    {product.category}
                  </Typography>
                </TableCell>
                <TableCell>{product.description}</TableCell>
                <TableCell>${product.price}</TableCell>
                <TableCell>{product.dateRegistered}</TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{
                      backgroundColor: product.status === 'active' ? 'success.light' : 'error.light',
                      color: 'white',
                      py: 0.5,
                      px: 1,
                      borderRadius: 1,
                      display: 'inline-block'
                    }}
                  >
                    {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => generateQRCode(product)}
                    sx={{ mr: 1 }}
                  >
                    Generate QR
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Add New Product</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                margin="dense"
                label="Product Name"
                fullWidth
                variant="outlined"
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, name: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                margin="dense"
                label="Manufacturer"
                fullWidth
                variant="outlined"
                value={newProduct.manufacturer}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, manufacturer: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="category-label">Category</InputLabel>
                <Select
                  labelId="category-label"
                  label="Category"
                  value={newProduct.category}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, category: e.target.value })
                  }
                >
                  {PRODUCT_CATEGORIES.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                margin="dense"
                label="Description"
                fullWidth
                variant="outlined"
                value={newProduct.description}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, description: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                margin="dense"
                label="Price"
                fullWidth
                variant="outlined"
                value={newProduct.price}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, price: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                margin="dense"
                label="Batch Number"
                fullWidth
                variant="outlined"
                value={newProduct.batchNumber}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, batchNumber: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                margin="dense"
                label="Expiry Date"
                fullWidth
                variant="outlined"
                value={newProduct.expiryDate}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, expiryDate: e.target.value })
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button 
            onClick={handleAddProduct}
            variant="contained" 
            color="primary"
            disabled={
              !newProduct.name ||
              !newProduct.manufacturer ||
              !newProduct.category ||
              !newProduct.description ||
              !newProduct.price ||
              loading
            }
          >
            {loading ? 'Adding...' : 'Add Product'}
          </Button>
        </DialogActions>
      </Dialog>

      {error && (
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
          message={error}
          severity="error"
        />
      )}

      <Dialog
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Product QR Code</DialogTitle>
        <DialogContent>
          {qrCodeUrl && (
            <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
              <img src={qrCodeUrl} alt="Product QR Code" style={{ width: '200px' }} />
              <Typography variant="body2" color="textSecondary">
                Scan this QR code to verify the product's authenticity
              </Typography>
              <Button
                variant="outlined"
                onClick={() => {
                  const link = document.createElement('a');
                  link.download = `product-${selectedProduct?.id}-qr.png`;
                  link.href = qrCodeUrl;
                  link.click();
                }}
              >
                Download QR Code
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedProduct(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Box position="fixed" bottom={24} right={24}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpen}
          sx={{ borderRadius: 28, px: 3 }}
        >
          Add Product
        </Button>
      </Box>
    </Box>
  );
}
