import io
import os
import sys
from contextlib import redirect_stdout
from pathlib import Path
_ui_dir = str(Path(__file__).resolve().parent.parent)
if _ui_dir not in sys.path:
    sys.path.insert(0, _ui_dir)

import streamlit as st
from module_loader import load_module

st.set_page_config(page_title="07 - Tool Use", page_icon="\U0001F527")
st.title("07 — MCP-Style Tool Use (Function Calling)")
st.write(
    "**Scenario:** an agent answering order questions by calling a "
    "local tool instead of guessing."
)

if not os.environ.get("GEMINI_API_KEY"):
    st.warning("Set a Gemini API key on the home page (app) sidebar to run this module.")
else:
    mod = load_module("07-mcp-tool-use")
    question = st.text_input("Question", value="Where is my order 7788?")
    if st.button("Run"):
        try:
            from google import genai
            client = genai.Client()
            buf = io.StringIO()
            with redirect_stdout(buf):
                mod.run_tool_loop(client, question)
            st.code(buf.getvalue())
        except Exception as e:
            st.error(f"Gemini call failed: {e}")
