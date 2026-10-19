import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app


@pytest.fixture
def client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    try:
        yield TestClient(app, base_url="https://testserver")
    finally:
        app.dependency_overrides.clear()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


def register_and_login(client: TestClient, username: str) -> dict[str, str]:
    response = client.post(
        "/auth/register",
        json={"username": username, "password": "correct-horse-battery"},
    )
    assert response.status_code == 201

    response = client.post(
        "/auth/token",
        data={"username": username, "password": "correct-horse-battery"},
        headers={"Origin": "https://testserver"},
    )
    assert response.status_code == 200
    assert "access_token" not in response.json()
    assert response.cookies.get("access_token")
    assert response.cookies.get("csrf_token")
    cookie_headers = response.headers.get_list("set-cookie")
    assert any(
        "access_token=" in value
        and "httponly" in value.lower()
        and "secure" in value.lower()
        and "samesite=lax" in value.lower()
        for value in cookie_headers
    )
    assert any(
        "csrf_token=" in value and "httponly" not in value.lower()
        for value in cookie_headers
    )
    return {
        "access_token": response.cookies["access_token"],
        "csrf_token": response.cookies["csrf_token"],
    }


def use_session(client: TestClient, cookies: dict[str, str]) -> None:
    client.cookies.clear()
    client.cookies.update(cookies)


def test_json_record_crud_and_user_isolation(client: TestClient):
    alice_cookies = register_and_login(client, "alice")
    alice_headers = {"X-CSRF-Token": alice_cookies["csrf_token"]}

    response = client.put(
        "/data/settings",
        headers=alice_headers,
        json={"theme": "dark", "notifications": True},
    )
    assert response.status_code == 200
    assert response.json() == {
        "key": "settings",
        "value": {"theme": "dark", "notifications": True},
    }

    response = client.get("/data/settings")
    assert response.status_code == 200
    assert response.json()["value"]["theme"] == "dark"

    bob_cookies = register_and_login(client, "bob")
    response = client.get("/data/settings")
    assert response.status_code == 404

    use_session(client, alice_cookies)
    response = client.delete(
        "/data/settings",
        headers=alice_headers,
    )
    assert response.status_code == 204
    assert client.get("/data/settings").status_code == 404


def test_data_requires_authentication(client: TestClient):
    response = client.put("/data/private", json={"value": 1})
    assert response.status_code == 401


def test_login_rejects_cross_origin_requests(client: TestClient):
    client.post(
        "/auth/register",
        json={"username": "alice", "password": "correct-horse-battery"},
    )

    response = client.post(
        "/auth/token",
        data={"username": "alice", "password": "correct-horse-battery"},
        headers={"Origin": "https://attacker.example"},
    )

    assert response.status_code == 403


def test_data_keys_returns_only_current_users_keys(client: TestClient):
    alice_cookies = register_and_login(client, "alice")
    alice_headers = {"X-CSRF-Token": alice_cookies["csrf_token"]}
    bob_cookies = register_and_login(client, "bob")
    bob_headers = {"X-CSRF-Token": bob_cookies["csrf_token"]}

    use_session(client, alice_cookies)
    client.put(
        "/data/zeta",
        headers=alice_headers,
        json={"owner": "alice"},
    )
    client.put(
        "/data/alpha",
        headers=alice_headers,
        json={"owner": "alice"},
    )
    use_session(client, bob_cookies)
    client.put(
        "/data/bob-only",
        headers=bob_headers,
        json={"owner": "bob"},
    )

    use_session(client, alice_cookies)
    response = client.get("/data/keys")

    assert response.status_code == 200
    assert response.json() == {"keys": ["alpha", "zeta"]}


def test_data_mutation_requires_csrf_token(client: TestClient):
    cookies = register_and_login(client, "alice")

    response = client.put(
        "/data/private",
        json={"value": 1},
    )

    assert response.status_code == 403


def test_logout_clears_authentication_cookies(client: TestClient):
    cookies = register_and_login(client, "alice")
    response = client.post(
        "/auth/logout",
        headers={"X-CSRF-Token": cookies["csrf_token"]},
    )

    assert response.status_code == 204
    assert client.get("/data/private").status_code == 401


def test_homepage_and_home_file_serve_login_page(client: TestClient):
    response = client.get("/")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    assert 'fetch("/auth/token"' in response.text

    home_file_response = client.get("/home.html")
    assert home_file_response.status_code == 200
    assert 'fetch("/auth/token"' in home_file_response.text


def test_save_json_request_body_is_documented(client: TestClient):
    operation = client.get("/openapi.json").json()["paths"]["/data/{key}"]["put"]

    assert operation["requestBody"]["required"] is True
    assert "application/json" in operation["requestBody"]["content"]
