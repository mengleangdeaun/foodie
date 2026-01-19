import React, { useEffect, useState } from 'react';
import api from '@/util/api';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, DollarSign, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ModifierOption {
    id?: number;
    name: string;
    price: number;
    is_available: boolean;
}

const ModifierGroupDialog = ({ open, onOpenChange, group, onSuccess }: any) => {
    const { toast } = useToast();
    const [submitting, setSubmitting] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        selection_type: 'single',
        min_selection: 0,
        max_selection: 1,
        is_active: true, // Group-level active status
        modifiers: [] as ModifierOption[]
    });

    // Sync form data when dialog opens
    useEffect(() => {
        if (group) {
            setFormData({
                name: group.name,
                selection_type: group.selection_type,
                min_selection: group.min_selection,
                max_selection: group.max_selection,
                is_active: !!group.is_active, 
                modifiers: group.modifiers || []
            });
        } else {
            setFormData({
                name: '',
                selection_type: 'single',
                min_selection: 0,
                max_selection: 1,
                is_active: true,
                modifiers: [{ name: '', price: 0, is_available: true }]
            });
        }
    }, [group, open]);

    const addModifierRow = () => {
        setFormData({
            ...formData,
            modifiers: [...formData.modifiers, { name: '', price: 0, is_available: true }]
        });
    };

    const removeModifierRow = (index: number) => {
        const newMods = [...formData.modifiers];
        newMods.splice(index, 1);
        setFormData({ ...formData, modifiers: newMods });
    };

    const updateModifier = (index: number, field: keyof ModifierOption, value: any) => {
        const newMods = [...formData.modifiers];
        newMods[index] = { ...newMods[index], [field]: value };
        setFormData({ ...formData, modifiers: newMods });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (formData.modifiers.length === 0) {
            return toast({ variant: "destructive", title: "Missing Options", description: "Add at least one modifier option." });
        }

        setSubmitting(true);
        try {
            if (group?.id) {
                await api.put(`/admin/modifiers/${group.id}`, formData);
                toast({ title: "Success", description: "Modifier group updated." });
            } else {
                await api.post('/admin/modifiers', formData);
                toast({ title: "Success", description: "Modifier group created." });
            }
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast({ 
                variant: "destructive", 
                title: "Error", 
                description: error.response?.data?.message || "Something went wrong." 
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* Dark mode support: bg-background border-border text-foreground */}
            <DialogContent className="sm:max-w-[620px] p-0 overflow-hidden rounded-lg border-border bg-background text-foreground shadow-2xl">
                
                <DialogHeader className="p-6 bg-muted/30 border-b border-border">
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <DialogTitle className="text-xl font-bold">
                                {group ? 'Edit Modifier Group' : 'New Modifier Group'}
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground">
                                Define customization options and pricing for your products.
                            </DialogDescription>
                        </div>
                        
                        {/* GLOBAL GROUP TOGGLE */}
                        <div className="flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl bg-background border border-border shadow-sm">
                            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-tighter">Active Status</span>
                            <Switch 
                                checked={formData.is_active} 
                                onCheckedChange={(v) => setFormData({...formData, is_active: v})}
                            />
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-6">
                        {/* Group Settings */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">Group Name</Label>
                                <Input 
                                    placeholder="e.g. Sugar Level" 
                                    value={formData.name} 
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    className="h-10 border-border focus:ring-primary"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">Selection Type</Label>
                                <Select 
                                    value={formData.selection_type} 
                                    onValueChange={v => setFormData({...formData, selection_type: v, max_selection: v === 'single' ? 1 : formData.max_selection})}
                                >
                                    <SelectTrigger className="h-10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="single">Single (Radio)</SelectItem>
                                        <SelectItem value="multiple">Multiple (Checkbox)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Selection Logic */}
                        <div className="grid grid-cols-2 gap-6 p-4 bg-muted/20 rounded-lg border border-border">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-foreground">Min. Selection</Label>
                                <Input 
                                    type="number" 
                                    min="0"
                                    value={formData.min_selection} 
                                    onChange={e => setFormData({...formData, min_selection: parseInt(e.target.value)})}
                                    className="bg-background"
                                />
                                <p className="text-[10px] text-muted-foreground italic">Set to 1 to make this group mandatory.</p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-foreground">Max. Selection</Label>
                                <Input 
                                    type="number" 
                                    min="1"
                                    disabled={formData.selection_type === 'single'}
                                    value={formData.max_selection} 
                                    onChange={e => setFormData({...formData, max_selection: parseInt(e.target.value)})}
                                    className="bg-background"
                                />
                            </div>
                        </div>

                        {/* Modifier List */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-border pb-2">
                                <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Options & Pricing</Label>
                                <Button type="button" variant="outline" size="sm" onClick={addModifierRow} className="h-8 text-[10px] font-bold uppercase">
                                    <Plus className="mr-1 h-3.5 w-3.5" /> Add Option
                                </Button>
                            </div>

                            <ScrollArea className="h-[280px] pr-4">
                                <div className="space-y-3 pb-4 pt-2 pl-1">
                                    {formData.modifiers.map((mod, index) => (
                                        <div key={index} className="flex gap-3 items-center group animate-in fade-in slide-in-from-top-1">
                                            <div className="flex-1">
                                                <Input 
                                                    placeholder="Option name" 
                                                    value={mod.name} 
                                                    onChange={e => updateModifier(index, 'name', e.target.value)}
                                                    className="h-9 text-sm font-medium"
                                                    required
                                                />
                                            </div>
                                            <div className="w-28 relative">
                                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                                <Input 
                                                    type="number" 
                                                    step="0.01"
                                                    value={mod.price} 
                                                    onChange={e => updateModifier(index, 'price', parseFloat(e.target.value))}
                                                    className="h-9 pl-8 text-sm font-mono"
                                                    required
                                                />
                                            </div>
                                            
                                            {/* OPTION AVAILABILITY TOGGLE */}
                                            <div className="flex flex-col justify-center items-center bg-muted/30 h-9 w-9 rounded-md border border-border">
                                    
                                                <Switch 
                                                    checked={mod.is_available} 
                                                    onCheckedChange={v => updateModifier(index, 'is_available', v)}
                                                    className="scale-75"
                                                />
                                            </div>

                                            <Button 
                                                type="button" 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => removeModifierRow(index)}
                                                className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    ))}
                                    
                                    {formData.modifiers.length === 0 && (
                                        <div className="text-center py-10 border-2 border-dashed rounded-xl border-muted text-muted-foreground flex flex-col items-center gap-3">
                                            <AlertCircle size={32} className="opacity-20" />
                                            <span className="text-xs font-medium">No options defined yet.</span>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>

                    <DialogFooter className="p-6 bg-muted/20 border-t border-border">
                        <Button variant="ghost" type="button" onClick={() => onOpenChange(false)} className="font-medium">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting} className="px-10 font-bold shadow-md">
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {group ? 'Update Modifier' : 'Save Modifier Group'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ModifierGroupDialog;