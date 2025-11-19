resource "aws_security_group" "eks_cluster" {
  name_prefix = "${var.name_prefix}-eks-cluster"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTPS from allowed CIDR blocks for EKS API"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-eks-cluster-sg"
  })
}

resource "aws_security_group" "eks_nodes" {
  name_prefix = "${var.name_prefix}-eks-nodes"
  vpc_id      = var.vpc_id

  ingress {
    description = "Node to node communication (all TCP ports)"
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    self        = true
  }

  ingress {
    description     = "Cluster API to node communication (HTTPS)"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_cluster.id]
  }

  ingress {
    description     = "Kubelet and NodePort ranges from EKS cluster"
    from_port       = 10250 # Kubelet
    to_port         = 32767 # NodePort range
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_cluster.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-eks-nodes-sg"
  })
}

resource "aws_security_group" "database" {
  name_prefix = "${var.name_prefix}-database"
  vpc_id      = var.vpc_id

  ingress {
    description     = "PostgreSQL from EKS nodes"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_nodes.id]
  }

  ingress {
    description = "PostgreSQL from allowed CIDR blocks (e.g., jump host)"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-database-sg"
  })
}

resource "aws_security_group" "redis" {
  name_prefix = "${var.name_prefix}-redis"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Redis from EKS nodes"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_nodes.id]
  }

  ingress {
    description = "Redis from allowed CIDR blocks (e.g., jump host)"
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-redis-sg"
  })
}

resource "aws_security_group" "alb" {
  name_prefix = "${var.name_prefix}-alb"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTPS from internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-alb-sg"
  })
}

resource "aws_wafv2_web_acl" "main" {
  name  = "${var.name_prefix}-web-acl"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.name_prefix}-CommonRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.name_prefix}-KnownBadInputsRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWSManagedRulesSQLiRuleSet"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.name_prefix}-SQLiRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWSManagedRulesXSSRuleSet"
    priority = 4

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesXSSRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.name_prefix}-XSSRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "RateLimitRule"
    priority = 5

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 1000 # Reduced limit for financial standards
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.name_prefix}-RateLimitRule"
      sampled_requests_enabled   = true
    }
  }

  tags = var.tags

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.name_prefix}-WebACL"
    sampled_requests_enabled   = true
  }
}

resource "aws_kms_key" "data_encryption_key" {
  description             = "KMS key for data encryption at rest"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "Enable IAM User Permissions"
        Effect    = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action    = "kms:*"
        Resource  = "*"
      },
      {
        Sid       = "Allow use of the key"
        Effect    = "Allow"
        Principal = {
          AWS = [
            "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/aws-service-role/rds.amazonaws.com/AWSServiceRoleForRDS",
            "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/aws-service-role/s3.amazonaws.com/AWSServiceRoleForS3",
            "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/aws-service-role/lambda.amazonaws.com/AWSServiceRoleForLambda",
            "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/aws-service-role/eks.amazonaws.com/AWSServiceRoleForAmazonEKSCluster",
            "arn:aws:iam::${data.aws_caller_identity.current.account_id}:user/your-admin-user" # Replace with your admin user ARN
          ]
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid       = "Allow attachment of principal policy for key users"
        Effect    = "Allow"
        Principal = {
          AWS = [
            "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/aws-service-role/rds.amazonaws.com/AWSServiceRoleForRDS",
            "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/aws-service-role/s3.amazonaws.com/AWSServiceRoleForS3",
            "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/aws-service-role/lambda.amazonaws.com/AWSServiceRoleForLambda",
            "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/aws-service-role/eks.amazonaws.com/AWSServiceRoleForAmazonEKSCluster",
            "arn:aws:iam::${data.aws_caller_identity.current.account_id}:user/your-admin-user" # Replace with your admin user ARN
          ]
        }
        Action = [
          "kms:CreateGrant",
          "kms:RetireGrant"
        ]
        Resource = "*"
        Condition = {
          Bool = {
            "kms:GrantIsForAWSResource" = "true"
          }
        }
      }
    ]
  })
  tags = var.tags
}

resource "aws_secretsmanager_secret" "flowlet_secrets" {
  name                    = "${var.name_prefix}-flowlet-secrets"
  description             = "Centralized secrets for Flowlet application"
  recovery_window_in_days = 7
  kms_key_id              = aws_kms_key.data_encryption_key.arn
  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "flowlet_secrets_version" {
  secret_id     = aws_secretsmanager_secret.flowlet_secrets.id
  secret_string = var.initial_secrets_json # This should be managed securely, e.g., via CI/CD or external tool
}

data "aws_caller_identity" "current" {}
