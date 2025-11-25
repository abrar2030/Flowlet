# Redis Module: variables.tf

variable "name_prefix" {
  description = "A prefix for resource names."
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for the Redis subnet group."
  type        = list(string)
}

variable "security_group_ids" {
  description = "List of security group IDs to associate with the Redis cluster."
  type        = list(string)
}

variable "redis_node_type" {
  description = "The instance type of the Redis nodes."
  type        = string
}

variable "redis_num_cache_nodes" {
  description = "The number of cache nodes in the Redis cluster."
  type        = number
}

variable "redis_auth_token" {
  description = "The password used to access the Redis cluster."
  type        = string
  sensitive   = true
}

variable "tags" {
  description = "A map of tags to assign to the resources."
  type        = map(string)
  default     = {}
}
