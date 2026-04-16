# Access For Seniors — CI/CD

## GitHub Actions Pipeline

```
PR opened/updated
    ↓
lint + typecheck + unit tests (parallel)
    ↓
PR merged to main
    ↓
CDK diff (staging)
    ↓
CDK deploy (staging)
    ↓
Integration tests (staging)
    ↓
Manual approval (Slack notification)
    ↓
CDK deploy (prod)
    ↓
Smoke tests (prod)
    ↓
Post-deploy notification (Slack)
```

## Workflow Files

- `.github/workflows/ci.yml` — lint, typecheck, test on PR
- `.github/workflows/deploy-staging.yml` — deploy to staging on merge to main
- `.github/workflows/deploy-prod.yml` — deploy to prod on manual approval
- `.github/workflows/security-scan.yml` — weekly SAST + dependency audit

## Rollback

- CDK: automatic rollback on CloudFormation failure
- Lambda: versioning + aliases; traffic shift with canary deployment
- Manual rollback: `cdk deploy --previous-version` or Lambda alias update
