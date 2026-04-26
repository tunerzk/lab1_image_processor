resource "aws_sns_topic" "order_notifications" {
  name = "${local.project}-notifications"
  tags = local.tags
}
