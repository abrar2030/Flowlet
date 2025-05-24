# Integration Configurations

This directory contains configuration files for external service integrations used by Flowlet.

## Contents

- `banking.yaml` - Banking partner integration configurations
- `payment-processors.yaml` - Payment processor integration configurations
- `card-issuers.yaml` - Card issuer integration configurations
- `kyc-providers.yaml` - KYC/AML provider integration configurations

## Usage

These configurations are applied to the Kubernetes cluster using:

```bash
kubectl apply -f config/integrations/
```

## Security

- All sensitive credentials are stored in Kubernetes secrets
- These files only contain references to secrets, not the actual credentials
- Access to these configurations is restricted to authorized personnel
