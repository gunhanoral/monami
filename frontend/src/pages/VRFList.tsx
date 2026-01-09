import { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { getVRFs, createVRF, deleteVRF } from '../api/vrf';
import type { VRF } from '../api/vrf';
import { Box, Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle, Snackbar, Alert, IconButton, List, ListItem, ListItemText, Chip, Tooltip, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import InfoIcon from '@mui/icons-material/Info';
import { useNavigate } from 'react-router-dom';

interface PrefixInfo {
  cidr: string;
  isLearned: boolean;
  sourceVRF?: string;
  sourceNamespace?: string;
}

export default function VRFList() {
  const [vrfs, setVrfs] = useState<VRF[]>([]);
  const [open, setOpen] = useState(false);
  const [prefixDialogOpen, setPrefixDialogOpen] = useState(false);
  const [selectedVRF, setSelectedVRF] = useState<VRF | null>(null);
  const [prefixes, setPrefixes] = useState<PrefixInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Form State
  const [newName, setNewName] = useState('');
  const [newNamespace, setNewNamespace] = useState('default');
  const [newRD, setNewRD] = useState('');

  const fetchVRFs = async () => {
    try {
      setLoading(true);
      const data = await getVRFs();
      setVrfs(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch VRFs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVRFs();
  }, []);

  const handleCreate = async () => {
    try {
      await createVRF({ name: newName, namespace: newNamespace, rd: newRD });
      setOpen(false);
      setNewName('');
      setNewRD('');
      fetchVRFs();
    } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.detail || 'Failed to create VRF');
    }
  };

  const handleDelete = async (namespace: string, name: string) => {
      if(!confirm(`Are you sure you want to delete VRF ${name}?`)) return;
      try {
          await deleteVRF(namespace, name);
          fetchVRFs();
      } catch (err: any) {
          setError(err.response?.data?.detail || 'Failed to delete VRF');
      }
  }

  const calculateLearnedPrefixes = (vrf: VRF, allVRFs: VRF[]): PrefixInfo[] => {
    const prefixMap = new Map<string, PrefixInfo>();
    
    // Add owned prefixes
    vrf.prefixes.forEach(cidr => {
      prefixMap.set(cidr, { cidr, isLearned: false });
    });
    
    // Find learned prefixes: VRFs that export RTs that this VRF imports
    const importedRTs = new Set(vrf.imports);
    
    allVRFs.forEach(otherVRF => {
      // Skip self
      if (otherVRF.namespace === vrf.namespace && otherVRF.name === vrf.name) {
        return;
      }
      
      // Check if other VRF exports any RT that this VRF imports
      const hasMatchingExport = otherVRF.exports.some(rt => importedRTs.has(rt));
      
      if (hasMatchingExport) {
        // Add prefixes from this VRF as learned
        otherVRF.prefixes.forEach(cidr => {
          if (!prefixMap.has(cidr)) {
            prefixMap.set(cidr, {
              cidr,
              isLearned: true,
              sourceVRF: otherVRF.name,
              sourceNamespace: otherVRF.namespace
            });
          }
        });
      }
    });
    
    return Array.from(prefixMap.values());
  };

  const handleViewPrefixes = (vrf: VRF) => {
    setSelectedVRF(vrf);
    const prefixList = calculateLearnedPrefixes(vrf, vrfs);
    setPrefixes(prefixList);
    setPrefixDialogOpen(true);
  };

  const columns: GridColDef[] = [
    { 
      field: 'name', 
      headerName: 'Name', 
      flex: 1,
      minWidth: 150
    },
    { 
      field: 'namespace', 
      headerName: 'Namespace', 
      flex: 1,
      minWidth: 120
    },
    { 
      field: 'rd', 
      headerName: 'Route Distinguisher', 
      flex: 1,
      minWidth: 180
    },
    { 
        field: 'imports', 
        headerName: 'Imports', 
        width: 120,
        valueGetter: (value: string[]) => value?.length || 0
    },
    { 
        field: 'exports', 
        headerName: 'Exports', 
        width: 120, 
        valueGetter: (value: string[]) => value?.length || 0
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
            <Tooltip title="View Prefixes">
              <IconButton color="info" onClick={() => handleViewPrefixes(params.row)}>
                  <VisibilityIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton color="primary" onClick={() => navigate(`/vrfs/${params.row.namespace}/${params.row.name}`)}>
                  <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton color="error" onClick={() => handleDelete(params.row.namespace, params.row.name)}>
                  <DeleteIcon />
              </IconButton>
            </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
          Create VRF
        </Button>
      </Box>
      <DataGrid
        rows={vrfs}
        columns={columns}
        getRowId={(row) => `${row.namespace}-${row.name}`}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 10 },
          },
        }}
        pageSizeOptions={[5, 10, 25, 50]}
        loading={loading}
        autoHeight
        sx={{
          '& .MuiDataGrid-cell': {
            whiteSpace: 'normal',
            wordWrap: 'break-word',
          },
        }}
      />

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Create New VRF</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Namespace"
            fullWidth
            variant="outlined"
            value={newNamespace}
            onChange={(e) => setNewNamespace(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Name"
            fullWidth
            variant="outlined"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Route Distinguisher (RD)"
            fullWidth
            variant="outlined"
            placeholder="65000:100"
            value={newRD}
            onChange={(e) => setNewRD(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate}>Create</Button>
        </DialogActions>
      </Dialog>
      
      <Dialog 
        open={prefixDialogOpen} 
        onClose={() => setPrefixDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Prefixes for {selectedVRF?.namespace}/{selectedVRF?.name}
        </DialogTitle>
        <DialogContent>
          {prefixes.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No prefixes found for this VRF.
            </Typography>
          ) : (
            <List>
              {prefixes.map((prefix, index) => (
                <ListItem
                  key={index}
                  secondaryAction={
                    prefix.isLearned ? (
                      <Tooltip 
                        title={`Learned from ${prefix.sourceNamespace}/${prefix.sourceVRF}`}
                        arrow
                      >
                        <Chip
                          icon={<InfoIcon />}
                          label="Learned"
                          color="info"
                          size="small"
                          variant="outlined"
                        />
                      </Tooltip>
                    ) : (
                      <Chip
                        label="Owned"
                        color="primary"
                        size="small"
                        variant="filled"
                      />
                    )
                  }
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1">{prefix.cidr}</Typography>
                        {prefix.isLearned && (
                          <Tooltip 
                            title={`This prefix is learned from VRF ${prefix.sourceNamespace}/${prefix.sourceVRF} via import route target`}
                            arrow
                          >
                            <InfoIcon fontSize="small" color="info" />
                          </Tooltip>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPrefixDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}
