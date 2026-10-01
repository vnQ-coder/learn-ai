"""Module 15: a real LangChain LCEL pipeline — composable prompt | llm | parser chains.

Scenario: triage a raw customer email through two composed LangChain chains:
first summarize it, then classify the summary into structured fields. Unlike
every other module in this curriculum, this one uses the actual LangChain
library (not a hand-rolled Gemini SDK call) so you can see what the
`prompt | llm | parser` composition pattern looks like in real code.
"""
import os
import sys

from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

MODEL = "gemini-2.5-flash"


class Classification(BaseModel):
    category: str = Field(description="one of: billing, technical, account, other")
    priority: str = Field(description="one of: low, medium, high")
    sentiment: str = Field(description="one of: positive, neutral, negative")


def _llm(api_key: str) -> ChatGoogleGenerativeAI:
    return ChatGoogleGenerativeAI(model=MODEL, google_api_key=api_key)


def summarize(api_key: str, email: str) -> str:
    """LangChain chain 1: prompt | llm | string parser."""
    prompt = ChatPromptTemplate.from_template(
        "Summarize this customer email in one concise sentence:\n\n{email}"
    )
    chain = prompt | _llm(api_key) | StrOutputParser()
    return chain.invoke({"email": email})


def classify(api_key: str, summary: str) -> Classification:
    """LangChain chain 2: prompt | llm with structured (Pydantic) output."""
    prompt = ChatPromptTemplate.from_template(
        "Classify this customer email summary.\n\nSummary: {summary}"
    )
    chain = prompt | _llm(api_key).with_structured_output(Classification)
    return chain.invoke({"summary": summary})


def main():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("ERROR: set GEMINI_API_KEY to run this module.")
        sys.exit(1)

    email = (
        "Hi, this is the third time I'm writing. My card was charged twice "
        "for the same order and nobody has refunded me. This is extremely "
        "frustrating and I need this fixed today."
    )

    summary = summarize(api_key, email)
    print(f"Summary: {summary}")

    result = classify(api_key, summary)
    print(f"Classification: category={result.category} priority={result.priority} sentiment={result.sentiment}")


if __name__ == "__main__":
    main()
