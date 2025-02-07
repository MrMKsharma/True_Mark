import { useState, useEffect, useCallback } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
  useTheme,
  useMediaQuery,
  Fade,
  Grow,
  IconButton,
  Card,
  CardContent,
  Divider,
  Tooltip,
  Chip
} from '@mui/material';
import { AptosClient } from 'aptos';
import VerifiedIcon from '@mui/icons-material/Verified';
import GppBadIcon from '@mui/icons-material/GppBad';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import SecurityIcon from '@mui/icons-material/Security';
import { config } from './config';
import { Html5QrcodeScanner } from 'html5-qrcode';
import CryptoJS from 'crypto-js';

// Initialize Aptos client with retry mechanism
const initializeClient = () => {
  try {
    return new AptosClient(config.NODE_URL);
  } catch (error) {
    console.error('Failed to initialize Aptos client:', error);
    throw error;
  }
};

const client = initializeClient();

// Get signing secret from environment variables
const SIGNING_SECRET = import.meta.env.VITE_SIGNING_SECRET;
if (!SIGNING_SECRET) {
  throw new Error('VITE_SIGNING_SECRET environment variable is not set');
}

// Maximum age of QR code in milliseconds (e.g., 24 hours)
const MAX_QR_AGE = 24 * 60 * 60 * 1000;

interface ProductResult {
  isAuthentic: boolean;
  manufacturer: string;
  creationTime: string;
  productName: string;
  serialNumber: string;
}

interface BlockchainResponse {
  data: {
    manufacturer: string;
    creation_time: number;
    name: string;
    is_authentic: boolean;
  };
}

interface QRCodeData {
  id: string;
  name: string;
  manufacturer: string;
  timestamp: number;
  signature: string;
}

function App() {
  const [productId, setProductId] = useState('');
  const [loading, setLoading] = useState(false);
  const [isBlockchainConnected, setIsBlockchainConnected] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [result, setResult] = useState<ProductResult | null>(null);
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const checkBlockchainConnection = useCallback(async () => {
    try {
      setNetworkStatus('checking');
      const ledgerInfo = await client.getLedgerInfo();
      if (ledgerInfo) {
        setIsBlockchainConnected(true);
        setNetworkStatus('connected');
        setRetryCount(0); // Reset retry count on successful connection
        return true;
      }
      throw new Error('No ledger info received');
    } catch (error) {
      console.error('Blockchain connection failed:', error);
      setIsBlockchainConnected(false);
      setNetworkStatus('disconnected');
      
      // Implement retry logic
      if (retryCount < maxRetries) {
        const nextRetry = retryCount + 1;
        setRetryCount(nextRetry);
        console.log(`Retrying connection (${nextRetry}/${maxRetries})...`);
        // Exponential backoff: 2^retry * 1000ms (1s, 2s, 4s)
        setTimeout(() => checkBlockchainConnection(), Math.pow(2, retryCount) * 1000);
      }
      
      return false;
    }
  }, [retryCount]);

  // Initial connection check
  useEffect(() => {
    checkBlockchainConnection();
  }, [checkBlockchainConnection]);

  // Set up periodic connection check
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (networkStatus !== 'checking') {
        checkBlockchainConnection();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(intervalId);
  }, [checkBlockchainConnection, networkStatus]);

  useEffect(() => {
    let scanner: any = null;
    
    if (showScanner) {
      scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );
      
      scanner.render((decodedText: string) => {
        try {
          // Parse the QR code JSON data
          const qrData = JSON.parse(decodedText) as QRCodeData;
          
          // Verify the QR code
          const verificationResult = verifyQRCode(qrData);
          
          if (verificationResult.isValid) {
            // If valid, proceed with blockchain verification
            setProductId(qrData.id);
            setShowScanner(false);
            
            // Show immediate offline verification result
            setResult({
              isAuthentic: true,
              manufacturer: qrData.manufacturer,
              creationTime: new Date(qrData.timestamp).toLocaleString(),
              productName: qrData.name,
              serialNumber: qrData.id
            });
            
            // Then verify on blockchain for complete check
            handleVerify();
          } else {
            throw new Error(verificationResult.error || 'Invalid QR code');
          }
        } catch (error) {
          console.error('Error parsing QR code:', error);
          setError(error instanceof Error ? error.message : 'Invalid QR code format. Please try again.');
          setShowScanner(false);
        }
      }, (error: any) => {
        console.warn(`QR Code scanning failed: ${error}`);
      });
    }

    return () => {
      if (scanner) {
        scanner.clear().catch((error: any) => {
          console.error('Failed to clear scanner instance:', error);
        });
      }
    };
  }, [showScanner]);

  const handleVerify = async () => {
    // Clean the input - remove any whitespace and potential JSON formatting
    const cleanProductId = productId.trim().replace(/[{}"]/g, '');
    
    if (!cleanProductId) {
      setError('Please enter a product ID');
      return;
    }

    if (!/^\d+$/.test(cleanProductId)) {
      setError('Product ID must be a valid number');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const isConnected = await checkBlockchainConnection();
      if (!isConnected) {
        throw new Error('Blockchain network is not available. Please try again later.');
      }

      // In development, use mock data
      if (process.env.NODE_ENV === 'development') {
        const mockResult: ProductResult = {
          isAuthentic: true,
          manufacturer: "Authentic Manufacturer",
          creationTime: new Date().toLocaleString(),
          productName: "Sample Product",
          serialNumber: cleanProductId
        };
        setResult(mockResult);
      } else {
        // Production blockchain call
        const response = await client.view({
          function: `${config.CONTRACT_ADDRESS}::product::get_product`,
          type_arguments: [],
          arguments: [config.CONTRACT_ADDRESS, parseInt(cleanProductId)]
        }).catch(error => {
          throw new Error(`Blockchain query failed: ${error.message}`);
        }) as unknown as [string, string, boolean];

        if (!response || !Array.isArray(response) || response.length !== 3) {
          throw new Error('Invalid response format from blockchain');
        }

        const [name, manufacturer, is_authentic] = response;
        
        if (!name || !manufacturer) {
          throw new Error('Product not found on the blockchain');
        }

        setResult({
          isAuthentic: is_authentic,
          manufacturer: manufacturer,
          creationTime: new Date().toLocaleString(),
          productName: name,
          serialNumber: cleanProductId
        });
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError(err instanceof Error ? err.message : 'Unable to verify product at this time. Please try again later.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleScanQR = () => {
    setShowScanner(true);
  };

  const verifyQRCode = (qrData: QRCodeData): { isValid: boolean; error?: string } => {
    try {
      // Validate required fields
      const requiredFields = ['id', 'name', 'manufacturer', 'timestamp', 'signature'];
      for (const field of requiredFields) {
        if (!qrData[field as keyof QRCodeData]) {
          return { isValid: false, error: `Invalid QR code: missing ${field}` };
        }
      }

      // Check if QR code has expired
      const age = Date.now() - qrData.timestamp;
      if (age > MAX_QR_AGE) {
        return { isValid: false, error: 'QR code has expired. Please request a new one.' };
      }

      if (age < 0) {
        return { isValid: false, error: 'Invalid QR code timestamp' };
      }

      // Verify signature
      const { signature, ...dataWithoutSignature } = qrData;
      const dataString = JSON.stringify(dataWithoutSignature);
      const expectedSignature = CryptoJS.HmacSHA256(dataString, SIGNING_SECRET).toString();

      if (signature !== expectedSignature) {
        return { isValid: false, error: 'Invalid signature - this QR code may be counterfeit' };
      }

      return { isValid: true };
    } catch (error) {
      return { 
        isValid: false, 
        error: error instanceof Error ? 
          `Error verifying QR code: ${error.message}` : 
          'Error verifying QR code' 
      };
    }
  };

  // Update document background
  useEffect(() => {
    document.body.style.background = 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)';
    return () => {
      document.body.style.background = '';
    };
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" sx={{ 
        background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
        boxShadow: '0 3px 5px 2px rgba(33, 150, 243, .3)'
      }}>
        <Toolbar>
          <SecurityIcon sx={{ mr: 2, fontSize: 28 }} />
          <Typography variant="h5" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Product Verification System
          </Typography>
          <Chip
            label={networkStatus === 'connected' ? 'Blockchain Connected' : 
                  networkStatus === 'checking' ? 'Checking Connection...' : 
                  'Blockchain Disconnected'}
            color={networkStatus === 'connected' ? 'success' : 
                  networkStatus === 'checking' ? 'warning' : 
                  'error'}
            size="small"
            sx={{ ml: 2 }}
          />
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ mt: 6, mb: 4, flex: 1 }}>
        <Grow in timeout={1000}>
          <Card 
            elevation={8} 
            sx={{ 
              borderRadius: 4,
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              transition: 'transform 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-5px)'
              }
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, color: '#1976d2' }}>
                  Verify Your Product
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                  Enter the product ID to verify its authenticity on the blockchain
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                <TextField
                  label="Enter Product ID"
                  variant="outlined"
                  fullWidth
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  disabled={loading}
                  error={Boolean(error)}
                  helperText={error}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#1976d2',
                      },
                    },
                  }}
                />
                <Tooltip title="Scan QR Code">
                  <IconButton 
                    color="primary" 
                    onClick={handleScanQR}
                    disabled={loading}
                    sx={{ 
                      bgcolor: 'rgba(25, 118, 210, 0.1)',
                      '&:hover': {
                        bgcolor: 'rgba(25, 118, 210, 0.2)',
                      }
                    }}
                  >
                    <QrCodeScannerIcon />
                  </IconButton>
                </Tooltip>
              </Box>

              <Button
                variant="contained"
                size="large"
                onClick={handleVerify}
                disabled={loading || !productId.trim()}
                fullWidth
                sx={{ 
                  py: 1.5,
                  borderRadius: 2,
                  background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
                  boxShadow: '0 3px 5px 2px rgba(33, 150, 243, .3)',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'scale(1.02)',
                    boxShadow: '0 6px 10px 4px rgba(33, 150, 243, .3)',
                  }
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Verify Product'
                )}
              </Button>

              {result && (
                <Fade in timeout={1000}>
                  <Paper 
                    elevation={3} 
                    sx={{ 
                      p: 3, 
                      mt: 3, 
                      bgcolor: result.isAuthentic ? 'rgba(232, 245, 233, 0.9)' : 'rgba(255, 235, 238, 0.9)',
                      borderRadius: 3,
                      transition: 'all 0.3s ease-in-out',
                      '&:hover': {
                        transform: 'scale(1.02)',
                      }
                    }}
                  >
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2, 
                        mb: 2 
                      }}
                    >
                      {result.isAuthentic ? (
                        <VerifiedIcon sx={{ fontSize: 48, color: '#2e7d32' }} />
                      ) : (
                        <GppBadIcon sx={{ fontSize: 48, color: '#d32f2f' }} />
                      )}
                      <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        {result.isAuthentic ? 'Authentic Product' : 'Counterfeit Product'}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Typography variant="body1">
                        <strong>Product Name:</strong> {result.productName}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Serial Number:</strong> {result.serialNumber}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Manufacturer:</strong> {result.manufacturer}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Manufacturing Date:</strong> {result.creationTime}
                      </Typography>
                    </Box>
                  </Paper>
                </Fade>
              )}
            </CardContent>
          </Card>
        </Grow>

        <Box sx={{ 
          width: '100%',
          maxWidth: 600,
          mx: 'auto',
          mt: 4,
          p: 3,
          borderRadius: 2,
          bgcolor: 'background.paper',
          boxShadow: 3
        }}>
          {showScanner ? (
            <Box>
              <div id="qr-reader" style={{ width: '100%' }}></div>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => setShowScanner(false)}
                sx={{ mt: 2 }}
              >
                Cancel Scanning
              </Button>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Powered by Aptos Blockchain Technology
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                &copy; 2025 Product Verification System. All rights reserved.
              </Typography>
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
}

export default App;
