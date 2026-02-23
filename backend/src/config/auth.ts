// Central JWT configuration — fail fast if secret is not set

const secret = process.env.JWT_SECRET;
if (!secret) {
    throw new Error('FATAL: JWT_SECRET environment variable is required. Set it before starting the server.');
}

const JWT_SECRET: string = secret;
const JWT_EXPIRE = '7d';

export { JWT_SECRET, JWT_EXPIRE };
