# Database Module: variables.tf

variable "name_prefix" {
  description = "A prefix for resource names."
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for the DB subnet group."
  type        = list(string)
}

variable "security_group_ids" {
  description = "List of security group IDs to associate with the DB instance."
  type        = list(string)
}

variable "db_instance_class" {
  description = "The instance type of the RDS instance."
  type        = string
}

variable "db_allocated_storage" {
  description = "The allocated storage in GB."
  type        = number
}

variable "db_engine_version" {
  description = "The engine version of the RDS instance."
  type        = string
}

variable "db_name" {
  description = "The name of the database to create."
  type        = string
}

variable "db_username" {
  description = "The master username for the database."
  type        = string
}

variable "db_password" {
  description = "The master password for the database."
  type        = string
  sensitive   = true
}

variable "backup_retention_period" {
  description = "The number of days to retain backups."
  type        = number
  default     = 7
}

variable "backup_window" {
  description = "The daily time range (in UTC) during which automated backups are created."
  type        = string
  default     = "03:00-05:00"
}

variable "maintenance_window" {
  description = "The weekly time range (in UTC) during which system maintenance can occur."
  type        = string
  default     = "sun:05:00-sun:07:00"
}

variable "enable_encryption" {
  description = "Specifies whether the DB instance is encrypted."
  type        = bool
  default     = true
}

variable "multi_az" {
  description = "Specifies if the DB instance is multi-AZ."
  type        = bool
  default     = false
}

variable "tags" {
  description = "A map of tags to assign to the resources."
  type        = map(string)
  default     = {}
}
