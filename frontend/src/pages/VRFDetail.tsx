import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Box, Typography, Paper, Grid, List, ListItem, ListItemText, 
    IconButton, TextField, Button, Chip, Stack,
    Alert, Snackbar
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { 
    getVRF, addImport, removeImport, addExport, removeExport, addPrefix, removePrefix 
} from '../api/vrf';
import type { VRF } from '../api/vrf';

export default function VRFDetail() {
    const { namespace, name } = useParams<{ namespace: string, name: string }>();
    const navigate = useNavigate();
    const [vrf, setVrf] = useState<VRF | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Input States
    const [newImport, setNewImport] = useState('');
    const [newExport, setNewExport] = useState('');
    const [newPrefix, setNewPrefix] = useState('');

    // Input Refs
    const importInputRef = useRef<HTMLInputElement>(null);
    const exportInputRef = useRef<HTMLInputElement>(null);
    const prefixInputRef = useRef<HTMLInputElement>(null);

    const fetchVRF = async () => {
        if (!namespace || !name) return;
        try {
            setLoading(true);
            const data = await getVRF(namespace, name);
            setVrf(data);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch VRF details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVRF();
    }, [namespace, name]);

    const handleAddImport = async () => {
        if(!vrf || !newImport) return;
        try {
            await addImport(vrf.namespace, vrf.name, newImport);
            setNewImport('');
            await fetchVRF();
            // Focus the input after fetch completes
            setTimeout(() => {
                const input = importInputRef.current;
                if (input) {
                    input.focus();
                    input.setSelectionRange(0, 0);
                }
            }, 50);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to add Import RT');
            // Focus the input on error too
            setTimeout(() => {
                const input = importInputRef.current;
                if (input) {
                    input.focus();
                    input.setSelectionRange(0, 0);
                }
            }, 50);
        }
    }

    const handleRemoveImport = async (rt: string) => {
        if(!vrf) return;
        try {
            await removeImport(vrf.namespace, vrf.name, rt);
            fetchVRF();
        } catch (err: any) {
             setError(err.response?.data?.detail || 'Failed to remove Import RT');
        }
    }

    const handleAddExport = async () => {
        if(!vrf || !newExport) return;
        try {
            await addExport(vrf.namespace, vrf.name, newExport);
            setNewExport('');
            await fetchVRF();
            // Focus the input after fetch completes
            setTimeout(() => {
                const input = exportInputRef.current;
                if (input) {
                    input.focus();
                    input.setSelectionRange(0, 0);
                }
            }, 50);
        } catch (err: any) {
             setError(err.response?.data?.detail || 'Failed to add Export RT');
            // Focus the input on error too
            setTimeout(() => {
                const input = exportInputRef.current;
                if (input) {
                    input.focus();
                    input.setSelectionRange(0, 0);
                }
            }, 50);
        }
    }

    const handleRemoveExport = async (rt: string) => {
        if(!vrf) return;
        try {
            await removeExport(vrf.namespace, vrf.name, rt);
            fetchVRF();
        } catch (err: any) {
             setError(err.response?.data?.detail || 'Failed to remove Export RT');
        }
    }

    const handleAddPrefix = async () => {
        if(!vrf || !newPrefix) return;
        try {
            await addPrefix(vrf.namespace, vrf.name, newPrefix);
            setNewPrefix('');
            await fetchVRF();
            // Focus the input after fetch completes
            setTimeout(() => {
                const input = prefixInputRef.current;
                if (input) {
                    input.focus();
                    input.setSelectionRange(0, 0);
                }
            }, 50);
        } catch (err: any) {
             setError(err.response?.data?.detail || 'Failed to add Prefix');
            // Focus the input on error too
            setTimeout(() => {
                const input = prefixInputRef.current;
                if (input) {
                    input.focus();
                    input.setSelectionRange(0, 0);
                }
            }, 50);
        }
    }

    const handleRemovePrefix = async (cidr: string) => {
        if(!vrf) return;
        try {
            await removePrefix(vrf.namespace, vrf.name, cidr);
            fetchVRF();
        } catch (err: any) {
             setError(err.response?.data?.detail || 'Failed to remove Prefix');
        }
    }

    if (loading) return <Typography>Loading...</Typography>;
    if (!vrf) return <Typography>VRF not found</Typography>;

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <IconButton onClick={() => navigate('/vrfs')} sx={{ mr: 2 }}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h4">
                    {vrf.name} <Typography component="span" variant="h6" color="text.secondary">({vrf.namespace})</Typography>
                </Typography>
                <Box sx={{ flexGrow: 1 }} />
                <Chip label={`RD: ${vrf.rd}`} color="primary" variant="outlined" />
            </Box>

            <Grid container spacing={3}>
                {/* Imports */}
                <Grid size={4}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>Import RTs</Typography>
                        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                            <TextField 
                                inputRef={importInputRef}
                                size="small" 
                                placeholder="ASN:NN" 
                                value={newImport}
                                onChange={(e) => setNewImport(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleAddImport();
                                    }
                                }}
                                fullWidth
                            />
                            <Button variant="contained" onClick={handleAddImport}><AddIcon /></Button>
                        </Stack>
                        <List dense>
                            {vrf.imports.map(rt => (
                                <ListItem key={rt} secondaryAction={
                                    <IconButton edge="end" onClick={() => handleRemoveImport(rt)}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                }>
                                    <ListItemText primary={rt} />
                                </ListItem>
                            ))}
                            {vrf.imports.length === 0 && <Typography variant="body2" color="text.secondary">No import targets</Typography>}
                        </List>
                    </Paper>
                </Grid>

                {/* Exports */}
                <Grid size={4}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>Export RTs</Typography>
                        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                            <TextField 
                                inputRef={exportInputRef}
                                size="small" 
                                placeholder="ASN:NN" 
                                value={newExport}
                                onChange={(e) => setNewExport(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleAddExport();
                                    }
                                }}
                                fullWidth
                            />
                            <Button variant="contained" onClick={handleAddExport}><AddIcon /></Button>
                        </Stack>
                        <List dense>
                            {vrf.exports.map(rt => (
                                <ListItem key={rt} secondaryAction={
                                    <IconButton edge="end" onClick={() => handleRemoveExport(rt)}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                }>
                                    <ListItemText primary={rt} />
                                </ListItem>
                            ))}
                            {vrf.exports.length === 0 && <Typography variant="body2" color="text.secondary">No export targets</Typography>}
                        </List>
                    </Paper>
                </Grid>

                {/* Prefixes */}
                <Grid size={4}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>Prefixes</Typography>
                         <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                            <TextField 
                                inputRef={prefixInputRef}
                                size="small" 
                                placeholder="10.0.0.0/24" 
                                value={newPrefix}
                                onChange={(e) => setNewPrefix(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleAddPrefix();
                                    }
                                }}
                                fullWidth
                            />
                            <Button variant="contained" onClick={handleAddPrefix}><AddIcon /></Button>
                        </Stack>
                         <List dense>
                            {vrf.prefixes.map(p => (
                                <ListItem key={p} secondaryAction={
                                    <IconButton edge="end" onClick={() => handleRemovePrefix(p)}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                }>
                                    <ListItemText primary={p} />
                                </ListItem>
                            ))}
                            {vrf.prefixes.length === 0 && <Typography variant="body2" color="text.secondary">No prefixes</Typography>}
                        </List>
                    </Paper>
                </Grid>
            </Grid>

             <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
                <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
                  {error}
                </Alert>
              </Snackbar>
        </Box>
    );
}
