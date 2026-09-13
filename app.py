import json
import os
import secrets
import sqlite3
from datetime import datetime, timezone

from flask import Flask, jsonify, redirect, request, send_from_directory, session
from werkzeug.security import check_password_hash, generate_password_hash


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INSTANCE_DIR = os.path.join(BASE_DIR, "instance")
DB_PATH = os.path.join(INSTANCE_DIR, "txk.db")
SECRET_PATH = os.path.join(INSTANCE_DIR, "secret_key")

os.makedirs(INSTANCE_DIR, exist_ok=True)


def load_or_create_secret_key():
    key = os.environ.get("SECRET_KEY")
    if key:
        return key
    try:
        with open(SECRET_PATH, "r", encoding="utf-8") as f:
            return f.read().strip()
    except FileNotFoundError:
        key = secrets.token_hex(32)
        with open(SECRET_PATH, "w", encoding="utf-8") as f:
            f.write(key)
        return key


app = Flask(__name__, static_folder=BASE_DIR, static_url_path="")
app.secret_key = load_or_create_secret_key()
app.config["MAX_CONTENT_LENGTH"] = 64 * 1024 * 1024
app.config["JSON_AS_ASCII"] = False

INVITE_CODE = os.environ.get("INVITE_CODE", "taokexin2026").strip()


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS app_state (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                data TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def current_user():
    user_id = session.get("user_id")
    if not user_id:
        return None
    with get_db() as conn:
        row = conn.execute(
            "SELECT id, username, role FROM users WHERE id = ?", (user_id,)
        ).fetchone()
    return row


def require_login():
    user = current_user()
    if not user:
        return None, jsonify({"message": "请先登录"}), 401
    return user, None, None


@app.route("/")
def index():
    if not session.get("user_id"):
        return redirect("/login")
    return send_from_directory(BASE_DIR, "index.html")


@app.route("/login")
def login_page():
    if session.get("user_id"):
        return redirect("/")
    return send_from_directory(BASE_DIR, "login.html")


@app.route("/register")
def register_page():
    if session.get("user_id"):
        return redirect("/")
    return send_from_directory(BASE_DIR, "register.html")


@app.route("/api/health")
def health():
    return jsonify({"ok": True})


@app.post("/api/register")
def register():
    payload = request.get_json(silent=True) or {}
    username = str(payload.get("username") or "").strip()
    password = str(payload.get("password") or "")
    invite_code = str(payload.get("invite_code") or "").strip()
    role = str(payload.get("role") or "student").strip()

    if not (3 <= len(username) <= 30):
        return jsonify({"message": "用户名长度需为 3 到 30 个字符"}), 400
    if len(password) < 6:
        return jsonify({"message": "密码至少需要 6 位"}), 400
    if invite_code != INVITE_CODE:
        return jsonify({"message": "邀请码不正确"}), 400
    if role not in {"student", "parent"}:
        return jsonify({"message": "请选择正确的账号身份"}), 400

    password_hash = generate_password_hash(password)
    try:
        with get_db() as conn:
            cursor = conn.execute(
                """
                INSERT INTO users (username, password_hash, role, created_at)
                VALUES (?, ?, ?, ?)
                """,
                (username, password_hash, role, now_iso()),
            )
            user_id = cursor.lastrowid
    except sqlite3.IntegrityError:
        return jsonify({"message": "该用户名已存在，请更换一个"}), 409

    session.clear()
    session["user_id"] = user_id
    session["username"] = username
    session["role"] = role
    return jsonify({"ok": True, "username": username, "role": role})


@app.post("/api/login")
def login():
    payload = request.get_json(silent=True) or {}
    username = str(payload.get("username") or "").strip()
    password = str(payload.get("password") or "")

    with get_db() as conn:
        row = conn.execute(
            "SELECT id, username, password_hash, role FROM users WHERE username = ?",
            (username,),
        ).fetchone()

    if not row or not check_password_hash(row["password_hash"], password):
        return jsonify({"message": "用户名或密码不正确"}), 401

    session.clear()
    session["user_id"] = row["id"]
    session["username"] = row["username"]
    session["role"] = row["role"]
    return jsonify({"ok": True, "username": row["username"], "role": row["role"]})


@app.post("/api/logout")
def logout():
    session.clear()
    return jsonify({"ok": True})


@app.get("/api/me")
def me():
    user = current_user()
    if not user:
        return jsonify({"message": "请先登录"}), 401
    return jsonify(
        {
            "username": user["username"],
            "role": user["role"],
        }
    )


@app.get("/api/state")
def get_state():
    if not session.get("user_id"):
        return jsonify({"message": "请先登录"}), 401
    with get_db() as conn:
        row = conn.execute("SELECT data FROM app_state WHERE id = 1").fetchone()
    if not row:
        return jsonify({"data": None})
    try:
        data = json.loads(row["data"])
    except json.JSONDecodeError:
        return jsonify({"data": None})
    return jsonify({"data": data})


@app.post("/api/state")
def save_state():
    if not session.get("user_id"):
        return jsonify({"message": "请先登录"}), 401
    payload = request.get_json(silent=True)
    if not payload or not isinstance(payload.get("data"), dict):
        return jsonify({"message": "数据格式不正确"}), 400
    data = payload["data"]
    if not isinstance(data.get("subjects"), list) or not isinstance(data.get("knowledgePoints"), list):
        return jsonify({"message": "缺少 subjects 或 knowledgePoints"}), 400

    data_json = json.dumps(data, ensure_ascii=False)
    with get_db() as conn:
        conn.execute(
            """
            INSERT INTO app_state (id, data, updated_at)
            VALUES (1, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                data = excluded.data,
                updated_at = excluded.updated_at
            """,
            (data_json, now_iso()),
        )
    return jsonify({"ok": True})


@app.errorhandler(413)
def payload_too_large(error):
    return jsonify({"message": "上传的数据过大，请压缩错题图片后重试"}), 413


init_db()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    app.run(host="0.0.0.0", port=port, debug=os.environ.get("FLASK_DEBUG") == "1")
