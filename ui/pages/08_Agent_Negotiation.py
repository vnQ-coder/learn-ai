import io
import sys
import time
from contextlib import redirect_stdout
from pathlib import Path
_ui_dir = str(Path(__file__).resolve().parent.parent)
if _ui_dir not in sys.path:
    sys.path.insert(0, _ui_dir)

import streamlit as st
from module_loader import load_module

st.set_page_config(page_title="08 - Agent Negotiation", page_icon="\U0001F91D")
st.title("08 — Agents Talking (Agent-to-Agent Negotiation)")
st.write(
    "**Scenario:** a trip-planner agent negotiating budget with a "
    "separate budget-checker agent over HTTP."
)

mod = load_module("08-agents-talking")
if st.button("Run negotiation"):
    server = mod.start_budget_checker()
    buf = io.StringIO()
    try:
        time.sleep(0.2)
        try:
            with redirect_stdout(buf):
                mod.negotiate(initial_amount=2000)
            st.code(buf.getvalue())
        except Exception as e:
            if buf.getvalue():
                st.code(buf.getvalue())
            st.error(f"Negotiation failed: {e}")
    finally:
        server.shutdown()
        server.server_close()
