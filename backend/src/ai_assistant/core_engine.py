import sys
import os
import io
import json
from pathlib import Path
from dotenv import load_dotenv
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


def execute_chat_query(user_query: str, chat_history_json: str) -> None:
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return

    database_url = os.getenv("DATABASE_URL")
    db_user = os.getenv("DB_USER", "root")
    db_password = os.getenv("DB_PASSWORD", "")
    db_host = os.getenv("DB_HOST", "localhost")
    db_name = os.getenv("DB_NAME", "shopdb")
    db_port = os.getenv("DB_PORT", "3306") 

    try:
        if database_url:
            db_uri = database_url.replace("mysql://", "mysql+pymysql://").replace("mysql+mysqlconnector://", "mysql+pymysql://")
        else:
            db_uri = f"mysql+pymysql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
        database = SQLDatabase.from_uri(db_uri)

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
