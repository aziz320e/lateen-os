/** Password Hashing — bcrypt, salt rounds from configuration. No plaintext password is ever persisted or logged. */
import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { AppConfig } from '../config/index.js';
import { APP_CONFIG } from '../api/tokens.js';

@Injectable()
export class PasswordService {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  async hash(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, this.config.BCRYPT_SALT_ROUNDS);
  }

  async verify(plainText: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainText, hash);
  }
}
