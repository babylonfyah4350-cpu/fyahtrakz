import requests
import sys
import json
import base64
from datetime import datetime

class TunePulseAPITester:
    def __init__(self, base_url="https://tunepulse-22.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.listener_token = None
        self.artist_token = None
        self.listener_user = None
        self.artist_user = None
        self.tests_run = 0
        self.tests_passed = 0
        self.song_id = None
        self.playlist_id = None
        self.album_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, token=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {}
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        if files is None and data is not None:
            headers['Content-Type'] = 'application/json'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=data)
            elif method == 'POST':
                if files:
                    response = requests.post(url, headers={k: v for k, v in headers.items() if k != 'Content-Type'}, data=data, files=files)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"Response: {response.json()}")
                except:
                    print(f"Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_register_listener(self):
        """Test listener registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        user_data = {
            "email": f"listener_{timestamp}@test.com",
            "password": "TestPass123!",
            "name": f"Test Listener {timestamp}",
            "user_type": "listener"
        }
        success, response = self.run_test("Register Listener", "POST", "auth/register", 200, user_data)
        if success and 'token' in response:
            self.listener_token = response['token']
            self.listener_user = response['user']
            return True
        return False

    def test_register_artist(self):
        """Test artist registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        user_data = {
            "email": f"artist_{timestamp}@test.com",
            "password": "TestPass123!",
            "name": f"Test Artist {timestamp}",
            "user_type": "artist"
        }
        success, response = self.run_test("Register Artist", "POST", "auth/register", 200, user_data)
        if success and 'token' in response:
            self.artist_token = response['token']
            self.artist_user = response['user']
            return True
        return False

    def test_login(self):
        """Test login functionality"""
        if not self.listener_user:
            return False
        
        login_data = {
            "email": self.listener_user['email'],
            "password": "TestPass123!"
        }
        success, response = self.run_test("Login", "POST", "auth/login", 200, login_data)
        return success and 'token' in response

    def test_get_me(self):
        """Test get current user"""
        return self.run_test("Get Current User", "GET", "auth/me", 200, token=self.listener_token)[0]

    def test_create_album(self):
        """Test album creation by artist"""
        if not self.artist_token:
            return False
        
        # Create form data for album
        album_data = {
            'title': 'Test Album',
            'genre': 'Pop',
            'description': 'A test album'
        }
        
        # Albums endpoint expects form data, not JSON
        files = {}  # No files, just form data
        success, response = self.run_test("Create Album", "POST", "albums", 200, album_data, files, self.artist_token)
        if success and 'id' in response:
            self.album_id = response['id']
            return True
        return False

    def test_upload_song(self):
        """Test song upload by artist"""
        if not self.artist_token:
            return False
        
        # Create a simple audio file content (base64 encoded)
        audio_content = b"fake audio content for testing"
        
        # Prepare form data
        form_data = {
            'title': 'Test Song',
            'genre': 'Pop',
            'duration': '180'
        }
        
        if self.album_id:
            form_data['album_id'] = self.album_id
        
        # Create fake audio file
        files = {
            'audio_file': ('test_song.mp3', audio_content, 'audio/mpeg')
        }
        
        success, response = self.run_test("Upload Song", "POST", "songs", 200, form_data, files, self.artist_token)
        if success and 'id' in response:
            self.song_id = response['id']
            return True
        return False

    def test_get_songs(self):
        """Test getting songs list"""
        return self.run_test("Get Songs", "GET", "songs", 200)[0]

    def test_get_song_by_id(self):
        """Test getting specific song"""
        if not self.song_id:
            return False
        return self.run_test("Get Song by ID", "GET", f"songs/{self.song_id}", 200)[0]

    def test_record_play(self):
        """Test recording song play"""
        if not self.song_id or not self.listener_token:
            return False
        return self.run_test("Record Play", "POST", f"songs/{self.song_id}/play", 200, token=self.listener_token)[0]

    def test_create_playlist(self):
        """Test playlist creation"""
        if not self.listener_token:
            return False
        
        playlist_data = {
            "name": "Test Playlist",
            "description": "A test playlist",
            "is_public": True
        }
        success, response = self.run_test("Create Playlist", "POST", "playlists", 200, playlist_data, token=self.listener_token)
        if success and 'id' in response:
            self.playlist_id = response['id']
            return True
        return False

    def test_get_playlists(self):
        """Test getting playlists"""
        return self.run_test("Get Playlists", "GET", "playlists", 200, token=self.listener_token)[0]

    def test_add_song_to_playlist(self):
        """Test adding song to playlist"""
        if not self.playlist_id or not self.song_id or not self.listener_token:
            return False
        return self.run_test("Add Song to Playlist", "POST", f"playlists/{self.playlist_id}/songs/{self.song_id}", 200, token=self.listener_token)[0]

    def test_get_playlist_details(self):
        """Test getting playlist with songs"""
        if not self.playlist_id or not self.listener_token:
            return False
        return self.run_test("Get Playlist Details", "GET", f"playlists/{self.playlist_id}", 200, token=self.listener_token)[0]

    def test_search(self):
        """Test search functionality"""
        search_params = {"q": "Test"}
        return self.run_test("Search", "GET", "search", 200, search_params)[0]

    def test_get_artists(self):
        """Test getting artists list"""
        return self.run_test("Get Artists", "GET", "artists", 200)[0]

    def test_get_artist_by_id(self):
        """Test getting specific artist"""
        if not self.artist_user:
            return False
        return self.run_test("Get Artist by ID", "GET", f"artists/{self.artist_user['id']}", 200)[0]

    def test_get_recommendations(self):
        """Test recommendations"""
        if not self.listener_token:
            return False
        return self.run_test("Get Recommendations", "GET", "recommendations", 200, token=self.listener_token)[0]

    def test_get_artist_stats(self):
        """Test artist dashboard stats"""
        if not self.artist_token:
            return False
        return self.run_test("Get Artist Stats", "GET", "stats/artist", 200, token=self.artist_token)[0]

    def test_browse_genres(self):
        """Test browse genres"""
        return self.run_test("Browse Genres", "GET", "browse/genres", 200)[0]

    def test_browse_featured(self):
        """Test browse featured content"""
        return self.run_test("Browse Featured", "GET", "browse/featured", 200)[0]

    def test_subscription_status(self):
        """Test subscription status for listener"""
        if not self.listener_token:
            return False
        return self.run_test("Get Subscription Status", "GET", "payments/subscription/status", 200, token=self.listener_token)[0]

    def test_upload_credits(self):
        """Test upload credits for artist"""
        if not self.artist_token:
            return False
        return self.run_test("Get Upload Credits", "GET", "payments/upload-credits", 200, token=self.artist_token)[0]

    def test_subscription_checkout(self):
        """Test subscription checkout creation"""
        if not self.listener_token:
            return False
        
        checkout_data = {
            "origin_url": "https://tunepulse-22.preview.emergentagent.com",
            "payment_type": "subscription"
        }
        success, response = self.run_test("Create Subscription Checkout", "POST", "payments/subscription/checkout", 200, checkout_data, token=self.listener_token)
        return success and 'checkout_url' in response and 'session_id' in response

    def test_upload_checkout(self):
        """Test upload credit checkout creation"""
        if not self.artist_token:
            return False
        
        checkout_data = {
            "origin_url": "https://tunepulse-22.preview.emergentagent.com"
        }
        success, response = self.run_test("Create Upload Checkout", "POST", "payments/upload/checkout", 200, checkout_data, token=self.artist_token)
        return success and 'checkout_url' in response and 'session_id' in response

    def test_stripe_webhook_endpoint(self):
        """Test that Stripe webhook endpoint exists"""
        # We can't test the actual webhook functionality without Stripe events,
        # but we can test that the endpoint exists and returns proper error for invalid requests
        success, response = self.run_test("Stripe Webhook Endpoint", "POST", "webhook/stripe", 400, {})
        return success  # 400 is expected for invalid webhook data

    def test_recommendations_without_subscription(self):
        """Test recommendations endpoint requires subscription for listeners"""
        if not self.listener_token:
            return False
        # This should return 402 (Payment Required) for listeners without subscription
        success, response = self.run_test("Recommendations Without Subscription", "GET", "recommendations", 402, token=self.listener_token)
        return success

    def test_song_upload_without_credits(self):
        """Test song upload without credits should fail"""
        if not self.artist_token:
            return False
        
        # First, let's check current credits
        success, credits_response = self.run_test("Check Credits Before Upload", "GET", "payments/upload-credits", 200, token=self.artist_token)
        if not success:
            return False
        
        current_credits = credits_response.get('credits', 0)
        
        # If artist has credits, this test isn't applicable
        if current_credits > 0:
            print(f"Artist has {current_credits} credits, skipping no-credits test")
            return True
        
        # Try to upload without credits - should fail with 402
        audio_content = b"fake audio content for testing"
        form_data = {
            'title': 'Test Song No Credits',
            'genre': 'Pop',
            'duration': '180'
        }
        files = {
            'audio_file': ('test_song.mp3', audio_content, 'audio/mpeg')
        }
        
        success, response = self.run_test("Upload Song Without Credits", "POST", "songs", 402, form_data, files, self.artist_token)
        return success

def main():
    print("🎵 Starting TunePulse API Tests...")
    tester = TunePulseAPITester()
    
    # Test sequence
    tests = [
        ("Root Endpoint", tester.test_root_endpoint),
        ("Register Listener", tester.test_register_listener),
        ("Register Artist", tester.test_register_artist),
        ("Login", tester.test_login),
        ("Get Current User", tester.test_get_me),
        ("Subscription Status", tester.test_subscription_status),
        ("Upload Credits", tester.test_upload_credits),
        ("Subscription Checkout", tester.test_subscription_checkout),
        ("Upload Checkout", tester.test_upload_checkout),
        ("Stripe Webhook Endpoint", tester.test_stripe_webhook_endpoint),
        ("Recommendations Without Subscription", tester.test_recommendations_without_subscription),
        ("Song Upload Without Credits", tester.test_song_upload_without_credits),
        ("Create Album", tester.test_create_album),
        ("Upload Song", tester.test_upload_song),
        ("Get Songs", tester.test_get_songs),
        ("Get Song by ID", tester.test_get_song_by_id),
        ("Record Play", tester.test_record_play),
        ("Create Playlist", tester.test_create_playlist),
        ("Get Playlists", tester.test_get_playlists),
        ("Add Song to Playlist", tester.test_add_song_to_playlist),
        ("Get Playlist Details", tester.test_get_playlist_details),
        ("Search", tester.test_search),
        ("Get Artists", tester.test_get_artists),
        ("Get Artist by ID", tester.test_get_artist_by_id),
        ("Get Artist Stats", tester.test_get_artist_stats),
        ("Browse Genres", tester.test_browse_genres),
        ("Browse Featured", tester.test_browse_featured)
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        try:
            if not test_func():
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Print results
    print(f"\n📊 Test Results:")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if failed_tests:
        print(f"\n❌ Failed tests: {', '.join(failed_tests)}")
        return 1
    else:
        print(f"\n✅ All tests passed!")
        return 0

if __name__ == "__main__":
    sys.exit(main())