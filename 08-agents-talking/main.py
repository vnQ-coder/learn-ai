"""Module 08: two agents negotiating over HTTP.

Scenario: a trip-planner agent proposes a trip cost; a separate
budget-checker agent (its own local HTTP server) approves, rejects, or
counter-offers, until they agree or hit a round limit.
"""
import json
import threading
import time
from http.server import BaseHTTPRequestHandler, HTTPServer

import requests

BUDGET_LIMIT = 1200
PORT = 8801
MAX_ROUNDS = 5


class BudgetCheckerHandler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass  # keep stdout clean for the negotiation transcript

    def do_POST(self):
        length = int(self.headers["Content-Length"])
        body = json.loads(self.rfile.read(length))
        proposal = body["amount"]

        if proposal <= BUDGET_LIMIT:
            response = {"decision": "approved", "amount": proposal}
        else:
            counter = max(BUDGET_LIMIT, proposal * 0.8)
            response = {"decision": "counter", "amount": round(counter, 2)}

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(response).encode())


def start_budget_checker():
    server = HTTPServer(("localhost", PORT), BudgetCheckerHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server


def negotiate(initial_amount: float):
    amount = initial_amount
    for round_num in range(1, MAX_ROUNDS + 1):
        print(f"Round {round_num}: TripPlanner proposes ${amount:.2f}")
        resp = requests.post(f"http://localhost:{PORT}", json={"amount": amount})
        decision = resp.json()
        print(f"Round {round_num}: BudgetChecker responds: {decision}")

        if decision["decision"] == "approved":
            print(f"\nAgreement reached at ${decision['amount']:.2f} after {round_num} round(s).")
            return decision["amount"]

        amount = decision["amount"]

    print(f"\nNo agreement reached after {MAX_ROUNDS} rounds.")
    return None


def main():
    server = start_budget_checker()
    time.sleep(0.2)  # let the server thread bind before the first request
    try:
        negotiate(initial_amount=2000)
    finally:
        server.shutdown()


if __name__ == "__main__":
    main()
