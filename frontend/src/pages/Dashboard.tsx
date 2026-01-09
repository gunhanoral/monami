import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <Grid container spacing={3}>
      <Grid size={12}>
        <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
          <Typography component="h2" variant="h4" color="primary" gutterBottom>
            MPBGP EVPN Route Manager
          </Typography>
          <Typography variant="body1" paragraph>
            Welcome to the centralized management dashboard for your EVPN fabric. 
            Here you can manage Virtual Routing and Forwarding (VRF) instances, 
            control route leaks, and monitor prefix distributions.
          </Typography>
        </Paper>
      </Grid>
      
      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardContent>
            <Typography variant="h5" component="div" gutterBottom>
              VRF Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create and configure VRFs, manage Route Distinguishers (RDs), 
              and assign Route Targets (RTs) for import/export policies.
            </Typography>
          </CardContent>
          <CardActions>
            <Button size="small" onClick={() => navigate('/vrfs')}>Go to VRFs</Button>
          </CardActions>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardContent>
            <Typography variant="h5" component="div" gutterBottom>
              Easy Leak Matrix
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Visualize and manage route leaking between VRFs using an intuitive 
              grid interface. Quickly toggle imports between source and destination VRFs.
            </Typography>
          </CardContent>
          <CardActions>
            <Button size="small" onClick={() => navigate('/easy-leak')}>Open Matrix</Button>
          </CardActions>
        </Card>
      </Grid>
    </Grid>
  );
}
