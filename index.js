import os
import uuid
import requests
from flask import Flask, request, jsonify

app = Flask(__name__)

XANO_API_GET_BASE = os.environ.get("XANO_API_GET_BASE")
XANO_API_PATCH_BASE = os.environ.get("XANO_API_PATCH_BASE")

@app.route("/generate-ical", methods=["POST"])
def generate_ical_link():
    data = request.get_json(silent=True) or request.form
    if not data or "listing_id" not in data:
        return jsonify({"error": "Missing 'listing_id' in request body"}), 400

    listing_id = data["listing_id"]

    try:
        # GET listing from Xano
        get_response = requests.get(f"{XANO_API_GET_BASE}{listing_id}")
        get_response.raise_for_status()
        record = get_response.json()

        if isinstance(record, list):
            record = record[0] if record else {}

        existing_link = record.get("kampsync_ical_link") if isinstance(record, dict) else None

        # If already exists, return it
        if existing_link and isinstance(existing_link, str):
            return jsonify({"kampsync_ical_link": existing_link})

        # Otherwise, generate permanent new link
        unique_token = str(uuid.uuid4())
        new_ical_url = f"https://api.kampsync.com/v1/ical/{unique_token}"

        # PATCH Xano to save it
        patch_response = requests.patch(
            f"{XANO_API_PATCH_BASE}{listing_id}",
            json={"kampsync_ical_link": new_ical_url}
        )
        patch_response.raise_for_status()

        return jsonify({"kampsync_ical_link": new_ical_url})

    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))
