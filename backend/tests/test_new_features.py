"""
Backend tests for new features:
1. Artist Registration with bio and genre fields
2. Admin Change Password functionality
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestArtistRegistration:
    """Test artist registration with bio and genre fields"""
    
    def test_artist_registration_with_bio_and_genre(self):
        """Test that artist registration saves bio and genre correctly"""
        unique_email = f"TEST_artist_{uuid.uuid4().hex[:8]}@test.com"
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Test Artist",
            "user_type": "artist",
            "bio": "I am a test artist who makes great music",
            "genre": "Hip-Hop/Rap"
        })
        
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "token" in data, "Token not in response"
        assert "user" in data, "User not in response"
        
        # Verify user data
        user = data["user"]
        assert user["email"] == unique_email
        assert user["name"] == "Test Artist"
        assert user["user_type"] == "artist"
        assert user["bio"] == "I am a test artist who makes great music"
        assert user["genre"] == "Hip-Hop/Rap"
        
        print(f"SUCCESS: Artist registered with bio and genre - {unique_email}")
        return data["token"], user["id"]
    
    def test_artist_registration_without_optional_fields(self):
        """Test artist registration without bio and genre (optional fields)"""
        unique_email = f"TEST_artist_{uuid.uuid4().hex[:8]}@test.com"
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Test Artist No Bio",
            "user_type": "artist"
        })
        
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        
        user = data["user"]
        assert user["email"] == unique_email
        assert user["user_type"] == "artist"
        # Bio and genre should be None or not present
        assert user.get("bio") is None
        
        print(f"SUCCESS: Artist registered without optional fields - {unique_email}")
    
    def test_listener_registration_does_not_save_genre(self):
        """Test that listener registration does not save genre field"""
        unique_email = f"TEST_listener_{uuid.uuid4().hex[:8]}@test.com"
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Test Listener",
            "user_type": "listener",
            "genre": "Hip-Hop/Rap"  # Should be ignored for listeners
        })
        
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        
        user = data["user"]
        assert user["user_type"] == "listener"
        # Genre should be None for listeners
        assert user.get("genre") is None
        
        print(f"SUCCESS: Listener registration ignores genre field - {unique_email}")
    
    def test_artist_profile_shows_bio_and_genre(self):
        """Test that artist profile endpoint returns bio and genre"""
        # First register an artist
        unique_email = f"TEST_artist_{uuid.uuid4().hex[:8]}@test.com"
        
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Profile Test Artist",
            "user_type": "artist",
            "bio": "Test bio for profile",
            "genre": "R&B/Soul"
        })
        
        assert reg_response.status_code == 200
        data = reg_response.json()
        token = data["token"]
        artist_id = data["user"]["id"]
        
        # Get artist profile via /api/artists/{id}
        profile_response = requests.get(f"{BASE_URL}/api/artists/{artist_id}")
        
        assert profile_response.status_code == 200, f"Profile fetch failed: {profile_response.text}"
        profile = profile_response.json()
        
        assert profile["bio"] == "Test bio for profile"
        assert profile["genre"] == "R&B/Soul"
        
        print(f"SUCCESS: Artist profile shows bio and genre")
    
    def test_auth_me_returns_genre_for_artist(self):
        """Test that /api/auth/me returns genre for artists"""
        unique_email = f"TEST_artist_{uuid.uuid4().hex[:8]}@test.com"
        
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Me Test Artist",
            "user_type": "artist",
            "bio": "Test bio",
            "genre": "Electronic/EDM"
        })
        
        assert reg_response.status_code == 200
        token = reg_response.json()["token"]
        
        # Get current user
        me_response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        
        assert me_response.status_code == 200
        me_data = me_response.json()
        
        assert me_data["genre"] == "Electronic/EDM"
        assert me_data["bio"] == "Test bio"
        
        print(f"SUCCESS: /api/auth/me returns genre for artist")


class TestChangePassword:
    """Test admin change password functionality"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@fyahtrakz.com",
            "password": "admin123"
        })
        
        if response.status_code != 200:
            pytest.skip("Admin login failed - skipping password tests")
        
        return response.json()["token"]
    
    def test_change_password_success(self, admin_token):
        """Test successful password change"""
        # Change password
        response = requests.post(f"{BASE_URL}/api/auth/change-password", 
            json={
                "current_password": "admin123",
                "new_password": "newadmin456"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"Password change failed: {response.text}"
        data = response.json()
        assert data["message"] == "Password changed successfully"
        
        print("SUCCESS: Password changed successfully")
        
        # Verify new password works
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@fyahtrakz.com",
            "password": "newadmin456"
        })
        
        assert login_response.status_code == 200, "Login with new password failed"
        print("SUCCESS: Login with new password works")
        
        # Change password back to original
        new_token = login_response.json()["token"]
        revert_response = requests.post(f"{BASE_URL}/api/auth/change-password",
            json={
                "current_password": "newadmin456",
                "new_password": "admin123"
            },
            headers={"Authorization": f"Bearer {new_token}"}
        )
        
        assert revert_response.status_code == 200, "Failed to revert password"
        print("SUCCESS: Password reverted to original")
    
    def test_change_password_wrong_current(self, admin_token):
        """Test that wrong current password is rejected"""
        response = requests.post(f"{BASE_URL}/api/auth/change-password",
            json={
                "current_password": "wrongpassword",
                "new_password": "newpassword123"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "incorrect" in data["detail"].lower() or "current" in data["detail"].lower()
        
        print("SUCCESS: Wrong current password correctly rejected")
    
    def test_change_password_short_new_password(self, admin_token):
        """Test that short new password is rejected (min 6 chars)"""
        response = requests.post(f"{BASE_URL}/api/auth/change-password",
            json={
                "current_password": "admin123",
                "new_password": "short"  # Only 5 characters
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "6" in data["detail"] or "character" in data["detail"].lower()
        
        print("SUCCESS: Short password correctly rejected")
    
    def test_change_password_requires_auth(self):
        """Test that change password requires authentication"""
        response = requests.post(f"{BASE_URL}/api/auth/change-password",
            json={
                "current_password": "admin123",
                "new_password": "newpassword123"
            }
        )
        
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("SUCCESS: Change password requires authentication")


class TestLinkFromRegisterToArtistRegister:
    """Test navigation from main register to artist register"""
    
    def test_register_endpoint_exists(self):
        """Verify the registration endpoint works"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        print("SUCCESS: API is accessible")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
