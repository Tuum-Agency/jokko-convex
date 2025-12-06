import { generateKeyPair, exportJWK, exportPKCS8 } from 'jose';

async function main() {
    const { privateKey, publicKey } = await generateKeyPair('RS256');

    const privateKeyPEM = await exportPKCS8(privateKey);
    const publicKeyJWK = await exportJWK(publicKey);

    // JWKS requires a "keys" array
    const jwks = {
        keys: [
            {
                ...publicKeyJWK,
                // Ensure "use" and "alg" are set if not automatically done
                use: 'sig',
                alg: 'RS256',
                kid: publicKeyJWK.kid || 'convex-auth-key-1', // Ensure a kid exists
            },
        ],
    };

    // We need to format the private key properly for the env var
    // Often it's passed as a string, sometimes replacing newlines with \n
    const privateKeyString = privateKeyPEM.replace(/\n/g, '\\n');

    console.log('Run the following commands to set the environment variables:');
    console.log('');
    console.log(`npx convex env set JWKS '${JSON.stringify(jwks)}'`);
    console.log(`npx convex env set JWT_PRIVATE_KEY "${privateKeyString}"`);
}

main().catch(console.error);
