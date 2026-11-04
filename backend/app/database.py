from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Replace with your actual database credentials
SQLALCHEMY_DATABASE_URL = "mysql+pymysql://root:@127.0.0.1/scm_revamp"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# This is the Base that your models.py imports
Base = declarative_base()

# Dependency to get the DB session in your routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()