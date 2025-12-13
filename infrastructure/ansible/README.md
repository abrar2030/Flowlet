# Ansible Configuration Management

This directory contains Ansible playbooks and roles for configuring and managing Flowlet infrastructure.

## Directory Structure

```
ansible/
├── README.md              # This file
├── ansible.cfg            # Ansible configuration
├── inventory.example      # Example inventory file
├── site.yml              # Main playbook
├── playbooks/            # Additional playbooks
├── roles/                # Ansible roles
├── group_vars/           # Group-specific variables
└── host_vars/            # Host-specific variables
```

## Prerequisites

```bash
# Install Ansible
pip install ansible

# Install ansible-lint for validation
pip install ansible-lint

# Verify installation
ansible --version
ansible-lint --version
```

## Quick Start

### 1. Configure Inventory

```bash
# Copy the example inventory
cp inventory.example inventory

# Edit inventory with your hosts
vim inventory
```

### 2. Test Connection

```bash
# Ping all hosts
ansible all -i inventory -m ping

# Run in check mode (dry-run)
ansible-playbook -i inventory site.yml --check
```

### 3. Run Playbooks

```bash
# Run main playbook
ansible-playbook -i inventory site.yml

# Run specific tags
ansible-playbook -i inventory site.yml --tags "docker"

# Run with verbose output
ansible-playbook -i inventory site.yml -vvv
```

## Available Playbooks

- `site.yml` - Main playbook that includes all roles
- `playbooks/docker-setup.yml` - Install and configure Docker
- `playbooks/k8s-setup.yml` - Setup Kubernetes cluster
- `playbooks/monitoring-setup.yml` - Deploy monitoring stack

## Common Tasks

### Install Docker on all nodes

```bash
ansible-playbook -i inventory site.yml --tags "docker"
```

### Update system packages

```bash
ansible-playbook -i inventory site.yml --tags "system"
```

### Deploy monitoring

```bash
ansible-playbook -i inventory playbooks/monitoring-setup.yml
```

## Validation

```bash
# Lint playbooks
ansible-lint site.yml

# Syntax check
ansible-playbook -i inventory site.yml --syntax-check

# Dry run
ansible-playbook -i inventory site.yml --check --diff
```

## Variables

### Group Variables

Place in `group_vars/<group_name>.yml`:

- `group_vars/all.yml` - Variables for all hosts
- `group_vars/k8s_master.yml` - Variables for master nodes
- `group_vars/k8s_worker.yml` - Variables for worker nodes

### Host Variables

Place in `host_vars/<hostname>.yml` for host-specific configuration

## Security

- Store sensitive variables in Ansible Vault:

  ```bash
  ansible-vault create group_vars/vault.yml
  ansible-vault edit group_vars/vault.yml
  ```

- Run playbooks with vault:
  ```bash
  ansible-playbook -i inventory site.yml --ask-vault-pass
  ```

## Troubleshooting

### Connection Issues

```bash
# Test SSH connection
ssh user@hostname

# Use specific SSH key
ansible-playbook -i inventory site.yml --private-key ~/.ssh/id_rsa

# Use password authentication
ansible-playbook -i inventory site.yml --ask-pass
```

### Privilege Issues

```bash
# Use sudo
ansible-playbook -i inventory site.yml --become

# Ask for sudo password
ansible-playbook -i inventory site.yml --become --ask-become-pass
```

## Best Practices

1. Always run playbooks in check mode first
2. Use tags for selective execution
3. Keep secrets in Ansible Vault
4. Use roles for reusability
5. Test changes on staging before production
6. Use version control for playbooks
7. Document custom roles and variables

## Support

- Ansible Documentation: https://docs.ansible.com/
- Best Practices: https://docs.ansible.com/ansible/latest/user_guide/playbooks_best_practices.html
