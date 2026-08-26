import { TenantMembersComponent } from './tenant-members.component';
import { TenantMember, TenantRole } from '@core/models';

function member(over: Partial<TenantMember> = {}): TenantMember {
  return {
    userId: 'u-outro',
    email: 'outro@x.com',
    fullName: 'Outro',
    role: TenantRole.Member,
    joinedAt: '2026-05-05T00:00:00Z',
    roles: [],
    isMasterAdmin: false,
    ...over
  };
}

/** A tela é testada como objeto: as regras são síncronas e não tocam no DOM. */
function screenAs(myRole: TenantRole | -1, myId = 'u-eu'): TenantMembersComponent {
  const c = Object.create(TenantMembersComponent.prototype) as TenantMembersComponent;
  c.myRole = myRole;
  c.currentUserId = myId;
  return c;
}

describe('TenantMembersComponent.canManage', () => {
  it('deixa um Admin gerenciar um Member', () => {
    expect(screenAs(TenantRole.Admin).canManage(member())).toBe(true);
  });

  it('deixa um Owner gerenciar um Admin', () => {
    expect(screenAs(TenantRole.Owner).canManage(member({ role: TenantRole.Admin }))).toBe(true);
  });

  it('não deixa um Member gerenciar ninguém', () => {
    expect(screenAs(TenantRole.Member).canManage(member())).toBe(false);
  });

  it('não deixa ninguém mexer no Owner pela tela', () => {
    expect(screenAs(TenantRole.Owner).canManage(member({ role: TenantRole.Owner }))).toBe(false);
  });

  it('não deixa o usuário editar o próprio cargo', () => {
    const eu = member({ userId: 'u-eu', role: TenantRole.Admin });
    expect(screenAs(TenantRole.Admin, 'u-eu').canManage(eu)).toBe(false);
  });

  it('não deixa gerenciar quando nem se sabe o próprio cargo', () => {
    expect(screenAs(-1).canManage(member())).toBe(false);
  });
});
