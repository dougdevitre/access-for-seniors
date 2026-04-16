# Access For Seniors — Multi-Tenant Architecture

## Isolation Model

| Layer | Strategy |
|-------|----------|
| DynamoDB | `tenantId` in every partition key; queries always scoped |
| RDS Aurora | Row-level security policies; `tenant_id` column on every table |
| S3 | Prefix-based: `s3://bucket/{tenantId}/...`; bucket policy enforces prefix |
| Cognito | Enterprise tenants get dedicated user pool; shared pool uses custom attributes |
| API Gateway | Lambda authorizer extracts tenantId from JWT; injects into every downstream call |

## Tenant Provisioning Flow

```
1. Enterprise signs contract
2. POST /internal/tenants → creates:
   - DynamoDB tenant record
   - Stripe customer + subscription
   - Cognito user pool (enterprise) or tenant config (shared)
   - S3 prefix + lifecycle rules
   - Default tenant config (alerts, notifications, branding)
3. Admin receives setup link → configures branding, invites first users
4. First resident added → consent captured → AI features activated
```

## Tenant Hierarchy

```
Organization (enterprise)
  └── Region (optional grouping)
        └── Facility (tenant)
              └── Residents, Caregivers, Family
```

- Single-facility tenants: Organization = Facility
- Multi-facility: Organization has N facilities, each a separate tenant with shared billing
- Enterprise operators see aggregated data across their tenant hierarchy

## Config Inheritance

Facility config overrides organization defaults. Explicit `null` in facility config falls back to org default.

```typescript
function resolveConfig(orgConfig: TenantConfig, facilityConfig: Partial<TenantConfig>): TenantConfig {
  return deepMerge(orgConfig, facilityConfig);
}
```
