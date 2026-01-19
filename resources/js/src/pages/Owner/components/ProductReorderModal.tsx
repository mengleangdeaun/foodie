import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GripVertical, Loader2, ListOrdered, Save } from "lucide-react";
import api from '@/util/api';
import { useToast } from "@/hooks/use-toast";

interface ReorderModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    branchId: string;
    items: any[];
    onSuccess: () => void;
}

const ProductReorderModal = ({ open, onOpenChange, branchId, items, onSuccess }: ReorderModalProps) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [localItems, setLocalItems] = useState<any[]>([]);

    // Sync local state when modal opens or items change
    useEffect(() => {
        const sortedItems = [...items]
            .filter(item => item.pivot.is_available) // Only reorder available items
            .sort((a, b) => (a.pivot.sort_order || 0) - (b.pivot.sort_order || 0));
        setLocalItems(sortedItems);
    }, [items, open]);

    // Handle the drag end logic
    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const reordered = Array.from(localItems);
        const [removed] = reordered.splice(result.source.index, 1);
        reordered.splice(result.destination.index, 0, removed);

        setLocalItems(reordered);
    };

    // Save the new order to the backend
    const handleSaveOrder = async () => {
        setLoading(true);
        try {
            // Map the items to their new index as the sort_order
            const orderData = localItems.map((item, index) => ({
                product_id: item.id,
                sort_order: index // New position is the new order
            }));

            await api.post(`/admin/branches/${branchId}/inventory/reorder`, {
                orders: orderData
            });

            toast({ title: "Menu Reordered", description: "The new sequence is live for customers." });
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            toast({ variant: "destructive", title: "Save Failed", description: "Could not sync new order." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
                <DialogHeader className="p-6 bg-primary/5 border-b">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <ListOrdered className="text-primary h-6 w-6" />
                        Visual Menu Reorder
                    </DialogTitle>
                    <DialogDescription>
                        Drag items up or down to change their priority in the customer view.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="h-[50vh]">
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="menu-items">
                            {(provided) => (
                                <div 
                                    {...provided.droppableProps} 
                                    ref={provided.innerRef}
                                    className="p-4 space-y-2"
                                >
                                    {localItems.map((item, index) => (
                                        <Draggable key={item.id} draggableId={item.id.toString()} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className={`flex items-center justify-between p-3 rounded-xl border bg-card transition-all shadow-sm ${
                                                        snapshot.isDragging ? "shadow-xl ring-2 ring-primary border-primary z-50 scale-105" : "hover:border-primary/30"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded">
                                                            <GripVertical className="text-muted-foreground h-5 w-5" />
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                                                {index + 1}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold leading-none">{item.name}</p>
                                                                <p className="text-[10px] text-muted-foreground font-medium uppercase mt-1">
                                                                    ${item.pivot.branch_price || item.base_price}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {item.image_path && (
                                                        <img src={item.image_path} className="w-10 h-10 rounded-lg object-cover border" alt="" />
                                                    )}
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                </ScrollArea>

                <DialogFooter className="p-4 bg-muted/30 border-t flex flex-col sm:flex-row gap-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="flex-1">Cancel</Button>
                    <Button 
                        className="flex-1 font-bold shadow-lg" 
                        onClick={handleSaveOrder} 
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                        Save New Sequence
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ProductReorderModal;