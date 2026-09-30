import os
import sys
from pathlib import Path
_ui_dir = str(Path(__file__).resolve().parent.parent)
if _ui_dir not in sys.path:
    sys.path.insert(0, _ui_dir)

import streamlit as st
from module_loader import load_module

st.set_page_config(page_title="09 - Shared Knowledge", page_icon="\U0001F5C2")
st.title("09 — Agents Sharing Knowledge (Blackboard Pattern)")
st.write(
    "**Scenario:** a researcher, fact-checker, and writer agent "
    "collaborating through a shared knowledge store."
)

if not os.environ.get("GEMINI_API_KEY"):
    st.warning("Set a Gemini API key on the home page (app) sidebar to run this module.")
else:
    mod = load_module("09-agents-shared-knowledge")
    topic = st.text_input("Topic", value="why hybrid search outperforms pure keyword search")
    if st.button("Run pipeline"):
        try:
            from google import genai
            client = genai.Client()
            board = mod.Blackboard()

            mod.researcher_agent(client, board, topic)
            st.subheader("After researcher")
            for e in board.read_all():
                st.write(f"**[{e['agent']}] {e['key']}**: {e['value']}")

            mod.fact_checker_agent(client, board)
            st.subheader("After fact-checker")
            for e in board.read_all():
                st.write(f"**[{e['agent']}] {e['key']}**: {e['value']}")

            mod.writer_agent(client, board, topic)
            st.subheader("After writer")
            for e in board.read_all():
                st.write(f"**[{e['agent']}] {e['key']}**: {e['value']}")

            final = next(e["value"] for e in board.read_all() if e["key"] == "final_report")
            st.subheader("Final report")
            st.write(final)
        except Exception as e:
            st.error(f"Gemini call failed: {e}")
