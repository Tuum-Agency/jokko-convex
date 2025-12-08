import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export function AuthDebug() {
    const whoAmI = useQuery(api.diagAuth.whoAmI);

    if (!whoAmI) {
        return (
            <div className="fixed bottom-4 right-4 bg-yellow-100 border-2 border-yellow-500 rounded-lg p-4 max-w-md shadow-lg z-50">
                <h3 className="font-bold text-yellow-900">🔍 Auth Debug: Chargement...</h3>
            </div>
        );
    }

    if (!whoAmI.authenticated) {
        return (
            <div className="fixed bottom-4 right-4 bg-red-100 border-2 border-red-500 rounded-lg p-4 max-w-md shadow-lg z-50">
                <h3 className="font-bold text-red-900">⚠️ Auth Debug: NON AUTHENTIFIÉ</h3>
            </div>
        );
    }

    return (
        <div className={`fixed bottom-4 right-4 ${whoAmI.userExistsInDB ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500'} border-2 rounded-lg p-4 max-w-md shadow-lg z-50`}>
            <h3 className={`font-bold ${whoAmI.userExistsInDB ? 'text-green-900' : 'text-red-900'}`}>
                {whoAmI.userExistsInDB ? '✅' : '❌'} Auth Debug
            </h3>
            <div className="mt-2 text-sm space-y-1">
                <p><strong>Email:</strong> {whoAmI.email}</p>
                <p><strong>Nom:</strong> {whoAmI.name}</p>
                <p><strong>User exists in DB:</strong> {whoAmI.userExistsInDB ? '✅ OUI' : '❌ NON'}</p>
                {whoAmI.userId && <p><strong>User ID:</strong> {whoAmI.userId}</p>}
            </div>
        </div>
    );
}
