import { TenantMembersComponent } from './tenant-members.component';
import { TenantMember, TenantRole, toTenantRole } from '@core/models';

function member(over: Partial<TenantMember> = {}): TenantMember {
  return {
    userId: 'u-other',
    email: 'other@x.com',
    fullName: 'Other',
    role: TenantRole.Member,
    joinedAt: '2026-05-05T00:00:00Z',
    roles: [],
    isMasterAdmin: false,
    ...over
  };
}

/** The screen is tested as an object: the rules are synchronous and do not touch the DOM. */
function screenAs(myRole: TenantRole | -1, myId = 'u-me'): TenantMembersComponent {
  const c = Object.create(TenantMembersComponent.prototype) as TenantMembersComponent;
  c.myRole = myRole;
  c.currentUserId = myId;
  return c;
}

describe('TenantMembersComponent.canManage', () => {
  it('lets an Admin manage a Member', () => {
    expect(screenAs(TenantRole.Admin).canManage(member())).toBe(true);
  });

  it('lets an Owner manage an Admin', () => {
    expect(screenAs(TenantRole.Owner).canManage(member({ role: TenantRole.Admin }))).toBe(true);
  });

  it('does not let a Member manage anyone', () => {
    expect(screenAs(TenantRole.Member).canManage(member())).toBe(false);
  });

  it('does not let anyone touch the Owner from the screen', () => {
    expect(screenAs(TenantRole.Owner).canManage(member({ role: TenantRole.Owner }))).toBe(false);
  });

  it('does not let users edit their own position', () => {
    const me = member({ userId: 'u-me', role: TenantRole.Admin });
    expect(screenAs(TenantRole.Admin, 'u-me').canManage(me)).toBe(false);
  });

  it('does not allow managing when the own position is unknown', () => {
    expect(screenAs(-1).canManage(member())).toBe(false);
  });
});

describe('toTenantRole', () => {
  // The API sends "Owner"/"Admin"/"Member", not 2/1/0. Treating the string as a number
  // made every canManage false and hid the screen's management controls.
  it('converts the string the API actually sends', () => {
    expect(toTenantRole('Owner')).toBe(TenantRole.Owner);
    expect(toTenantRole('Admin')).toBe(TenantRole.Admin);
    expect(toTenantRole('Member')).toBe(TenantRole.Member);
  });

  it('lets the number through, for the day the backend changes its mind', () => {
    expect(toTenantRole(TenantRole.Owner)).toBe(TenantRole.Owner);
    expect(toTenantRole(0)).toBe(TenantRole.Member);
  });

  it('falls back to the least privilege when it does not recognize the value', () => {
    expect(toTenantRole('Janitor')).toBe(TenantRole.Member);
    expect(toTenantRole(null)).toBe(TenantRole.Member);
    expect(toTenantRole(undefined)).toBe(TenantRole.Member);
  });
});
