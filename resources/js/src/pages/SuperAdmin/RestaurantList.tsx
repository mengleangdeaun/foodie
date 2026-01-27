import { useEffect, useState, useMemo } from 'react';
import api from '@/util/api';
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
    ColumnDef,
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Loader2, CheckCircle, XCircle, Edit, Ban } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import ConfirmationModal from "@/components/ConfirmationModal";
import EditTenantModal from './EditTenantModal';

export type Restaurant = {
    id: number;
    name: string;
    admin_name?: string; // Added from backend
    email?: string;      // Added from backend
    branches_count: number;
    is_active: boolean;
    created_at: string;
};

const RestaurantList = () => {
    const { toast } = useToast();
    const [data, setData] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalAction, setModalAction] = useState<'approve' | 'decline' | 'suspend' | null>(null);
    const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const [editModalOpen, setEditModalOpen] = useState(false);

    useEffect(() => {
        api.get('/super-admin/restaurants')
            .then(res => setData(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const openModal = (restaurant: Restaurant, action: 'approve' | 'decline' | 'suspend') => {
        setSelectedRestaurant(restaurant);
        setModalAction(action);
        setModalOpen(true);
    };

    const openEditModal = (restaurant: Restaurant) => {
        setSelectedRestaurant(restaurant);
        setEditModalOpen(true);
    };

    const handleConfirmAction = async () => {
        if (!selectedRestaurant || !modalAction) return;

        setActionLoading(true);
        try {
            if (modalAction === 'approve') {
                await api.post(`/super-admin/tenants/${selectedRestaurant.id}/approve`);
                toast({ title: "Tenant Approved", description: `${selectedRestaurant.name} has been activated.` });
                setData(prev => prev.map(r => r.id === selectedRestaurant.id ? { ...r, is_active: true } : r));
            } else if (modalAction === 'decline') {
                await api.post(`/super-admin/tenants/${selectedRestaurant.id}/decline`);
                toast({ title: "Tenant Declined", description: `${selectedRestaurant.name} has been removed.` });
                setData(prev => prev.filter(r => r.id !== selectedRestaurant.id));
            } else if (modalAction === 'suspend') {
                await api.post(`/super-admin/tenants/${selectedRestaurant.id}/suspend`);
                toast({ title: "Tenant Suspended", description: `${selectedRestaurant.name} has been suspended.` });
                setData(prev => prev.map(r => r.id === selectedRestaurant.id ? { ...r, is_active: false } : r));
            }
            setModalOpen(false);
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Error", description: "Failed to process request." });
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateSuccess = (updatedRestaurant: Restaurant) => {
        setData(prev => prev.map(r => r.id === updatedRestaurant.id ? { ...r, ...updatedRestaurant } : r));
    };

    const columns = useMemo<ColumnDef<Restaurant>[]>(() => [
        {
            accessorKey: "name",
            header: "Restaurant Name",
        },
        {
            accessorKey: "admin_name",
            header: "Admin Name",
            cell: ({ row }) => <div>{row.original.admin_name || '-'}</div>,
        },
        {
            accessorKey: "email",
            header: "Email",
            cell: ({ row }) => <div>{row.original.email || '-'}</div>,
        },
        {
            accessorKey: "branches_count",
            header: "Branches",
            cell: ({ row }) => <div>{row.getValue("branches_count")} locations</div>,
        },
        {
            accessorKey: "is_active",
            header: "Status",
            cell: ({ row }) => {
                const isActive = row.getValue("is_active");
                return (
                    <Badge variant={isActive ? "default" : "destructive"}>
                        {isActive ? "Active" : "Inactive"}
                    </Badge>
                );
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const restaurant = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openEditModal(restaurant)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit Details
                            </DropdownMenuItem>

                            {!restaurant.is_active && (
                                <>
                                    <DropdownMenuItem onClick={() => openModal(restaurant, 'approve')} className="text-green-600 focus:text-green-600 cursor-pointer">
                                        <CheckCircle className="mr-2 h-4 w-4" /> Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openModal(restaurant, 'decline')} className="text-destructive focus:text-destructive cursor-pointer">
                                        <XCircle className="mr-2 h-4 w-4" /> Decline
                                    </DropdownMenuItem>
                                </>
                            )}
                            {!!restaurant.is_active && (
                                <DropdownMenuItem onClick={() => openModal(restaurant, 'suspend')} className="text-destructive focus:text-destructive cursor-pointer">
                                    <Ban className="mr-2 h-4 w-4" /> Suspend account
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ], []);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <>
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Restaurant Management</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <TableHead key={header.id}>
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="h-24 text-center">
                                            Loading restaurants...
                                        </TableCell>
                                    </TableRow>
                                ) : table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow key={row.id}>
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id}>
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="h-24 text-center">
                                            No restaurants onboarded yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <ConfirmationModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onConfirm={handleConfirmAction}
                title={
                    modalAction === 'approve' ? "Approve Tenant" :
                        modalAction === 'decline' ? "Decline Tenant" : "Suspend Tenant"
                }
                description={
                    modalAction === 'approve'
                        ? `Are you sure you want to approve ${selectedRestaurant?.name}? They will be able to log in immediately.`
                        : modalAction === 'decline'
                            ? `Are you sure you want to decline ${selectedRestaurant?.name}? This action cannot be undone.`
                            : `Are you sure you want to suspend ${selectedRestaurant?.name}? They will no longer be able to log in.`
                }
                confirmText={modalAction === 'approve' ? "Approve" : modalAction === 'decline' ? "Decline" : "Suspend"}
                variant={modalAction === 'approve' ? "default" : "destructive"}
                isLoading={actionLoading}
            />

            <EditTenantModal
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                restaurant={selectedRestaurant}
                onSuccess={handleUpdateSuccess}
            />
        </>
    );
};

export default RestaurantList;