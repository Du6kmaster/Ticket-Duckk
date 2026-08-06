import type { GuildMember } from 'discord.js';
import type { GuildConfig } from '@prisma/client';
import { env } from '../config/env.js';

export type PermissionLevel = 'owner' | 'admin' | 'supervisor' | 'moderator' | 'support' | 'none';

/**
 * Centraliza toda a lógica de "quem pode fazer o quê".
 * Nenhum command/interaction deve checar cargos manualmente — sempre via este serviço,
 * para que a hierarquia de permissões tenha uma única fonte de verdade.
 */
export class PermissionService {
  levelOf(member: GuildMember, config: GuildConfig): PermissionLevel {
    if (env.BOT_OWNERS.includes(member.id)) return 'owner';

    const roleIds = member.roles.cache.map((r) => r.id);

    if (config.adminRoleIds.some((id) => roleIds.includes(id)) || member.permissions.has('Administrator')) {
      return 'admin';
    }
    if (config.supervisorRoleIds.some((id) => roleIds.includes(id))) return 'supervisor';
    if (config.moderatorRoleIds.some((id) => roleIds.includes(id))) return 'moderator';
    if (config.staffRoleIds.some((id) => roleIds.includes(id))) return 'support';

    return 'none';
  }

  isStaff(member: GuildMember, config: GuildConfig): boolean {
    return this.levelOf(member, config) !== 'none';
  }

  canManageConfig(member: GuildMember, config: GuildConfig): boolean {
    const level = this.levelOf(member, config);
    return level === 'owner' || level === 'admin';
  }

  canManageTicketActions(member: GuildMember, config: GuildConfig): boolean {
    return this.isStaff(member, config);
  }
}

export const permissionService = new PermissionService();
