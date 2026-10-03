USE shopdb;

CREATE OR REPLACE VIEW user_product_score AS
SELECT
  user_id,
  product_id,
  SUM(
    CASE interaction_type
      WHEN 'view' THEN 1
      WHEN 'add_to_cart' THEN 3
      WHEN 'purchase' THEN 5
      ELSE 0
    END
  ) AS score
FROM user_product_interaction
GROUP BY user_id, product_id;

ALTER TABLE user_product_interaction
  ADD INDEX IF NOT EXISTS idx_upi_user_product (user_id, product_id);

ALTER TABLE user_product_interaction
  ADD INDEX IF NOT EXISTS idx_interaction_user (user_id);

ALTER TABLE user_product_interaction
  ADD INDEX IF NOT EXISTS idx_interaction_product (product_id);