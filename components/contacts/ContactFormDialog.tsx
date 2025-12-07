'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ContactForm } from './ContactForm';

interface ContactFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'create' | 'edit';
    initialData?: any;
    onSubmit: (data: any) => Promise<void>;
    isLoading?: boolean;
}

export function ContactFormDialog({
    open,
    onOpenChange,
    mode,
    initialData,
    onSubmit,
    isLoading
}: ContactFormDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] h-[90vh] sm:h-auto overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'create' ? 'Nouveau contact' : 'Modifier le contact'}
                    </DialogTitle>
                </DialogHeader>
                <ContactForm
                    mode={mode}
                    initialData={initialData}
                    tags={[]} // Tags are handled internally in form for creation/managment
                    onSubmit={onSubmit}
                    isLoading={isLoading}
                    onCancel={() => onOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    )
}

export default ContactFormDialog
