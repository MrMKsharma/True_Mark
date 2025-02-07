import { useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface Report {
  id: string;
  productId: string;
  productName: string;
  reportDate: string;
  location: string;
  status: 'pending' | 'confirmed' | 'false_alarm';
}

const mockReports: Report[] = [
  {
    id: '1',
    productId: 'P001',
    productName: 'Product A',
    reportDate: '2025-01-24',
    location: 'New York, USA',
    status: 'pending',
  },
  {
    id: '2',
    productId: 'P002',
    productName: 'Product B',
    reportDate: '2025-01-23',
    location: 'London, UK',
    status: 'confirmed',
  },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

const pieData = [
  { name: 'Pending', value: 5 },
  { name: 'Confirmed', value: 12 },
  { name: 'False Alarm', value: 3 },
];

export default function CounterfeitReports() {
  const [reports] = useState<Report[]>(mockReports);

  const getStatusColor = (status: Report['status']) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'confirmed':
        return 'error';
      case 'false_alarm':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Counterfeit Reports
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Reports Overview
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Reports
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Report ID</TableCell>
                      <TableCell>Product ID</TableCell>
                      <TableCell>Product Name</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>{report.id}</TableCell>
                        <TableCell>{report.productId}</TableCell>
                        <TableCell>{report.productName}</TableCell>
                        <TableCell>{report.reportDate}</TableCell>
                        <TableCell>{report.location}</TableCell>
                        <TableCell>
                          <Chip
                            label={report.status.replace('_', ' ')}
                            color={getStatusColor(report.status)}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
