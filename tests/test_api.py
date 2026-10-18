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
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


def register_and_login(client: TestClient, username: str) -> str:
    response = client.post(
        "/auth/register",
        json={"username": username, "password": "correct-horse-battery"},
    )
    assert response.status_code == 201

    response = client.post(
        "/auth/token",
        data={"username": username, "password": "correct-horse-battery"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def test_json_record_crud_and_user_isolation(client: TestClient):
    token = register_and_login(client, "alice")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.put(
        "/data/settings",
        headers=headers,
        json={"theme": "dark", "notifications": True},
    )
    assert response.status_code == 200
    assert response.json() == {
        "key": "settings",
        "value": {"theme": "dark", "notifications": True},
    }

    response = client.get("/data/settings", headers=headers)
    assert response.status_code == 200
    assert response.json()["value"]["theme"] == "dark"

    another_token = register_and_login(client, "bob")
    another_headers = {"Authorization": f"Bearer {another_token}"}
    response = client.get("/data/settings", headers=another_headers)
    assert response.status_code == 404

    response = client.delete("/data/settings", headers=headers)
    assert response.status_code == 204
    assert client.get("/data/settings", headers=headers).status_code == 404


def test_data_requires_authentication(client: TestClient):
    response = client.put("/data/private", json={"value": 1})
    assert response.status_code == 401


def test_data_keys_returns_only_current_users_keys(client: TestClient):
    alice_token = register_and_login(client, "alice")
    alice_headers = {"Authorization": f"Bearer {alice_token}"}
    bob_token = register_and_login(client, "bob")
    bob_headers = {"Authorization": f"Bearer {bob_token}"}

    client.put("/data/zeta", headers=alice_headers, json={"owner": "alice"})
    client.put("/data/alpha", headers=alice_headers, json={"owner": "alice"})
    client.put("/data/bob-only", headers=bob_headers, json={"owner": "bob"})

    response = client.get("/data/keys", headers=alice_headers)

    assert response.status_code == 200
    assert response.json() == {"keys": ["alpha", "zeta"]}


def test_homepage_serves_login_page_for_data_record(client: TestClient):
    response = client.get("/")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    assert 'fetch("/auth/token"' in response.text


def test_save_json_request_body_is_documented(client: TestClient):
    operation = client.get("/openapi.json").json()["paths"]["/data/{key}"]["put"]

    assert operation["requestBody"]["required"] is True
    assert "application/json" in operation["requestBody"]["content"]


def test_invalid_json_is_rejected(client: TestClient):
    token = register_and_login(client, "alice")
    response = client.put(
        "/data/settings",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        content='{"value": NaN}',
    )
    assert response.status_code == 400
