# Database Module: main.tf

resource "aws_db_instance" "default" {
  allocated_storage    = var.db_allocated_storage
  storage_type         = "gp2"
  engine               = "postgres"
  engine_version       = var.db_engine_version
  instance_class       = var.db_instance_class
  identifier           = "${var.name_prefix}-db"
  username             = var.db_username
  password             = var.db_password
  db_name              = var.db_name
  port                 = 5432
  vpc_security_group_ids = var.security_group_ids
  db_subnet_group_name = aws_db_subnet_group.default.name
  
  skip_final_snapshot  = true
  multi_az             = var.multi_az
  publicly_accessible  = false
  
  backup_retention_period = var.backup_retention_period
  backup_window           = var.backup_window
  maintenance_window      = var.maintenance_window
  
  storage_encrypted    = var.enable_encryption
  
  tags = var.tags
}

resource "aws_db_subnet_group" "default" {
  name       = "${var.name_prefix}-db-subnet-group"
  subnet_ids = var.private_subnet_ids
  tags       = var.tags
}
