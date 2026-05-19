USE shopdb;

-- ==============================================================================
-- VIEWS
-- ==============================================================================

-- Generates a recommendation score based on user interaction weights
CREATE VIEW user_product_score AS
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

-- ==============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ==============================================================================

CREATE INDEX idx_upi_user_product ON user_product_interaction(user_id, product_id);
CREATE INDEX idx_interaction_user ON user_product_interaction(user_id);
CREATE INDEX idx_interaction_product ON user_product_interaction(product_id);
CREATE INDEX idx_product_id ON products(id);
