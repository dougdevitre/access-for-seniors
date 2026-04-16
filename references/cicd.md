# Access For Seniors — CI/CD

## GitHub Actions Pipeline

```mermaid
flowchart TD
    PR["PR opened / updated"]
    Checks["lint · typecheck · unit tests<br/>(parallel)"]
    Merge["PR merged to main"]
    Diff["CDK diff (staging)"]
    DeployStaging["CDK deploy (staging)"]
    Integration["Integration tests (staging)"]
    Approval{"Manual approval<br/>(Slack)"}
    DeployProd["CDK deploy (prod)"]
    Smoke["Smoke tests (prod)"]
    Notify["Post-deploy Slack notification"]

    PR --> Checks --> Merge --> Diff --> DeployStaging --> Integration --> Approval
    Approval -->|approved| DeployProd --> Smoke --> Notify
    Approval -->|rejected| PR
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
