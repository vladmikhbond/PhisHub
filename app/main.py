import json
from contextlib import asynccontextmanager

from fastapi import Body, Depends, FastAPI, HTTPException, Path, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import Base, engine, get_db
from app.models import JsonRecord, User
from app.schemas import RecordRead, Token, UserCreate, UserRead
from app.security import (
    create_access_token,
    get_current_user,
    hash_password,
    reject_nonstandard_json_constant,
    verify_password,
)


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="JSON Key-Value API",
    description="Зберігання JSON-значень у SQLite з автентифікацією JWT.",
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post(
    "/auth/register",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    user = User(
        username=user_data.username,
        password_hash=hash_password(user_data.password),
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username is already registered",
        ) from None
    db.refresh(user)
    return user


@app.post("/auth/token", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = db.scalar(select(User).where(User.username == form_data.username))
    if user is None or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return Token(access_token=create_access_token(user.id))


@app.put("/data/{key}", response_model=RecordRead)
async def save_json(
    request: Request,
    body: object = Body(...),
    key: str = Path(min_length=1, max_length=255),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        json.loads(
            (await request.body()).decode("utf-8"),
            parse_constant=reject_nonstandard_json_constant,
        )
    except (UnicodeDecodeError, json.JSONDecodeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Request body must contain valid JSON",
        ) from None

    value = body
    record = db.scalar(
        select(JsonRecord).where(
            JsonRecord.user_id == current_user.id,
            JsonRecord.key == key,
        )
    )
    if record is None:
        record = JsonRecord(user_id=current_user.id, key=key, value=value)
        db.add(record)
    else:
        record.value = value

    db.commit()
    return RecordRead(key=key, value=value)


@app.get("/data/{key}", response_model=RecordRead)
def read_json(
    key: str = Path(min_length=1, max_length=255),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = db.scalar(
        select(JsonRecord).where(
            JsonRecord.user_id == current_user.id,
            JsonRecord.key == key,
        )
    )
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Key not found",
        )
    return RecordRead(key=record.key, value=record.value)


@app.delete("/data/{key}", status_code=status.HTTP_204_NO_CONTENT)
def delete_json(
    key: str = Path(min_length=1, max_length=255),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = db.scalar(
        select(JsonRecord).where(
            JsonRecord.user_id == current_user.id,
            JsonRecord.key == key,
        )
    )
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Key not found",
        )
    db.delete(record)
    db.commit()
