import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  QrCode,
  Plus,
  Pencil,
  Trash2,
  Download,
  RefreshCw,
  Copy,
  ExternalLink,
  Building,
  Table as TableIcon,
  Link,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  MoreVertical,
  FileText,
  Image
} from "lucide-react";

interface TableItem {
  id: number;
  table_number: string;
  qr_code_token: string;
  branch_id: number;
  created_at?: string;
  updated_at?: string;
}

interface Branch {
  id: number;
  branch_name: string;
  address?: string;
}

// Custom debounce hook
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const OwnerTables = () => {
  const { toast } = useToast();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [tables, setTables] = useState<TableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Download State
  const [downloadConfig, setDownloadConfig] = useState<{
    tableNumber: string;
    token: string;
    type: 'png' | 'pdf';
  } | null>(null);
  const downloadQrRef = useRef<HTMLCanvasElement>(null);

  // Dialog & Modal States
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [previewQr, setPreviewQr] = useState<{ tableNumber: string; token: string } | null>(null);

  // Data States
  const [newTableNumber, setNewTableNumber] = useState('');
  const [editingTable, setEditingTable] = useState<TableItem | null>(null);
  const [tableInput, setTableInput] = useState('');
  const [activeTableId, setActiveTableId] = useState<number | null>(null);
  const [activeMenuTable, setActiveMenuTable] = useState<TableItem | null>(null);

  // Fetch branches on mount
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await api.get('/admin/branches');
        setBranches(res.data);
        if (res.data.length > 0) {
          setSelectedBranch(res.data[0].id.toString());
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Failed to load branches",
          description: "Please try again later."
        });
      }
    };
    fetchBranches();
  }, [toast]);

  // Fetch tables when branch changes
  useEffect(() => {
    if (selectedBranch) fetchTables();
  }, [selectedBranch]);

  const fetchTables = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/tables?branch_id=${selectedBranch}`);
      setTables(res.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to load tables",
        description: "Unable to fetch table data."
      });
    } finally {
      setLoading(false);
    }
  }, [selectedBranch, toast]);

  // Handle Download Effect
  useEffect(() => {
    const processDownload = async () => {
      if (!downloadConfig || !downloadQrRef.current) return;

      const { tableNumber, token, type } = downloadConfig;
      const canvas = downloadQrRef.current;
      const currentBranch = branches.find(b => b.id.toString() === selectedBranch);
      const branchName = currentBranch?.branch_name || 'Unknown Branch';
      const branchPrefix = branchName.replace(/[^a-z0-9]/gi, '_').toLowerCase();

      try {
        if (type === 'png') {
          const pngUrl = canvas.toDataURL("image/png", 1.0);
          const downloadLink = document.createElement("a");
          downloadLink.href = pngUrl;
          downloadLink.download = `${branchPrefix}_table_${tableNumber}_qr.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);

          toast({
            title: "QR Code Downloaded",
            description: `High-resolution PNG for Table ${tableNumber} saved.`
          });
        } else if (type === 'pdf') {
          const { jsPDF } = await import('jspdf');
          const qrDataUrl = canvas.toDataURL('image/png');

          const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
          });

          const pageWidth = doc.internal.pageSize.getWidth();
          const pageHeight = doc.internal.pageSize.getHeight();
          const url = `${window.location.origin}/menu/scan/${token}`;

          // Add header
          doc.setFontSize(24);
          doc.setTextColor(40, 40, 40);
          doc.text(branchName, pageWidth / 2, 20, { align: 'center' });

          // Add table number
          doc.setFontSize(18);
          doc.setTextColor(60, 60, 60);
          doc.text(`Table: ${tableNumber}`, pageWidth / 2, 30, { align: 'center' });

          // Add QR code
          const qrWidth = 80;
          const qrHeight = 80;
          const qrX = (pageWidth - qrWidth) / 2;
          const qrY = 40;
          doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrWidth, qrHeight);

          // Add URL
          doc.setFontSize(10);
          doc.setTextColor(100, 100, 100);
          const urlY = qrY + qrHeight + 10;
          doc.text('Scan this QR code to view menu:', pageWidth / 2, urlY, { align: 'center' });

          doc.setFontSize(9);
          doc.setTextColor(30, 64, 175);
          doc.text(url, pageWidth / 2, urlY + 5, { align: 'center' });

          // Add footer
          doc.setFontSize(8);
          doc.setTextColor(120, 120, 120);
          const footerY = pageHeight - 10;
          doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, footerY, { align: 'center' });

          const fileName = `${branchPrefix}_table_${tableNumber}_qr.pdf`;
          doc.save(fileName);

          toast({
            title: "PDF Downloaded",
            description: `High-resolution PDF for Table ${tableNumber} saved.`
          });
        }
      } catch (error) {
        console.error('Download error:', error);
        toast({
          variant: "destructive",
          title: "Download Failed",
          description: "An error occurred while generating the file."
        });
      } finally {
        setDownloadConfig(null);
      }
    };

    // Small timeout to ensure canvas is rendered
    const timeoutId = setTimeout(processDownload, 100);
    return () => clearTimeout(timeoutId);
  }, [downloadConfig, branches, selectedBranch, toast]);

  // Filter tables based on search
  const filteredTables = useMemo(() => {
    const search = typeof debouncedSearch === 'string' ? debouncedSearch.toLowerCase() : '';
    return tables.filter(table =>
      table.table_number.toLowerCase().includes(search)
    );
  }, [tables, debouncedSearch]);

  // Action Handlers
  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post('/admin/tables', {
        branch_id: selectedBranch,
        table_number: newTableNumber.trim()
      });
      toast({
        title: "Table Created",
        description: `Table "${newTableNumber}" has been created successfully.`,
        action: <CheckCircle className="h-4 w-4 text-green-500" />
      });
      setNewTableNumber('');
      setOpenAdd(false);
      await fetchTables();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: error.response?.data?.message || "Could not create table."
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateTable = async () => {
    if (!editingTable || !tableInput.trim()) return;
    setActionLoading(true);
    try {
      await api.put(`/admin/tables/${editingTable.id}`, {
        table_number: tableInput.trim()
      });
      toast({
        title: "Table Updated",
        description: "Table name has been updated successfully."
      });
      setOpenEdit(false);
      await fetchTables();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.response?.data?.message || "Could not update table."
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRegenerateToken = async () => {
    if (!activeTableId) return;
    setActionLoading(true);
    try {
      await api.post(`/admin/tables/${activeTableId}/regenerate`);
      toast({
        title: "QR Token Reset",
        description: "A new secure QR link has been generated. Please update physical QR codes.",
        action: <AlertCircle className="h-4 w-4 text-amber-500" />
      });
      await fetchTables();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: "Unable to regenerate token."
      });
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
      toast({
        title: "Table Deleted",
        description: "Table has been removed from the branch.",
        action: <CheckCircle className="h-4 w-4 text-green-500" />
      });
      await fetchTables();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: "Unable to delete table."
      });
    } finally {
      setActionLoading(false);
      setIsDeleteModalOpen(false);
      setActiveTableId(null);
    }
  };

  const handleDownloadPNG = (tableNumber: string, token: string) => {
    setDownloadConfig({ tableNumber, token, type: 'png' });
  };

  const handleDownloadPDF = (tableNumber: string, token: string) => {
    setDownloadConfig({ tableNumber, token, type: 'pdf' });
  };

  const handleCopyLink = (token: string, tableNumber: string) => {
    const url = `${window.location.origin}/menu/scan/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: "Link Copied",
        description: `URL for Table ${tableNumber} copied to clipboard.`
      });
    });
  };

  const getSelectedBranchName = () => {
    return branches.find(b => b.id.toString() === selectedBranch)?.branch_name || '';
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  // Skeleton Loader
  const TableCardSkeleton = () => (
    <Card className="animate-pulse">
      <CardHeader className="pb-4">
        <Skeleton className="h-6 w-24 mx-auto" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-40 w-40 mx-auto rounded-lg" />
        <Skeleton className="h-4 w-full" />
      </CardContent>
      <CardFooter className="grid grid-cols-3 gap-2">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </CardFooter>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Hidden High-res QR Render for Download */}
      {downloadConfig && (
        <div className="absolute top-0 left-0 -z-50 opacity-0 pointer-events-none">
          <QRCodeCanvas
            ref={downloadQrRef}
            value={`${window.location.origin}/menu/scan/${downloadConfig.token}`}
            size={1000} // High resolution
            level="H"
            includeMargin
            bgColor="#ffffff"
            fgColor="#000000"
          />
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <QrCode className="h-8 w-8 text-primary" />
            Table & QR Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage physical tables and their QR codes for scan-to-order functionality.
          </p>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between p-4 bg-card border rounded-lg">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="w-full sm:w-auto">
              <Label htmlFor="branch-select" className="text-sm font-medium mb-2 block">
                <Building className="inline h-4 w-4 mr-1" />
                Select Branch
              </Label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger id="branch-select" className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Choose branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id.toString()}>
                      {branch.branch_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-auto">
              <Label htmlFor="table-search" className="text-sm font-medium mb-2 block">
                <Search className="inline h-4 w-4 mr-1" />
                Search Tables
              </Label>
              <div className="relative">
                <Input
                  id="table-search"
                  placeholder="Search by table number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-[250px] pl-9"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
                    onClick={clearSearch}
                  >
                    ×
                  </Button>
                )}
              </div>
            </div>
          </div>

          <Dialog open={openAdd} onOpenChange={setOpenAdd}>
            <DialogTrigger asChild>
              <Button
                className="mt-2 md:mt-0"
                disabled={!selectedBranch || branches.length === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Table
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Register New Table</DialogTitle>
                <DialogDescription>
                  Add a new table to {getSelectedBranchName()}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddTable} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="table-number">Table Number/Name *</Label>
                  <Input
                    id="table-number"
                    placeholder="e.g., Table 01, Counter 1, Booth A"
                    value={newTableNumber}
                    onChange={(e) => setNewTableNumber(e.target.value)}
                    required
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    This will be displayed to customers when they scan the QR code.
                  </p>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpenAdd(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={actionLoading}>
                    {actionLoading ? "Creating..." : "Create Table"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Tables</p>
                  <p className="text-2xl font-bold">{tables.length}</p>
                </div>
                <TableIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Branch</p>
                  <p className="text-lg font-semibold truncate">{getSelectedBranchName()}</p>
                </div>
                <Building className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Showing</p>
                  <p className="text-2xl font-bold">
                    {filteredTables.length} of {tables.length}
                  </p>
                </div>
                <Filter className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tables Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <TableCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredTables.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="space-y-4">
            <TableIcon className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-semibold">No Tables Found</h3>
            <p className="text-muted-foreground">
              {searchTerm
                ? `No tables matching "${searchTerm}" in ${getSelectedBranchName()}`
                : `No tables found for ${getSelectedBranchName()}. Add your first table.`
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => setOpenAdd(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Table
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTables.map((table) => (
              <Card
                key={table.id}
                className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20"
              >
                {/* Action Menu - FIXED: Always visible but subtle */}
                <div className="absolute top-3 right-3 z-10 flex gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 bg-background/90 backdrop-blur-sm hover:bg-background shadow-sm border"
                        aria-label="Table actions"
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingTable(table);
                          setTableInput(table.table_number);
                          setOpenEdit(true);
                        }}
                        className="cursor-pointer"
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Table
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setActiveTableId(table.id);
                          setIsResetModalOpen(true);
                        }}
                        className="cursor-pointer"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reset Token
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setActiveTableId(table.id);
                          setIsDeleteModalOpen(true);
                        }}
                        className="cursor-pointer text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Table
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <CardHeader className="pb-3 pt-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <TableIcon className="h-5 w-5 text-primary" />
                      {table.table_number}
                    </CardTitle>
                  </div>
                </CardHeader>

                <CardContent className="py-4">
                  <div className="flex flex-col items-center gap-4">
                    <div
                      className="p-3 bg-white rounded-xl border cursor-pointer hover:scale-[1.02] transition-transform"
                      onClick={() => setPreviewQr({
                        tableNumber: table.table_number,
                        token: table.qr_code_token
                      })}
                    >
                      <QRCodeCanvas
                        id={`qr-${table.qr_code_token}`}
                        value={`${window.location.origin}/menu/scan/${table.qr_code_token}`}
                        size={140}
                        level="H"
                        includeMargin
                        fgColor="#1a1a1a"
                      />
                    </div>

                    <div className="w-full">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Link className="h-3 w-3" />
                        <span className="font-medium">Table URL:</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                        <code className="text-xs truncate flex-1">
                          .../{table.qr_code_token.substring(0, 8)}...
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleCopyLink(table.qr_code_token, table.table_number)}
                          aria-label="Copy table URL"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="grid grid-cols-2 gap-2 p-4 border-t bg-muted/5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyLink(table.qr_code_token, table.table_number)}
                    className="h-9"
                  >
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    Copy
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9"
                      >
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        Download
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={() => handleDownloadPNG(table.table_number, table.qr_code_token)}
                        className="cursor-pointer"
                      >
                        <Image className="h-4 w-4 mr-2" />
                        PNG Image (High-Res)
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDownloadPDF(table.table_number, table.qr_code_token)}
                        className="cursor-pointer"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        PDF Document
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Table Count Footer */}
          <div className="text-sm text-muted-foreground text-center pt-2">
            Showing {filteredTables.length} table{filteredTables.length !== 1 ? 's' : ''} in {getSelectedBranchName()}
            {searchTerm && ` matching "${searchTerm}"`}
          </div>
        </>
      )}

      {/* Edit Dialog */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Table</DialogTitle>
            <DialogDescription>
              Update table details for {editingTable?.table_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-table-number">Table Number/Name</Label>
              <Input
                id="edit-table-number"
                value={tableInput}
                onChange={(e) => setTableInput(e.target.value)}
                placeholder="Enter new table name"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOpenEdit(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateTable}
                disabled={!tableInput.trim() || actionLoading}
              >
                {actionLoading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Preview Dialog */}
      <Dialog open={!!previewQr} onOpenChange={() => setPreviewQr(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code Preview</DialogTitle>
            <DialogDescription>
              Table: {previewQr?.tableNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-4">
            {previewQr && (
              <div className="p-6 bg-white rounded-2xl border-2">
                <QRCodeCanvas
                  value={`${window.location.origin}/menu/scan/${previewQr.token}`}
                  size={200}
                  level="H"
                  includeMargin
                />
              </div>
            )}
            <div className="flex gap-2 w-full">
              <Button
                onClick={() => previewQr && handleDownloadPNG(previewQr.tableNumber, previewQr.token)}
                className="flex-1"
              >
                <Image className="h-4 w-4 mr-2" />
                PNG
              </Button>
              <Button
                onClick={() => previewQr && handleDownloadPDF(previewQr.tableNumber, previewQr.token)}
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Token Modal */}
      <ConfirmationModal
        isOpen={isResetModalOpen}
        isLoading={actionLoading}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleRegenerateToken}
        title="Regenerate QR Token"
        description={
          <div className="space-y-2">
            <p>This will invalidate the current QR code immediately.</p>
            <ul className="list-disc pl-5 text-sm space-y-1">
              <li>Existing physical QR codes will stop working</li>
              <li>You must print and replace the QR sticker</li>
              <li>Customers scanning old codes will see an error</li>
            </ul>
          </div>
        }
        confirmText="Regenerate Token"
        variant="destructive"
        icon={<RefreshCw className="h-5 w-5 text-amber-500" />}
      />

      {/* Delete Table Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteTable}
        title="Delete Table"
        description="This action cannot be undone. All associated QR codes will become invalid."
        loading={actionLoading}
      />
    </div>
  );
};

export default OwnerTables;