import json
from contextlib import asynccontextmanager
from pathlib import Path as FilePath
from typing import Annotated
from urllib.parse import urlsplit

from fastapi import (
    Body,
    Depends,
    FastAPI,
    HTTPException,
    Path,
    Request,
    Response,
    status,
)
from fastapi.responses import FileResponse, JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import Base, engine, get_db
from app.models import SceneRecord, User
from app.schemas import SceneRead, UserCreate, UserRead, Records
from app.security import (
    ACCESS_TOKEN_COOKIE,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    AUTH_COOKIE_SECURE,
    CSRF_TOKEN_COOKIE,
    create_access_token,
    get_current_user,
    hash_password,
    reject_nonstandard_json_constant,
    require_csrf_token,
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

# Регістрація юзера
#
@app.post(
    "/auth/register",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
)
def register(
    user_data: UserCreate,
    db: Annotated[Session, Depends(get_db)],
):
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


@app.post("/auth/token")
def login(
    request: Request,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[Session, Depends(get_db)],
):
    origin = request.headers.get("origin")
    if origin is not None:
        try:
            origin_parts = urlsplit(origin)
            request_parts = urlsplit(str(request.base_url))
            same_origin = (
                origin_parts.scheme.lower() == request_parts.scheme.lower()
                and (origin_parts.hostname or "").lower()
                == (request_parts.hostname or "").lower()
                and origin_parts.port == request_parts.port
            )
        except ValueError:
            same_origin = False
        if not same_origin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cross-origin login is not allowed",
            )

    user = db.scalar(select(User).where(User.username == form_data.username))
    if user is None or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    access_token, csrf_token = create_access_token(user.id)
    response = JSONResponse({"message": "Login successful"})
    cookie_max_age = ACCESS_TOKEN_EXPIRE_MINUTES * 60
    response.set_cookie(
        key=ACCESS_TOKEN_COOKIE,
        value=access_token,
        max_age=cookie_max_age,
        httponly=True,
        secure=AUTH_COOKIE_SECURE,
        samesite="lax",
        path="/",
    )
    response.set_cookie(
        key=CSRF_TOKEN_COOKIE,
        value=csrf_token,
        max_age=cookie_max_age,
        httponly=False,
        secure=AUTH_COOKIE_SECURE,
        samesite="lax",
        path="/",
    )
    return response


@app.post("/auth/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    response: Response,
    _: Annotated[None, Depends(require_csrf_token)],
):
    response.delete_cookie(
        key=ACCESS_TOKEN_COOKIE,
        secure=AUTH_COOKIE_SECURE,
        httponly=True,
        samesite="lax",
        path="/",
    )
    response.delete_cookie(
        key=CSRF_TOKEN_COOKIE,
        secure=AUTH_COOKIE_SECURE,
        httponly=False,
        samesite="lax",
        path="/",
    )


#==================================================================================

# Отримати всі ключі сцен поточного користувача
#
@app.get("/data/keys", response_model=Records)
def read_keys(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    keys = db.scalars(
        select(SceneRecord.key)
        .where(SceneRecord.user_id == current_user.id)
        .order_by(SceneRecord.key)
    ).all()
    return Records(keys=keys)


# Зберегти сцену в базі даних
# 
@app.put("/data/{key}", response_model=SceneRead)
async def save_json(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    _: Annotated[None, Depends(require_csrf_token)],
    body: object = Body(...),
    key: str = Path(min_length=1, max_length=255),
):
    value = body
    scene = db.scalar(
        select(SceneRecord).where(
            SceneRecord.user_id == current_user.id,
            SceneRecord.key == key,
        )
    )
    if scene is None:
        scene = SceneRecord(user_id=current_user.id, key=key, value=value)
        db.add(scene)
    else:
        scene.value = value

    db.commit()
    return SceneRead(key=key, value=value)


# Завантажити сцену з бази даних
#     
@app.get("/data/{key}", response_model=SceneRead)
def read_json(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    key: str = Path(min_length=1, max_length=255),
):
    scene = db.scalar(
        select(SceneRecord).where(
            SceneRecord.user_id == current_user.id,
            SceneRecord.key == key,
        )
    )
    if scene is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Key not found",
        )
    return SceneRead(key=scene.key, value=scene.value)

# Видалити сцену з бази даних
# 
@app.delete("/data/{key}", status_code=status.HTTP_204_NO_CONTENT)
def delete_json(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    _: Annotated[None, Depends(require_csrf_token)],
    key: str = Path(min_length=1, max_length=255),
):
    scene = db.scalar(
        select(SceneRecord).where(
            SceneRecord.user_id == current_user.id,
            SceneRecord.key == key,
        )
    )
    if scene is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Key not found",
        )
    db.delete(scene)
    db.commit()


@app.get("/", include_in_schema=False)
def homepage():
    return FileResponse(FilePath(__file__).parent / "static" / "home.html")


# Статичний контент має бути останнім, щоб не перехоплювати API-маршрути.
app.mount(
    "/",
    StaticFiles(directory=FilePath(__file__).parent / "static", html=True),
    name="static",
)
