import { useEffect, useState } from 'react';
import api from '@/util/api';
import { useToast } from "@/hooks/use-toast";
import ConfirmationModal from '@/components/ConfirmationModal';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { QRCodeCanvas } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { QrCode, Plus, Pencil, Trash2, Download, RefreshCw, Copy, Link as LinkIcon, ExternalLink } from "lucide-react";

interface TableItem {
    id: number;
    table_number: string;
    qr_code_token: string;
    branch_id: number;
}

const OwnerTables = () => {
    const { toast } = useToast();
    const [branches, setBranches] = useState<any[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<string>('');
    const [tables, setTables] = useState<TableItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Dialog & Modal Visibility States
    const [openAdd, setOpenAdd] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);

    // Data States for Actions
    const [newTableNumber, setNewTableNumber] = useState('');
    const [editingTable, setEditingTable] = useState<TableItem | null>(null);
    const [tableInput, setTableInput] = useState('');
    const [activeTableId, setActiveTableId] = useState<number | null>(null);

    useEffect(() => {
        api.get('/admin/branches').then(res => {
            setBranches(res.data);
            if (res.data.length > 0) setSelectedBranch(res.data[0].id.toString());
        });
    }, []);

    useEffect(() => {
        if (selectedBranch) fetchTables();
    }, [selectedBranch]);

    const fetchTables = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/tables?branch_id=${selectedBranch}`);
            setTables(res.data);
        } finally {
            setLoading(false);
        }
    };

    // --- Action Handlers ---

    const handleAddTable = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/admin/tables', {
                branch_id: selectedBranch,
                table_number: newTableNumber
            });
            toast({ title: "Table Created", description: `Table ${newTableNumber} is now live.` });
            setNewTableNumber('');
            setOpenAdd(false);
            fetchTables();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Could not create table." });
        }
    };

    const handleUpdateTable = async () => {
        if (!editingTable) return;
        try {
            await api.put(`/admin/tables/${editingTable.id}`, { table_number: tableInput });
            toast({ title: "Updated", description: "Table name changed successfully." });
            setOpenEdit(false);
            fetchTables();
        } catch (error) {
            toast({ variant: "destructive", title: "Error" });
        }
    };

    const handleRegenerateToken = async () => {
        if (!activeTableId) return;
        setActionLoading(true);
        try {
            await api.post(`/admin/tables/${activeTableId}/regenerate`);
            toast({ title: "Token Reset", description: "A new secure QR link has been generated." });
            fetchTables();
        } catch (error) {
            toast({ variant: "destructive", title: "Reset Failed" });
        } finally {
            setActionLoading(false);
            setIsResetModalOpen(false);
            setActiveTableId(null);
        }
    };

    const handleDeleteTable = async () => {
        if (!activeTableId) return;
        setActionLoading(true);
        try {
            await api.delete(`/admin/tables/${activeTableId}`);
            toast({ title: "Deleted", description: "Table removed from the branch." });
            fetchTables();
        } catch (error) {
            toast({ variant: "destructive", title: "Deletion Failed" });
        } finally {
            setActionLoading(false);
            setIsDeleteModalOpen(false);
            setActiveTableId(null);
        }
    };

    const handleDownload = (tableNumber: string) => {
        const canvas = document.getElementById(`qr-${tableNumber}`) as HTMLCanvasElement;
        if (canvas) {
            // Find the selected branch object to get its name
            const currentBranch = branches.find((b: any) => b.id.toString() === selectedBranch);

            // Sanitize branch name for filename (replace spaces with underscores)
            const branchPrefix = currentBranch
                ? currentBranch.branch_name.replace(/\s+/g, '_')
                : 'Lotus';

            const pngUrl = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.href = pngUrl;

            // Updated filename format: BranchName_QR_Table_Number.png
            downloadLink.download = `${branchPrefix}_QR_Table_${tableNumber}.png`;

            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }
    };

    const handleCopyLink = (token: string) => {
        const url = `${window.location.origin}/menu/scan/${token}`;
        navigator.clipboard.writeText(url).then(() => {
            toast({ title: "Copied!", description: "Table URL copied to clipboard." });
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <QrCode className="h-6 w-6 text-primary" /> Table & QR Management
                    </h2>
                    <p className="text-muted-foreground text-sm">Secure scan-to-order tokens for physical tables.</p>
                </div>

                <div className="flex items-center gap-3">
                    <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                        <SelectTrigger className="w-[180px] h-9"><SelectValue placeholder="Select Branch" /></SelectTrigger>
                        <SelectContent>
                            {branches.map((b: any) => (
                                <SelectItem key={b.id} value={b.id.toString()}>{b.branch_name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Dialog open={openAdd} onOpenChange={setOpenAdd}>
                        <DialogTrigger asChild>
                            <Button size="sm" disabled={!selectedBranch}><Plus className="h-4 w-4 mr-2" /> Add Table</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Register New Table</DialogTitle></DialogHeader>
                            <form onSubmit={handleAddTable} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label>Table Number/Name</Label>
                                    <Input placeholder="e.g. Table 01" value={newTableNumber} onChange={(e) => setNewTableNumber(e.target.value)} required />
                                </div>
                                <Button type="submit" className="w-full">Create & Generate QR</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {loading ? (
                    Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)
                ) : tables.map((table) => (
                    <Card key={table.id} className="group relative overflow-hidden border hover:border-primary/50 hover:shadow-lg transition-all duration-300">
                        <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <Button variant="secondary" size="icon" className="h-8 w-8 shadow-sm" onClick={() => {
                                setEditingTable(table);
                                setTableInput(table.table_number);
                                setOpenEdit(true);
                            }}>
                                <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="destructive" size="icon" className="h-8 w-8 shadow-sm" onClick={() => {
                                setActiveTableId(table.id);
                                setIsDeleteModalOpen(true);
                            }}>
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>

                        <CardHeader className="pb-0 pt-6 text-center">
                            <CardTitle className="text-xl font-bold text-foreground">{table.table_number}</CardTitle>
                        </CardHeader>

                        <CardContent className="py-6 flex flex-col items-center gap-4">
                            <div className="p-4 bg-white rounded-2xl shadow-sm border group-hover:scale-105 transition-transform duration-300">
                                <QRCodeCanvas
                                    id={`qr-${table.table_number}`}
                                    value={`${window.location.origin}/menu/scan/${table.qr_code_token}`}
                                    size={150}
                                    level="H"
                                />
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground bg-muted/50 px-3 py-1 rounded-full cursor-pointer hover:bg-muted transition-colors"
                                onClick={() => handleCopyLink(table.qr_code_token)}
                            >
                                <ExternalLink className="h-3 w-3" />
                                {`${window.location.origin}/.../${table.qr_code_token.substring(0, 6)}`}
                            </div>
                        </CardContent>

                        <CardFooter className="grid grid-cols-3 gap-2 p-4 bg-muted/10 border-t">
                            <Button variant="outline" size="sm" className="h-8 text-xs w-full" onClick={() => handleCopyLink(table.qr_code_token)}>
                                <Copy className="h-3 w-3 mr-1.5" /> Copy
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 text-xs w-full" onClick={() => handleDownload(table.table_number)}>
                                <Download className="h-3 w-3 mr-1.5" /> Save
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 text-xs w-full text-muted-foreground hover:text-destructive" onClick={() => {
                                setActiveTableId(table.id);
                                setIsResetModalOpen(true);
                            }}>
                                <RefreshCw className="h-3 w-3 mr-1.5" /> Reset
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {/* EDIT DIALOG */}
            <Dialog open={openEdit} onOpenChange={setOpenEdit}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Edit Table Details</DialogTitle></DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Table Name/Number</Label>
                            <Input value={tableInput} onChange={(e) => setTableInput(e.target.value)} />
                        </div>
                        <Button className="w-full" onClick={handleUpdateTable}>Save Changes</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* RESET TOKEN MODAL (Warning Style) */}
            <ConfirmationModal
                isOpen={isResetModalOpen}
                isLoading={actionLoading}
                onClose={() => setIsResetModalOpen(false)}
                onConfirm={handleRegenerateToken}
                title="Regenerate QR Token?"
                description="The current physical QR code will stop working immediately. You will need to print and replace the sticker for this table."
                confirmText="Reset Token"
            />

            {/* DELETE TABLE MODAL (Destructive Style) */}
            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteTable}
            />
        </div>
    );
};

export default OwnerTables;