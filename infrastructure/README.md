# Infrastructure Directory - YAML Linting Note

## Important: Helm Templates vs Pure YAML

### Files That Will Show "Errors" in YAML Linters

The following files are **Helm templates** and contain Go template directives (e.g., `{{- ... }}`). They will show syntax errors in pure YAML linters like `prettier` or `fyaml`, but **this is expected and correct behavior**:

#### infrastructure/helm/flowlet/templates/
- `backend-deployment.yaml`
- `backend-hpa.yaml`
- `backend-service.yaml`
- `frontend-deployment.yaml`
- `frontend-service.yaml`
- `ingress.yaml`
- `secrets.yaml`

#### infrastructure/kubernetes/helm/flowlet-chart/templates/
- `deployment.yaml`
- `hpa.yaml`
- `ingress.yaml`
- `serviceaccount.yaml`
- `tests/test-connection.yaml`

### Why These Files Appear as Errors

These files are **NOT pure YAML** - they are **Helm template files** that use Go's `text/template` syntax. Helm processes these templates at deployment time to generate valid Kubernetes YAML manifests.

Example of Helm template syntax that confuses YAML linters:
```yaml
{{- if .Values.backend.autoscaling.enabled }}
replicas: {{ .Values.backend.replicaCount }}
{{- end }}
```

### How to Validate Helm Templates

To validate Helm templates, use Helm's built-in tools instead of YAML linters:

```bash
# Validate Helm chart structure
helm lint infrastructure/helm/flowlet/

# Render templates to see generated YAML (dry-run)
helm template my-release infrastructure/helm/flowlet/

# Validate rendered manifests against Kubernetes API
helm install my-release infrastructure/helm/flowlet/ --dry-run --debug
```

### Prettier Configuration

A `.prettierignore` file has been added to the project root to exclude Helm templates from Prettier formatting:

```
# Helm templates contain Go template directives and should not be linted as pure YAML
infrastructure/helm/**/templates/**/*.yaml
infrastructure/kubernetes/helm/**/templates/**/*.yaml
```

### All Other YAML Files

All non-template YAML files in the infrastructure directory have been successfully formatted with Prettier and contain no syntax errors.

## Summary

✅ **Pure YAML files**: All formatted and validated successfully  
⚠️ **Helm template files**: Will show "errors" in YAML linters - this is expected and correct  
✔️ **To validate Helm templates**: Use `helm lint` and `helm template` commands instead

The "errors" you see in Helm template files are not actual errors - they're YAML linters trying to parse Go template syntax, which they're not designed to handle.
