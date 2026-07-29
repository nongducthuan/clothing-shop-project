import os
import logging
import pymysql
import pandas as pd
import sys
import json
import warnings
from dotenv import load_dotenv
from sklearn.metrics.pairwise import cosine_similarity
from typing import Dict
from typing import cast

# 1. TẮT WARNING (Quan trọng để không làm hỏng JSON output)
warnings.filterwarnings("ignore")

# 2. LOGGING CONFIG: Chỉ ghi ra STDERR
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    stream=sys.stderr,  # BẮT BUỘC: Log không được lẫn vào stdout
)
logger = logging.getLogger(__name__)

# LOAD ENVIRONMENT VARIABLES
load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "shopdb")


# DATABASE CONNECTION
def get_db_connection():
    try:
        return pymysql.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            cursorclass=pymysql.cursors.DictCursor,
        )
    except pymysql.MySQLError as e:
        logger.error("[RECOMMENDER] Database connection error: %s", e)
        raise


# LOAD INTERACTION SCORES
def load_user_product_scores() -> pd.DataFrame:
    # Lấy dữ liệu từ VIEW user_product_score
    sql = """
        SELECT user_id, product_id, score
        FROM user_product_score
    """
    connection = None
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute(sql)
            rows = cursor.fetchall()

        if not rows:
            logger.warning("[RECOMMENDER] No data found in user_product_score.")
            return pd.DataFrame()

        df = pd.DataFrame(rows)
        # Ép kiểu dữ liệu để tối ưu bộ nhớ
        df["user_id"] = df["user_id"].astype(int)
        df["product_id"] = df["product_id"].astype(int)
        df["score"] = df["score"].astype(float)

        return df

    except Exception as e:
        logger.error("[RECOMMENDER] Failed to load interaction scores: %s", e)
        raise
    finally:
        if connection:
            connection.close()


# BUILD USER-ITEM MATRIX
def build_user_item_matrix(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return pd.DataFrame()

    matrix = df.pivot_table(
        index="user_id",
        columns="product_id",
        values="score",
        fill_value=0,
    )
    return matrix


# BUILD ITEM-USER MATRIX & SIMILARITY
def compute_item_similarity(user_item_matrix: pd.DataFrame) -> pd.DataFrame:
    if user_item_matrix.empty:
        return pd.DataFrame()

    # Transpose to get Item-User Matrix
    item_user_matrix = user_item_matrix.T

    # Compute Cosine Similarity
    similarity = cosine_similarity(item_user_matrix.values)

    similarity_df = pd.DataFrame(
        similarity,
        index=item_user_matrix.index,
        columns=item_user_matrix.index,
    )
    return similarity_df


# RECOMMEND ITEMS FOR USER (ITEM-BASED CF)
def recommend_items_for_user(
    user_id: int,
    user_item_matrix: pd.DataFrame,
    similarity_df: pd.DataFrame,
    top_k: int = 5,
) -> list[int]:

    # Check 1: User có tồn tại trong ma trận không?
    if user_id not in user_item_matrix.index:
        logger.warning(f"User {user_id} not found in matrix (New user/Cold start).")
        return []

    # Lấy lịch sử tương tác của user (chỉ lấy những sản phẩm có score > 0)
    raw_history = user_item_matrix.loc[user_id]
    user_history = cast(pd.Series, raw_history)
    user_history = user_history[user_history > 0]

    if user_history.empty:
        return []

    scores: Dict[int, float] = {}

    # Duyệt qua từng sản phẩm user đã tương tác (Item I)
    for item_i, interaction_score in user_history.items():
        item_i = cast(int, item_i)

        if item_i not in similarity_df.index:
            continue

        # Lấy các sản phẩm tương đồng với Item I
        similar_items = similarity_df.loc[item_i]

        # Duyệt qua các sản phẩm tương đồng (Item J)
        for item_j, sim in similar_items.items():
            item_j = cast(int, item_j)

            # Bỏ qua chính nó
            if item_j == item_i:
                continue

            # Bỏ qua sản phẩm user đã mua/xem rồi (Chúng ta muốn gợi ý cái MỚI)
            if item_j in user_history.index:
                continue

            # Công thức: Score dự đoán += (Điểm user chấm cho I) * (Độ giống nhau giữa I và J)
            scores[item_j] = scores.get(item_j, 0.0) + interaction_score * sim

    # Sắp xếp giảm dần theo điểm dự đoán
    ranked_items = sorted(scores.items(), key=lambda x: x[1], reverse=True)

    # Chỉ lấy top K ID sản phẩm
    return [item[0] for item in ranked_items[:top_k]]


# --- MAIN FUNCTIONS ---


def run_for_user(user_id: int):
    """
    Hàm này được gọi bởi Node.js
    Nhiệm vụ: In ra JSON Array các ID sản phẩm
    """
    try:
        # 1. Load Data
        df_scores = load_user_product_scores()

        # 2. Xử lý trường hợp DB trống
        if df_scores.empty:
            print(json.dumps([]))  # Trả về mảng rỗng
            return

        # 3. Build Matrices
        user_item_matrix = build_user_item_matrix(df_scores)

        # 4. Compute Similarity
        # Lưu ý: Với hệ thống lớn, bước này nên cache lại (Redis/File), không nên tính mỗi lần request
        similarity_df = compute_item_similarity(user_item_matrix)

        # 5. Get Recommendations
        recommendations = recommend_items_for_user(
            user_id=user_id,
            user_item_matrix=user_item_matrix,
            similarity_df=similarity_df,
            top_k=8,  # Lấy 8 sản phẩm
        )

        # 6. OUTPUT JSON (QUAN TRỌNG: Chỉ print cái này)
        print(json.dumps(recommendations))

    except Exception as e:
        # Nếu lỗi, log vào stderr để debug, nhưng print [] ra stdout để Node.js không crash
        logger.error(f"[CRITICAL ERROR] {str(e)}")
        print(json.dumps([]))


def main():
    """Hàm test chạy tay"""
    try:
        df_scores = load_user_product_scores()
        if df_scores.empty:
            logger.warning("No data.")
            return

        user_item_matrix = build_user_item_matrix(df_scores)
        similarity_df = compute_item_similarity(user_item_matrix)

        # Lấy user đầu tiên làm mẫu
        example_user_id = int(user_item_matrix.index[0])
        recs = recommend_items_for_user(
            example_user_id, user_item_matrix, similarity_df
        )

        logger.info(f"Test User {example_user_id} Recommendations: {recs}")

    except Exception as e:
        logger.error(f"Test failed: {e}")


if __name__ == "__main__":
    # Nếu có tham số dòng lệnh (Node.js gọi: python script.py 123)
    if len(sys.argv) == 2:
        try:
            u_id = int(sys.argv[1])
            run_for_user(u_id)
        except ValueError:
            print(json.dumps([]))  # User ID không hợp lệ
    else:
        main()
