import '@testing-library/jest-dom'

// Test encryption key (64 hex chars = 32 bytes for AES-256-GCM)
process.env.ENCRYPTION_KEY = 'a'.repeat(64);
