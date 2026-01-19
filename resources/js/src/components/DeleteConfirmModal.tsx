import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";
import { ReactNode } from "react";

interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    description?: string | ReactNode;
    confirmText?: string;
    cancelText?: string;
    variant?: "destructive" | "default" | "outline" | "secondary" | "ghost" | "link";
    loading?: boolean;
    confirmButtonLoadingText?: string;
}

const DeleteConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Are you absolutely sure?",
    description = "This action cannot be undone. This will permanently delete the record from our servers.",
    confirmText = "Delete",
    cancelText = "Cancel",
    variant = "destructive",
    loading = false,
    confirmButtonLoadingText = "Deleting...",
}: DeleteConfirmModalProps) => {
    const handleConfirm = (e: React.MouseEvent) => {
        e.preventDefault();
        onConfirm();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-destructive/10 rounded-full">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">{title}</DialogTitle>
                        </div>
                    </div>
                    <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="mt-6 flex flex-col-reverse sm:flex-row gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                        className="sm:mr-2 flex-1 sm:flex-none"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        type="button"
                        variant={variant}
                        onClick={handleConfirm}
                        disabled={loading}
                        className="flex-1 sm:flex-none min-w-[100px]"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {confirmButtonLoadingText}
                            </>
                        ) : (
                            confirmText
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DeleteConfirmModal;