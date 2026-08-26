import { TenantMembersComponent } from './tenant-members.component';
import { TenantMember, TenantRole, toTenantRole } from '@core/models';

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

describe('toTenantRole', () => {
  // A API manda "Owner"/"Admin"/"Member", não 2/1/0. Tratar a string como número
  // fazia todo canManage dar false e escondia os controles de gestão da tela.
  it('converte a string que a API realmente manda', () => {
    expect(toTenantRole('Owner')).toBe(TenantRole.Owner);
    expect(toTenantRole('Admin')).toBe(TenantRole.Admin);
    expect(toTenantRole('Member')).toBe(TenantRole.Member);
  });

  it('deixa passar o número, para o dia em que o backend mudar de ideia', () => {
    expect(toTenantRole(TenantRole.Owner)).toBe(TenantRole.Owner);
    expect(toTenantRole(0)).toBe(TenantRole.Member);
  });

  it('cai para o menor privilégio quando não reconhece o valor', () => {
    expect(toTenantRole('Sindico')).toBe(TenantRole.Member);
    expect(toTenantRole(null)).toBe(TenantRole.Member);
    expect(toTenantRole(undefined)).toBe(TenantRole.Member);
  });
});
