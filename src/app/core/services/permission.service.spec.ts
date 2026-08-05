import { TestBed } from '@angular/core/testing';
import { PermissionService } from './permission.service';
import { ApiService } from './api.service';
import { PermissionLevel, UserResourcePermissions } from '../models';

describe('PermissionService resource access', () => {
  let service: PermissionService;

  /** Payload shaped exactly like the API response: enums serialized as strings. */
  const apiPayload = {
    userId: 'u1',
    email: 'admin@SBP.com',
    fullName: 'Administrador do Sistema',
    roles: ['Administrador'],
    allowedResources: [
      {
        id: 'r1',
        code: 'HR.Employees',
        name: 'Funcionários',
        module: 'RH',
        displayOrder: 40,
        userPermissionLevel: 'Full'
      }
    ],
    resourcePermissions: { 'HR.Employees': 'Full', 'HR.WorkLogs': 'Read' }
  } as unknown as UserResourcePermissions;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PermissionService, { provide: ApiService, useValue: {} }]
    });
    service = TestBed.inject(PermissionService);
  });

  it('grants access when the API sends string levels', () => {
    service.setUserResourcePermissions(apiPayload);

    expect(service.userCanAccessResource('HR.Employees')).toBe(true);
    expect(service.userCanWriteResource('HR.Employees')).toBe(true);
    expect(service.userCanFullAccessResource('HR.Employees')).toBe(true);
  });

  it('still enforces the minimum level after normalization', () => {
    service.setUserResourcePermissions(apiPayload);

    expect(service.userCanReadResource('HR.WorkLogs')).toBe(true);
    expect(service.userCanWriteResource('HR.WorkLogs')).toBe(false);
  });

  it('exposes levels as the numeric enum', () => {
    service.setUserResourcePermissions(apiPayload);

    expect(service.getUserResourcePermissionLevel('HR.Employees')).toBe(PermissionLevel.Full);
    expect(service.getUserResourcePermissionLevel('HR.WorkLogs')).toBe(PermissionLevel.Read);
    expect(service.getUserResourcePermissionLevel('Unknown.Code')).toBe(PermissionLevel.None);
    expect(service.getUserResourcePermissions()?.allowedResources[0].userPermissionLevel)
      .toBe(PermissionLevel.Full);
  });

  it('denies access to resources missing from the payload', () => {
    service.setUserResourcePermissions(apiPayload);

    expect(service.userCanAccessResource('Permission.Management')).toBe(false);
  });

  it('accepts numeric levels too (payloads persisted by other builds)', () => {
    service.setUserResourcePermissions({
      ...apiPayload,
      resourcePermissions: { 'HR.Employees': PermissionLevel.Write }
    } as UserResourcePermissions);

    expect(service.userCanWriteResource('HR.Employees')).toBe(true);
    expect(service.userCanFullAccessResource('HR.Employees')).toBe(false);
  });
});
