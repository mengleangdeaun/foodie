import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle } from "lucide-react";

interface OrderCancellationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orderId: number | null;
    requiresNote: boolean;
    onConfirm: (note: string) => void;
}

const OrderCancellationModal = ({
    open,
    onOpenChange,
    orderId,
    requiresNote,
    onConfirm
}: OrderCancellationModalProps) => {
    const [cancelNote, setCancelNote] = useState('');

    useEffect(() => {
        if (!open) {
            setCancelNote('');
        }
    }, [open]);

    const handleConfirm = () => {
        onConfirm(cancelNote);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-5 w-5" />
                        Cancel Order #{orderId}
                    </DialogTitle>
                    <DialogDescription>
                        This action cannot be undone. The order will be marked as cancelled.
                    </DialogDescription>
                </DialogHeader>

                {requiresNote && (
                    <div className="space-y-3">
                        <label className="text-sm font-medium">Cancellation Reason *</label>
                        <Textarea
                            placeholder="Please provide a reason for cancellation..."
                            className="min-h-[100px]"
                            value={cancelNote}
                            onChange={(e) => setCancelNote(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Required by branch policy
                        </p>
                    </div>
                )}

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Keep Order
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={requiresNote && !cancelNote.trim()}
                    >
                        Confirm Cancellation
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default OrderCancellationModal;
