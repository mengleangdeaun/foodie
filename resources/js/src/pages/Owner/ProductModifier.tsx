import React, { useState, useEffect } from 'react';
import api from '@/util/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Link as LinkIcon, List, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch"; // Added Switch
import { useToast } from "@/hooks/use-toast";

import ProductModifierLinker from './components/ProductModifierLinker';
import ModifierGroupDialog from './components/ModifierGroupDialog';

const ModifierCenter = () => {
    const { toast } = useToast();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);

    useEffect(() => { fetchGroups(); }, []);

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/modifiers');
            setGroups(res.data);
        } finally { setLoading(false); }
    };

    // Quick toggle for group status directly from the table
    const toggleGroupStatus = async (group: any) => {
        try {
            const newStatus = !group.is_active;
            await api.put(`/admin/modifiers/${group.id}`, {
                ...group,
                is_active: newStatus,
                // Ensure modifiers are passed back to satisfy validation
                modifiers: group.modifiers 
            });
            
            setGroups(groups.map(g => g.id === group.id ? { ...g, is_active: newStatus } : g));
            toast({ title: "Status Updated", description: `${group.name} is now ${newStatus ? 'Active' : 'Hidden'}` });
        } catch (error) {
            toast({ variant: "destructive", title: "Update Failed", description: "Could not change status." });
        }
    };

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Product Customizations</h1>
                    <p className="text-sm text-muted-foreground">Manage add-ons, modifiers, and their product associations.</p>
                </div>
                <Button onClick={() => { setEditingGroup(null); setIsDialogOpen(true); }} className="rounded-md">
                    <Plus className="mr-2 h-4 w-4" /> Create Modifier Group
                </Button>
            </header>

            <Tabs defaultValue="library" className="space-y-6">
                <TabsList className="bg-muted/50 p-1 rounded-lg border border-border">
                    <TabsTrigger value="library" className="rounded-md px-6 flex gap-2">
                        <List size={14} /> Modifier Library
                    </TabsTrigger>
                    <TabsTrigger value="mapping" className="rounded-md px-6 flex gap-2">
                        <LinkIcon size={14} /> Link to Products
                    </TabsTrigger>
                </TabsList>

                {/* TAB 1: MODIFIER LIBRARY */}
                <TabsContent value="library" className="animate-in fade-in duration-300">
                    <Card className="rounded-lg border-border shadow-sm overflow-hidden bg-card">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow>
                                    <TableHead className="w-[250px] font-semibold">Group Name</TableHead>
                                    <TableHead className="font-semibold">Selection Type</TableHead>
                                    <TableHead className="font-semibold">Options Preview</TableHead>
                                    <TableHead className="font-semibold text-center">Active Status</TableHead>
                                    <TableHead className="text-right font-semibold">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-12">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ) : groups.map((group: any) => (
                                    <TableRow key={group.id} className={`hover:bg-muted/20 transition-colors ${!group.is_active ? 'opacity-60' : ''}`}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{group.name}</span>
                                                <span className="text-[10px] text-muted-foreground font-bold uppercase">{group.products_count ?? 0} Products Linked</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize font-normal text-[11px] border-primary/20 bg-primary/5">
                                                {group.selection_type} ({group.min_selection}-{group.max_selection})
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1.5">
                                                {group.modifiers?.slice(0, 3).map((m: any) => (
                                                    <Badge 
                                                        key={m.id} 
                                                        variant="secondary" 
                                                        className={`text-[10px] font-medium border-none ${
                                                            m.is_available ? "" : "opacity-50 line-through bg-muted"
                                                        }`}
                                                    >
                                                        {m.name}
                                                    </Badge>
                                                ))}
                                                {group.modifiers?.length > 3 && (
                                                    <span className="text-[10px] text-muted-foreground font-medium self-center">
                                                        +{group.modifiers.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex justify-center">
                                                <Switch 
                                                    checked={!!group.is_active} 
                                                    onCheckedChange={() => toggleGroupStatus(group)}
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right space-x-1">
                                            <Button variant="ghost" size="icon" onClick={() => { setEditingGroup(group); setIsDialogOpen(true); }}>
                                                <Pencil size={14} className="text-muted-foreground hover:text-primary" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                                                <Trash2 size={14} />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                <TabsContent value="mapping" className="animate-in fade-in duration-300">
                    <ProductModifierLinker modifierGroups={groups} onRefresh={fetchGroups} />
                </TabsContent>
            </Tabs>

            <ModifierGroupDialog 
                open={isDialogOpen} 
                onOpenChange={setIsDialogOpen} 
                group={editingGroup} 
                onSuccess={fetchGroups} 
            />
        </div>
    );
};

export default ModifierCenter;