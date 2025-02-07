import { useEffect, useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Box,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts';

const mockData = {
  productStats: {
    total: 1250,
    verified: 980,
    reported: 15,
  },
  weeklyVerifications: [
    { day: 'Mon', count: 45 },
    { day: 'Tue', count: 52 },
    { day: 'Wed', count: 38 },
    { day: 'Thu', count: 65 },
    { day: 'Fri', count: 48 },
    { day: 'Sat', count: 25 },
    { day: 'Sun', count: 15 },
  ],
  counterfeitReports: [
    { month: 'Jan', authentic: 150, counterfeit: 5 },
    { month: 'Feb', authentic: 180, counterfeit: 8 },
    { month: 'Mar', authentic: 200, counterfeit: 3 },
    { month: 'Apr', authentic: 250, counterfeit: 12 },
  ],
};

export default function Dashboard() {
  const [data, setData] = useState(mockData);

  useEffect(() => {
    // TODO: Fetch real data from API
    setData(mockData);
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Products
              </Typography>
              <Typography variant="h4">
                {data.productStats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Verified Products
              </Typography>
              <Typography variant="h4">
                {data.productStats.verified}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Reported Counterfeits
              </Typography>
              <Typography variant="h4" color="error">
                {data.productStats.reported}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Charts */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Weekly Verifications
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.weeklyVerifications}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#8884d8"
                  name="Verifications"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Product Authentication Status
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.counterfeitReports}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="authentic" fill="#4caf50" name="Authentic" />
                <Bar dataKey="counterfeit" fill="#f44336" name="Counterfeit" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
