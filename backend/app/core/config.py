import os
import re
from dotenv import load_dotenv

load_dotenv()


def parse_token_expiration(value: str) -> int:
    match = re.fullmatch(r"(\d+)([smhd])", value.strip().lower())
    if not match or int(match.group(1)) <= 0:
        raise ValueError("ACCESS_TOKEN_EXPIRE must be a positive duration such as 1h")

    amount = int(match.group(1))
    unit_seconds = {"s": 1, "m": 60, "h": 3600, "d": 86400}
    return amount * unit_seconds[match.group(2)]


class Settings:
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-change-me-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE: str = os.getenv("ACCESS_TOKEN_EXPIRE", "24h")
    ACCESS_TOKEN_EXPIRE_SECONDS: int = parse_token_expiration(ACCESS_TOKEN_EXPIRE)

settings = Settings()