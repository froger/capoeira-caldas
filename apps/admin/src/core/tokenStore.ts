export type TokenStoreCrypto = {
  encrypt: (plain: string) => string;
  decrypt: (cipher: string) => string;
};

export type TokenStorePersistence = {
  read: () => string | null;
  write: (value: string | null) => void;
};

export class TokenStore {
  constructor(
    private readonly crypto: TokenStoreCrypto,
    private readonly persistence: TokenStorePersistence,
  ) {}

  save(token: string): void {
    this.persistence.write(this.crypto.encrypt(token));
  }

  load(): string | null {
    const cipher = this.persistence.read();
    if (!cipher) return null;
    try {
      return this.crypto.decrypt(cipher);
    } catch {
      this.clear();
      return null;
    }
  }

  clear(): void {
    this.persistence.write(null);
  }
}
