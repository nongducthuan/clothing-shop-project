import sys
import os
import io
import json
from pathlib import Path
from urllib.parse import urlparse
from dotenv import load_dotenv
from sqlalchemy import create_engine
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.utilities import SQLDatabase
from langchain_experimental.sql import SQLDatabaseChain
from langchain_core.prompts import PromptTemplate

env_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=env_path)

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

PROMPT_TEMPLATE = """Given an input question, first create a syntactically correct {dialect} query to run, then look at the results of the query and return the answer.
Use the following format:

Question: "Question here"
SQLQuery: "SQL Query to run"
SQLResult: "Result of the SQLQuery"
Answer: "Final answer here"

Only use the following tables:
{table_info}

IMPORTANT: Write the SQLQuery EXACTLY as plain text. DO NOT wrap it in ```sql ... ``` or any formatting backticks.

Question: {input}"""

PROMPT = PromptTemplate(
    input_variables=["input", "table_info", "dialect"], template=PROMPT_TEMPLATE
)


def build_db_uri() -> str:
    """Build a clean SQLAlchemy/pymysql-compatible URI.

    Priority: DATABASE_URL (if set) else individual DB_* env vars.
    Any query string on DATABASE_URL (e.g. ?ssl-mode=REQUIRED, which Prisma
    understands but pymysql does not) is stripped here, since we re-add SSL
    separately via connect_args in build_engine().
    """
    database_url = os.getenv("DATABASE_URL")

    if database_url:
        url_no_query = database_url.split("?")[0]
        db_uri = url_no_query.replace("mysql://", "mysql+pymysql://").replace(
            "mysql+mysqlconnector://", "mysql+pymysql://"
        )
    else:
        db_user = os.getenv("DB_USER", "root")
        db_password = os.getenv("DB_PASSWORD", "")
        db_host = os.getenv("DB_HOST", "localhost")
        db_name = os.getenv("DB_NAME", "shopdb")
        db_port = os.getenv("DB_PORT", "3306")
        db_uri = f"mysql+pymysql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

    return db_uri


import tempfile

DB_SSL_CA_INLINE = None  


def build_engine(db_uri: str):
    """Create a SQLAlchemy engine with SSL enabled (Aiven requires SSL).

    Priority:
      1. DB_SSL_CA_INLINE (cert content pasted directly in code)
      2. DB_SSL_CA env var (path to a ca.pem file)
      3. Plain SSL with no CA verification (still encrypted)
    """
    if DB_SSL_CA_INLINE:
        # Write the inline cert to a temp file, since pymysql expects a path
        tmp = tempfile.NamedTemporaryFile(mode="w", suffix=".pem", delete=False)
        tmp.write(DB_SSL_CA_INLINE)
        tmp.close()
        connect_args = {"ssl": {"ca": tmp.name}}
    else:
        ca_path = os.getenv("DB_SSL_CA")  # optional: path to Aiven ca.pem
        if ca_path and os.path.exists(ca_path):
            connect_args = {"ssl": {"ca": ca_path}}
        else:
            connect_args = {"ssl": {"ssl": True}}

    return create_engine(db_uri, connect_args=connect_args)


def execute_chat_query(user_query: str, chat_history_json: str) -> None:
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return

    try:
        db_uri = build_db_uri()
        engine = build_engine(db_uri)
        database = SQLDatabase(engine)

        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash-lite",
            google_api_key=api_key,
            temperature=0,
        )

        db_chain = SQLDatabaseChain.from_llm(
            llm, database, verbose=False, use_query_checker=False, prompt=PROMPT
        )

        context_prompt = user_query

        if chat_history_json:
            try:
                history_list = json.loads(chat_history_json)
                if history_list:
                    history_str = "\n".join(
                        [f"{msg['role']}: {msg['content']}" for msg in history_list]
                    )
                    context_prompt = f"Chat history:\n{history_str}\n\nCurrent Question: {user_query}"
            except Exception:
                pass

        response = db_chain.invoke({"query": context_prompt})
        print(response.get("result", ""))

    except Exception as error:
        print(f"Error: {error}")


def main():
    if len(sys.argv) < 2:
        return

    user_query = sys.argv[1]
    chat_history_json = sys.argv[2] if len(sys.argv) > 2 else ""

    execute_chat_query(user_query, chat_history_json)


if __name__ == "__main__":
    main()