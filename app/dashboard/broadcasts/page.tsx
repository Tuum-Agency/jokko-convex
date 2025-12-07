import { BroadcastList } from '@/components/broadcasts/BroadcastList';

export default function BroadcastsPage() {
    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Campagnes WhatsApp</h1>
                    <p className="text-muted-foreground">
                        Gérez vos diffusions de messages en masse.
                    </p>
                </div>
            </div>
            <BroadcastList />
        </div>
    );
}
