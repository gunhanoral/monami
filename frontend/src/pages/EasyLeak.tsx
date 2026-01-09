import { useEffect, useState } from 'react';
import { 
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, Checkbox, Button, Alert, Snackbar, Tooltip
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { getVRFs, addImport, removeImport } from '../api/vrf';
import type { VRF } from '../api/vrf';

export default function EasyLeak() {
    const [vrfs, setVrfs] = useState<VRF[]>([]);
    const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Filtered lists
    // Columns: VRFs that have at least one Export RT
    // Rows: All VRFs (potentially importing)
    const [exportingVrfs, setExportingVrfs] = useState<VRF[]>([]);

    const fetchVRFs = async () => {
        try {
            setLoading(true);
            const data = await getVRFs();
            setVrfs(data);
            
            // Determine columns (Sources)
            const sources = data.filter(v => v.exports.length > 0);
            setExportingVrfs(sources);

            // Build initial matrix state
            // matrix[rowId][colId] = true if row VRF imports col VRF's first export RT
            const initialMatrix: Record<string, Record<string, boolean>> = {};
            
            data.forEach(rowVrf => {
                const rowId = `${rowVrf.namespace}:${rowVrf.name}`;
                initialMatrix[rowId] = {};
                
                sources.forEach(colVrf => {
                    const colId = `${colVrf.namespace}:${colVrf.name}`;
                    // Check if rowVrf imports ANY of colVrf's exports? 
                    // Requirement: "If enabled, row vrf imports column vrf's FIRST exported route target"
                    // So we verify against the first export RT only.
                    const targetRT = colVrf.exports[0];
                    const isImported = rowVrf.imports.includes(targetRT);
                    initialMatrix[rowId][colId] = isImported;
                });
            });
            setMatrix(initialMatrix);

        } catch (err) {
            console.error(err);
            setError('Failed to fetch VRF data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVRFs();
    }, []);

    const handleToggle = (rowId: string, colId: string) => {
        setMatrix(prev => ({
            ...prev,
            [rowId]: {
                ...prev[rowId],
                [colId]: !prev[rowId][colId]
            }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(null);
        
        try {
            // We need to compare current matrix state with original DB state to minimize API calls?
            // Or just enforce state.
            // For simplicity in this "bulk save" approach, we iterate and enforce.
            // Ideally we track diffs, but let's iterate.
            
            const promises = [];

            for (const rowVrf of vrfs) {
                const rowId = `${rowVrf.namespace}:${rowVrf.name}`;
                
                for (const colVrf of exportingVrfs) {
                    const colId = `${colVrf.namespace}:${colVrf.name}`;
                    const shouldImport = matrix[rowId][colId];
                    const targetRT = colVrf.exports[0]; // The "first export" rule
                    
                    const currentlyImported = rowVrf.imports.includes(targetRT);
                    
                    if (shouldImport && !currentlyImported) {
                        // Add Import
                         promises.push(addImport(rowVrf.namespace, rowVrf.name, targetRT));
                    } else if (!shouldImport && currentlyImported) {
                        // Remove Import
                         promises.push(removeImport(rowVrf.namespace, rowVrf.name, targetRT));
                    }
                }
            }

            await Promise.all(promises);
            setSuccess('Route leaks updated successfully');
            fetchVRFs(); // Refresh state

        } catch (err: any) {
            console.error(err);
            setError('Failed to save changes. Partial updates may have occurred.');
            fetchVRFs();
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Typography>Loading...</Typography>;

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                 <Typography variant="h5">Easy Leak Matrix</Typography>
                 <Button 
                    variant="contained" 
                    startIcon={<SaveIcon />} 
                    onClick={handleSave}
                    disabled={saving}
                 >
                     {saving ? 'Saving...' : 'Save Changes'}
                 </Button>
            </Box>

            <Typography variant="body2" color="text.secondary" paragraph>
                Rows represent the <strong>Destination</strong> (Importing) VRF. 
                Columns represent the <strong>Source</strong> (Exporting) VRF. 
                Checking a box imports the source's first Export RT into the destination.
            </Typography>

            <TableContainer component={Paper} sx={{ maxHeight: '70vh' }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold', zIndex: 1100 }}>Destination \ Source</TableCell>
                            {exportingVrfs.map(col => (
                                <TableCell key={`${col.namespace}:${col.name}`} align="center" sx={{ minWidth: 100 }}>
                                    <Tooltip title={`RT: ${col.exports[0]}`}>
                                        <span>
                                            {col.name}<br/>
                                            <Typography variant="caption" color="text.secondary">{col.namespace}</Typography>
                                        </span>
                                    </Tooltip>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {vrfs.map(row => {
                            const rowId = `${row.namespace}:${row.name}`;
                            return (
                                <TableRow key={rowId} hover>
                                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold', position: 'sticky', left: 0, background: 'inherit' }}>
                                        {row.name}
                                        <br/>
                                        <Typography variant="caption" color="text.secondary">{row.namespace}</Typography>
                                    </TableCell>
                                    {exportingVrfs.map(col => {
                                        const colId = `${col.namespace}:${col.name}`;
                                        // Disable self-leak if same VRF?
                                        const isSelf = rowId === colId;
                                        
                                        return (
                                            <TableCell key={colId} align="center">
                                                <Checkbox 
                                                    checked={matrix[rowId]?.[colId] || false}
                                                    onChange={() => handleToggle(rowId, colId)}
                                                    disabled={isSelf}
                                                    size="small"
                                                />
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
                <Alert onClose={() => setError(null)} severity="error">{error}</Alert>
            </Snackbar>
             <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess(null)}>
                <Alert onClose={() => setSuccess(null)} severity="success">{success}</Alert>
            </Snackbar>
        </Box>
    );
}
