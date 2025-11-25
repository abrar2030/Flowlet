# S3 Module: variables.tf

variable "name_prefix" {
  description = "A prefix for resource names."
  type        = string
}

variable "tags" {
  description = "A map of tags to assign to the resources."
  type        = map(string)
  default     = {}
}
