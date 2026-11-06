export function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET?.trim();
    if (!secret || secret.length < 32) {
        throw new Error('JWT_SECRET debe configurarse con al menos 32 caracteres.');
    }
    return secret;
}