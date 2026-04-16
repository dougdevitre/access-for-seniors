# Access For Seniors — AWS Deployment

## CDK Stack Structure (TypeScript)

```
lib/
├── api-stack.ts          # API Gateway + Lambda functions
├── data-stack.ts         # DynamoDB tables + RDS Aurora cluster
├── auth-stack.ts         # Cognito user pools + identity pools
├── storage-stack.ts      # S3 buckets + lifecycle policies
├── messaging-stack.ts    # SES + SNS + Pinpoint
├── monitoring-stack.ts   # CloudWatch dashboards + alarms
└── pipeline-stack.ts     # CodePipeline (optional; prefer GitHub Actions)
```

## Environments

| Env | AWS Account | Purpose |
|-----|------------|---------|
| dev | Shared dev account | Feature development, integration testing |
| staging | Separate account | Pre-prod validation; mirrors prod config |
| prod | Dedicated account | Production; enhanced monitoring |

## IAM Principles

- Least-privilege per Lambda function
- No wildcard resource policies (`"Resource": "*"` prohibited)
- Service-linked roles for AWS services
- Cross-account access via assume-role (staging → prod deploy)
- Secrets: SSM SecureString; referenced by name, never by value

## DynamoDB Configuration

- On-demand capacity (auto-scaling)
- Point-in-time recovery: enabled (all envs)
- Encryption: AWS-managed KMS key (or customer-managed for enterprise)
- Streams: enabled (for analytics pipeline)
- Global tables: optional for multi-region (enterprise tier)

## S3 Configuration

- Versioning: enabled
- Encryption: SSE-KMS
- Lifecycle: voice recordings → Glacier after 90 days; delete after retention period
- CORS: restricted to app domains
- Block public access: enforced
