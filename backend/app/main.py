import os
import re
import shutil
import smtplib
import sqlite3
import logging
from datetime import datetime
from email.message import EmailMessage
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parents[1]
STORAGE_DIR = BASE_DIR / "storage"
STORAGE_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = BASE_DIR / "mailflow.db"
PPT_PATH = STORAGE_DIR / "sih_official_template.pptx"
ENV_PATH = BASE_DIR / ".env"
load_dotenv(ENV_PATH)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mailflow")

REQUIRED_COLUMNS = [
    "Registration ID",
    "Team Name",
    "PS ID",
    "PS Title",
    "Leader Name",
    "Leader Email",
]

app = FastAPI(title="MailFlow API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS teams (
                registration_id TEXT PRIMARY KEY,
                team_name TEXT NOT NULL,
                ps_id TEXT NOT NULL,
                ps_title TEXT NOT NULL,
                leader_name TEXT NOT NULL,
                leader_email TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'New',
                last_contacted TEXT DEFAULT 'Never',
                added_at TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS campaigns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                subject TEXT NOT NULL,
                recipients INTEGER NOT NULL,
                sent INTEGER NOT NULL DEFAULT 0,
                failed INTEGER NOT NULL DEFAULT 0,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS email_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                team_name TEXT NOT NULL,
                leader_name TEXT NOT NULL,
                leader_email TEXT NOT NULL,
                campaign TEXT NOT NULL,
                status TEXT NOT NULL,
                sent_at TEXT NOT NULL,
                error TEXT
            )
        """)
        columns = {row[1] for row in conn.execute("PRAGMA table_info(email_history)").fetchall()}
        if "error" not in columns:
            conn.execute("ALTER TABLE email_history ADD COLUMN error TEXT")


init_db()


def clean(value) -> str:
    if pd.isna(value):
        return ""
    return str(value).strip()


def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    df.columns = [re.sub(r"\s+", " ", str(c).strip()) for c in df.columns]
    return df


def valid_email(value: str) -> bool:
    return bool(re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", value))


def read_file(path: Path) -> pd.DataFrame:
    if path.suffix.lower() == ".csv":
        return normalize_columns(pd.read_csv(path))
    return normalize_columns(pd.read_excel(path))


@app.get("/")
def root():
    return {"message": "MailFlow backend running successfully"}


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "smtp_configured": all(os.getenv(k) for k in ["SMTP_HOST", "SMTP_USERNAME", "SMTP_PASSWORD"]),
        "ppt_template_uploaded": PPT_PATH.exists(),
    }


@app.get("/api/teams")
def teams():
    with connection() as conn:
        rows = conn.execute("SELECT * FROM teams ORDER BY added_at DESC").fetchall()
    return [dict(row) for row in rows]


@app.post("/api/teams/upload")
async def upload_teams(file: UploadFile = File(...)):
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in {".xlsx", ".xls", ".csv"}:
        raise HTTPException(400, "Upload an .xlsx, .xls, or .csv file.")

    temp_path = STORAGE_DIR / f"registration_upload{suffix}"
    with temp_path.open("wb") as target:
        shutil.copyfileobj(file.file, target)

    try:
        df = read_file(temp_path)
    except Exception as exc:
        temp_path.unlink(missing_ok=True)
        raise HTTPException(400, f"Could not read the file: {exc}") from exc

    missing = [column for column in REQUIRED_COLUMNS if column not in df.columns]
    if missing:
        temp_path.unlink(missing_ok=True)
        raise HTTPException(
            400,
            {"message": "Required columns are missing.", "missing_columns": missing},
        )

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    new_count = 0
    updated_count = 0
    invalid_count = 0

    with connection() as conn:
        for _, row in df.iterrows():
            values = {column: clean(row[column]) for column in REQUIRED_COLUMNS}
            if not all(values.values()) or not valid_email(values["Leader Email"]):
                invalid_count += 1
                continue

            exists = conn.execute(
                "SELECT 1 FROM teams WHERE registration_id = ?",
                (values["Registration ID"],),
            ).fetchone()

            if exists:
                conn.execute("""
                    UPDATE teams
                    SET team_name=?, ps_id=?, ps_title=?, leader_name=?, leader_email=?, status='Updated'
                    WHERE registration_id=?
                """, (
                    values["Team Name"], values["PS ID"], values["PS Title"],
                    values["Leader Name"], values["Leader Email"], values["Registration ID"],
                ))
                updated_count += 1
            else:
                conn.execute("""
                    INSERT INTO teams
                    (registration_id, team_name, ps_id, ps_title, leader_name, leader_email, status, added_at)
                    VALUES (?, ?, ?, ?, ?, ?, 'New', ?)
                """, (
                    values["Registration ID"], values["Team Name"], values["PS ID"],
                    values["PS Title"], values["Leader Name"], values["Leader Email"], now,
                ))
                new_count += 1

    temp_path.unlink(missing_ok=True)
    return {
        "message": "Registration file processed.",
        "total_rows": len(df),
        "new_count": new_count,
        "updated_count": updated_count,
        "invalid_count": invalid_count,
    }


@app.get("/api/settings/template")
def get_template():
    if not PPT_PATH.exists():
        return {"exists": False}
    return {"exists": True, "filename": PPT_PATH.name, "size": PPT_PATH.stat().st_size}


@app.post("/api/settings/template")
async def upload_template(file: UploadFile = File(...)):
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in {".pptx", ".ppt"}:
        raise HTTPException(400, "Upload a .ppt or .pptx PowerPoint file.")
    with PPT_PATH.open("wb") as target:
        shutil.copyfileobj(file.file, target)
    return {"message": "PPT template uploaded successfully.", "filename": file.filename}


class CampaignRequest(BaseModel):
    name: str
    subject: str
    body: str


def render_message(template: str, team: dict) -> str:
    replacements = {
        "{team_leader_name}": team["leader_name"],
        "{team_name}": team["team_name"],
        "{PS_NUMBER}": team["ps_id"],
        "{Problem Title}": team["ps_title"],
        "{name}": team["leader_name"],
        "{registration_id}": team["registration_id"],
        "{sih_official_ppt_template}": "Attached: Official SIH PPT Template",
    }
    for key, value in replacements.items():
        template = template.replace(key, value)
    return template


def send_email(team: dict, subject: str, body: str):
    host = os.getenv("SMTP_HOST")
    port = int(os.getenv("SMTP_PORT", "587"))
    username = os.getenv("SMTP_USERNAME")
    password = os.getenv("SMTP_PASSWORD")
    sender = os.getenv("SMTP_FROM") or username
    if not all([host, username, password, sender]):
        raise RuntimeError("SMTP is not configured in backend/.env")

    message = EmailMessage()
    message["From"] = sender
    message["To"] = team["leader_email"]
    message["Subject"] = subject
    message.set_content(render_message(body, team))

    if PPT_PATH.exists():
        message.add_attachment(
            PPT_PATH.read_bytes(),
            maintype="application",
            subtype="vnd.openxmlformats-officedocument.presentationml.presentation",
            filename="SIH_2026_Official_PPT_Template.pptx",
        )

    with smtplib.SMTP(host, port, timeout=30) as smtp:
        smtp.starttls()
        smtp.login(username, password)
        smtp.send_message(message)


def safe_error(exc: Exception) -> str:
    """Return a useful SMTP error without exposing credentials."""
    if isinstance(exc, smtplib.SMTPAuthenticationError):
        return f"SMTP authentication failed (server code {exc.smtp_code}). Check the SMTP username and app password."
    if isinstance(exc, smtplib.SMTPConnectError):
        return "Could not connect to the SMTP server. Check SMTP host and port."
    if isinstance(exc, smtplib.SMTPServerDisconnected):
        return "The SMTP server disconnected unexpectedly. Check TLS/port settings."
    if isinstance(exc, smtplib.SMTPRecipientsRefused):
        return "The SMTP server rejected the recipient address."
    if isinstance(exc, smtplib.SMTPException):
        return f"SMTP error: {exc.__class__.__name__}"
    return f"{exc.__class__.__name__}: {str(exc)[:180]}"


@app.get("/api/campaigns")
def campaigns():
    with connection() as conn:
        rows = conn.execute("SELECT * FROM campaigns ORDER BY id DESC").fetchall()
    return [dict(row) for row in rows]


@app.post("/api/campaigns/send")
def send_campaign(request: CampaignRequest):
    if not PPT_PATH.exists():
        raise HTTPException(400, "Upload the official SIH PPT template in Settings first.")

    # Only send to teams that have never been successfully contacted.
    # Failed sends remain eligible for a later retry because last_contacted stays 'Never'.
    with connection() as conn:
        rows = conn.execute("""
            SELECT * FROM teams
            WHERE last_contacted IS NULL OR last_contacted = 'Never'
            ORDER BY added_at
        """).fetchall()

    if not rows:
        raise HTTPException(400, "No new or previously failed teams are waiting for email.")

    created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with connection() as conn:
        campaign_id = conn.execute("""
            INSERT INTO campaigns (name, subject, recipients, status, created_at)
            VALUES (?, ?, ?, 'Sending', ?)
        """, (request.name, request.subject, len(rows), created_at)).lastrowid

    sent = 0
    failed = 0
    for row in rows:
        team = dict(row)
        error_message = None
        try:
            send_email(team, request.subject, request.body)
            sent += 1
            status = "Delivered"
            with connection() as conn:
                conn.execute("UPDATE teams SET last_contacted=?, status='Delivered' WHERE registration_id=?", (created_at, team["registration_id"]))
            logger.info("Email sent successfully to leader for team %s", team["team_name"])
        except Exception as exc:
            failed += 1
            status = "Failed"
            error_message = safe_error(exc)
            logger.error("Email failed for team %s: %s", team["team_name"], error_message)

        with connection() as conn:
            conn.execute("""
                INSERT INTO email_history
                (team_name, leader_name, leader_email, campaign, status, sent_at, error)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (team["team_name"], team["leader_name"], team["leader_email"], request.name, status, created_at, error_message))

    final_status = "Completed" if failed == 0 else ("Failed" if sent == 0 else "Completed with errors")
    with connection() as conn:
        conn.execute("UPDATE campaigns SET sent=?, failed=?, status=? WHERE id=?", (sent, failed, final_status, campaign_id))

    return {
        "campaign_id": campaign_id,
        "sent_count": sent,
        "failed_count": failed,
        "status": final_status,
    }


@app.get("/api/history")
def history():
    with connection() as conn:
        rows = conn.execute("SELECT * FROM email_history ORDER BY id DESC").fetchall()
    return [dict(row) for row in rows]
