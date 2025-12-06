const { generateKeyPairSync } = require('crypto');

function main() {
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'jwk'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    });

    // Calculate Key ID (kid) - strictly not required if only one key, but good practice.
    // Converting to JWK format.
    const publicKeyJWK = publicKey;

    const jwks = {
        keys: [
            {
                ...publicKeyJWK,
                use: 'sig',
                alg: 'RS256',
                kid: 'convex-auth-key-1',
            },
        ],
    };

    console.log('Run the following commands to set the environment variables:');
    console.log('');
    // Use single quotes for the JSON to avoid shell expansion issues, verify JSON content doesn't have single quotes
    console.log(`npx convex env set JWKS '${JSON.stringify(jwks)}'`);
    console.log(`npx convex env set JWT_PRIVATE_KEY '${privateKey}'`);
}

main();
