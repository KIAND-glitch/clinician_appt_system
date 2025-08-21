export function parseIsoToUtcString(input: string): string | null {
    const d = new Date(input);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
}

export function isStrictlyBefore(aIso: string, bIso: string): boolean {
    return new Date(aIso).getTime() < new Date(bIso).getTime();
}

export function nowUtcIso(): string {
    return new Date().toISOString();
}