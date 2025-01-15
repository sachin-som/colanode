import {
  generateId,
  IdType,
  LoginSuccessOutput,
  LoginVerifyOutput,
  WorkspaceOutput,
  WorkspaceRole,
} from '@colanode/core';

import crypto from 'crypto';

import { SelectAccount } from '@/data/schema';
import { database } from '@/data/database';
import { workspaceService } from '@/services/workspace-service';
import { generateToken } from '@/lib/tokens';
import { configuration } from '@/lib/configuration';
import { OtpCodeData } from '@/types/api';
import { redis } from '@/data/redis';
import { jobService } from '@/services/job-service';
import { emailVerifyTemplate } from '@/templates';
import { emailService } from '@/services/email-service';

const OTP_DIGITS = '0123456789';
const OTP_LENGTH = 6;

interface DeviceMetadata {
  ip: string | undefined;
  platform: string;
  version: string;
}

class AccountService {
  public async buildLoginSuccessOutput(
    account: SelectAccount,
    metadata: DeviceMetadata
  ): Promise<LoginSuccessOutput> {
    const users = await database
      .selectFrom('users')
      .where('account_id', '=', account.id)
      .selectAll()
      .execute();

    const workspaceOutputs: WorkspaceOutput[] = [];
    if (users.length > 0) {
      const workspaceIds = users.map((u) => u.workspace_id);
      const workspaces = await database
        .selectFrom('workspaces')
        .where('id', 'in', workspaceIds)
        .selectAll()
        .execute();

      for (const user of users) {
        const workspace = workspaces.find((w) => w.id === user.workspace_id);

        if (!workspace) {
          continue;
        }

        workspaceOutputs.push({
          id: workspace.id,
          name: workspace.name,
          avatar: workspace.avatar,
          description: workspace.description,
          user: {
            id: user.id,
            accountId: user.account_id,
            role: user.role as WorkspaceRole,
          },
        });
      }
    }

    if (workspaceOutputs.length === 0) {
      const workspace = await workspaceService.createDefaultWorkspace(account);
      workspaceOutputs.push(workspace);
    }

    const deviceId = generateId(IdType.Device);
    const { token, salt, hash } = generateToken(deviceId);

    const device = await database
      .insertInto('devices')
      .values({
        id: deviceId,
        account_id: account.id,
        token_hash: hash,
        token_salt: salt,
        token_generated_at: new Date(),
        type: 1,
        ip: metadata.ip,
        platform: metadata.platform,
        version: metadata.version,
        created_at: new Date(),
      })
      .returningAll()
      .executeTakeFirst();

    if (!device) {
      throw new Error('Failed to create device.');
    }

    return {
      type: 'success',
      account: {
        id: account.id,
        name: account.name,
        email: account.email,
        avatar: account.avatar,
      },
      workspaces: workspaceOutputs,
      deviceId: device.id,
      token,
    };
  }

  public async buildLoginVerifyOutput(
    account: SelectAccount
  ): Promise<LoginVerifyOutput> {
    const id = generateId(IdType.OtpCode);
    const expiresAt = new Date(
      Date.now() + configuration.account.otpTimeout * 1000
    );
    const otp = await this.generateOtpCode();

    const otpData: OtpCodeData = {
      id,
      expiresAt,
      accountId: account.id,
      otp,
      attempts: 0,
    };

    await this.saveOtpData(id, otpData);
    await jobService.addJob({
      type: 'send_email_verify_email',
      otpId: id,
    });

    return {
      type: 'verify',
      id,
      expiresAt,
    };
  }

  public async verifyOtpCode(id: string, otp: string): Promise<string | null> {
    const otpData = await this.fetchOtpData(id);
    if (!otpData) {
      return null;
    }

    if (otpData.otp !== otp) {
      if (otpData.attempts >= 3) {
        await this.deleteOtpData(id);
        return null;
      }

      otpData.attempts++;

      await this.saveOtpData(id, otpData);
      return null;
    }

    await this.deleteOtpData(id);
    return otpData.accountId;
  }

  public async sendEmailVerifyEmail(otpId: string): Promise<void> {
    const otpData = await this.fetchOtpData(otpId);
    if (!otpData) {
      return;
    }

    const account = await database
      .selectFrom('accounts')
      .where('id', '=', otpData.accountId)
      .selectAll()
      .executeTakeFirst();

    if (!account) {
      return;
    }

    const email = account.email;
    const name = account.name;
    const otp = otpData.otp;

    const html = emailVerifyTemplate({
      name,
      otp,
    });

    await emailService.sendEmail({
      subject: 'Your Colanode email verification code',
      to: email,
      html,
    });
  }

  private async fetchOtpData(otpId: string): Promise<OtpCodeData | null> {
    const redisKey = this.getOtpDataRedisKey(otpId);
    const otpDataJson = await redis.get(redisKey);
    if (!otpDataJson) {
      return null;
    }

    return JSON.parse(otpDataJson);
  }

  private async saveOtpData(
    otpId: string,
    otpData: OtpCodeData
  ): Promise<void> {
    const redisKey = this.getOtpDataRedisKey(otpId);
    const expireSeconds = Math.max(
      Math.floor((otpData.expiresAt.getTime() - Date.now()) / 1000),
      1
    );
    await redis.set(redisKey, JSON.stringify(otpData), {
      EX: expireSeconds,
    });
  }

  private async deleteOtpData(otpId: string): Promise<void> {
    const redisKey = this.getOtpDataRedisKey(otpId);
    await redis.del(redisKey);
  }

  private getOtpDataRedisKey(otpId: string): string {
    return `otp:${otpId}`;
  }

  private async generateOtpCode(): Promise<string> {
    let otp = '';

    for (let i = 0; i < OTP_LENGTH; i++) {
      const randomIndex = crypto.randomInt(0, OTP_DIGITS.length);
      otp += OTP_DIGITS[randomIndex];
    }

    return otp;
  }
}

export const accountService = new AccountService();
