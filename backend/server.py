from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form, Query, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import base64
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'fyahtrakz-secure-jwt-secret-key-2024-prod')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Stripe Configuration
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')

# Payment Pricing (in AUD)
ARTIST_UPLOAD_PRICE = 2.99  # AUD per song
LISTENER_SUBSCRIPTION_PRICE = 14.99  # AUD per month

security = HTTPBearer()
security_optional = HTTPBearer(auto_error=False)

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== MODELS ==============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    user_type: str = "listener"  # "listener" or "artist"
    bio: Optional[str] = None
    genre: Optional[str] = None  # Primary genre for artists

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    user_type: str
    avatar: Optional[str] = None
    bio: Optional[str] = None
    created_at: str

class SongCreate(BaseModel):
    title: str
    genre: str
    duration: int  # in seconds
    album_id: Optional[str] = None

class SongResponse(BaseModel):
    id: str
    title: str
    artist_id: str
    artist_name: str
    genre: str
    duration: int
    cover_url: Optional[str] = None
    audio_url: str
    album_id: Optional[str] = None
    album_name: Optional[str] = None
    play_count: int = 0
    created_at: str

class AlbumCreate(BaseModel):
    title: str
    genre: str
    description: Optional[str] = None

class AlbumResponse(BaseModel):
    id: str
    title: str
    artist_id: str
    artist_name: str
    genre: str
    description: Optional[str] = None
    cover_url: Optional[str] = None
    song_count: int = 0
    created_at: str

class PlaylistCreate(BaseModel):
    name: str
    description: Optional[str] = None
    is_public: bool = True

class PlaylistUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None

class PlaylistResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    user_id: str
    user_name: str
    cover_url: Optional[str] = None
    song_count: int = 0
    is_public: bool = True
    created_at: str

class ListeningHistoryCreate(BaseModel):
    song_id: str

class PaymentRequest(BaseModel):
    origin_url: str
    payment_type: str  # "upload" or "subscription"

class UploadCreditRequest(BaseModel):
    origin_url: str

# ============== AUTH HELPERS ==============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str, user_type: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "user_type": user_type,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# ============== AUTH ROUTES ==============

@api_router.post("/auth/register")
async def register(user: UserCreate):
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_doc = {
        "id": str(uuid.uuid4()),
        "email": user.email,
        "password": hash_password(user.password),
        "name": user.name,
        "user_type": user.user_type,
        "avatar": None,
        "bio": user.bio,
        "genre": user.genre if user.user_type == "artist" else None,
        "followers": [],
        "following": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    token = create_token(user_doc["id"], user_doc["email"], user_doc["user_type"])
    return {
        "token": token,
        "user": {
            "id": user_doc["id"],
            "email": user_doc["email"],
            "name": user_doc["name"],
            "user_type": user_doc["user_type"],
            "avatar": user_doc["avatar"],
            "bio": user_doc["bio"],
            "genre": user_doc.get("genre"),
            "created_at": user_doc["created_at"]
        }
    }

@api_router.post("/auth/login")
async def login(user: UserLogin):
    db_user = await db.users.find_one({"email": user.email}, {"_id": 0})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(db_user["id"], db_user["email"], db_user["user_type"])
    return {
        "token": token,
        "user": {
            "id": db_user["id"],
            "email": db_user["email"],
            "name": db_user["name"],
            "user_type": db_user["user_type"],
            "avatar": db_user.get("avatar"),
            "bio": db_user.get("bio"),
            "created_at": db_user["created_at"]
        }
    }

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    user_data = {
        "id": current_user["id"],
        "email": current_user["email"],
        "name": current_user["name"],
        "user_type": current_user["user_type"],
        "avatar": current_user.get("avatar"),
        "bio": current_user.get("bio"),
        "genre": current_user.get("genre"),
        "created_at": current_user["created_at"]
    }
    
    # Add subscription info for listeners
    if current_user["user_type"] == "listener":
        user_data["has_subscription"] = current_user.get("has_subscription", False)
        user_data["subscription_expires"] = current_user.get("subscription_expires")
    
    # Add upload credits for artists
    if current_user["user_type"] == "artist":
        user_data["upload_credits"] = current_user.get("upload_credits", 0)
    
    return user_data

@api_router.post("/auth/change-password")
async def change_password(data: PasswordChange, current_user: dict = Depends(get_current_user)):
    """Change user password"""
    # Verify current password
    if not verify_password(data.current_password, current_user["password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    
    # Update password
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"password": hash_password(data.new_password), "password_changed_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Password changed successfully"}

# ============== SONG ROUTES ==============

@api_router.post("/songs")
async def upload_song(
    title: str = Form(...),
    genre: str = Form(...),
    duration: int = Form(...),
    album_id: Optional[str] = Form(None),
    audio_file: UploadFile = File(...),
    cover_file: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    if current_user["user_type"] != "artist":
        raise HTTPException(status_code=403, detail="Only artists can upload songs")
    
    # Check for upload credits
    upload_credits = current_user.get("upload_credits", 0)
    if upload_credits <= 0:
        raise HTTPException(
            status_code=402, 
            detail="No upload credits. Please purchase upload credits to upload songs."
        )
    
    # Deduct one credit
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$inc": {"upload_credits": -1}}
    )
    
    # Read and encode audio file as base64
    audio_content = await audio_file.read()
    audio_base64 = base64.b64encode(audio_content).decode('utf-8')
    audio_url = f"data:audio/mpeg;base64,{audio_base64}"
    
    # Read and encode cover if provided
    cover_url = None
    if cover_file:
        cover_content = await cover_file.read()
        cover_base64 = base64.b64encode(cover_content).decode('utf-8')
        cover_url = f"data:image/jpeg;base64,{cover_base64}"
    
    album_name = None
    if album_id:
        album = await db.albums.find_one({"id": album_id}, {"_id": 0})
        if album:
            album_name = album["title"]
            await db.albums.update_one({"id": album_id}, {"$inc": {"song_count": 1}})
    
    song_doc = {
        "id": str(uuid.uuid4()),
        "title": title,
        "artist_id": current_user["id"],
        "artist_name": current_user["name"],
        "genre": genre,
        "duration": duration,
        "cover_url": cover_url,
        "audio_url": audio_url,
        "album_id": album_id,
        "album_name": album_name,
        "play_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.songs.insert_one(song_doc)
    
    return {k: v for k, v in song_doc.items() if k != "_id"}

@api_router.get("/songs", response_model=List[SongResponse])
async def get_songs(
    genre: Optional[str] = None,
    artist_id: Optional[str] = None,
    album_id: Optional[str] = None,
    limit: int = Query(20, le=100),
    skip: int = 0
):
    query = {}
    if genre:
        query["genre"] = genre
    if artist_id:
        query["artist_id"] = artist_id
    if album_id:
        query["album_id"] = album_id
    
    songs = await db.songs.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return songs

@api_router.get("/songs/{song_id}")
async def get_song(song_id: str):
    song = await db.songs.find_one({"id": song_id}, {"_id": 0})
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    return song

@api_router.post("/songs/{song_id}/play")
async def record_play(song_id: str, current_user: dict = Depends(get_current_user)):
    song = await db.songs.find_one({"id": song_id})
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    
    await db.songs.update_one({"id": song_id}, {"$inc": {"play_count": 1}})
    
    # Record listening history
    history_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "song_id": song_id,
        "played_at": datetime.now(timezone.utc).isoformat()
    }
    await db.listening_history.insert_one(history_doc)
    
    return {"message": "Play recorded"}

# ============== ALBUM ROUTES ==============

@api_router.post("/albums")
async def create_album(
    title: str = Form(...),
    genre: str = Form(...),
    description: Optional[str] = Form(None),
    cover_file: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    if current_user["user_type"] != "artist":
        raise HTTPException(status_code=403, detail="Only artists can create albums")
    
    cover_url = None
    if cover_file:
        cover_content = await cover_file.read()
        cover_base64 = base64.b64encode(cover_content).decode('utf-8')
        cover_url = f"data:image/jpeg;base64,{cover_base64}"
    
    album_doc = {
        "id": str(uuid.uuid4()),
        "title": title,
        "artist_id": current_user["id"],
        "artist_name": current_user["name"],
        "genre": genre,
        "description": description,
        "cover_url": cover_url,
        "song_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.albums.insert_one(album_doc)
    
    return {k: v for k, v in album_doc.items() if k != "_id"}

@api_router.get("/albums", response_model=List[AlbumResponse])
async def get_albums(
    artist_id: Optional[str] = None,
    genre: Optional[str] = None,
    limit: int = Query(20, le=100),
    skip: int = 0
):
    query = {}
    if artist_id:
        query["artist_id"] = artist_id
    if genre:
        query["genre"] = genre
    
    albums = await db.albums.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return albums

@api_router.get("/albums/{album_id}")
async def get_album(album_id: str):
    album = await db.albums.find_one({"id": album_id}, {"_id": 0})
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
    
    songs = await db.songs.find({"album_id": album_id}, {"_id": 0}).to_list(100)
    return {**album, "songs": songs}

# ============== PLAYLIST ROUTES ==============

@api_router.post("/playlists")
async def create_playlist(playlist: PlaylistCreate, current_user: dict = Depends(get_current_user)):
    playlist_doc = {
        "id": str(uuid.uuid4()),
        "name": playlist.name,
        "description": playlist.description,
        "user_id": current_user["id"],
        "user_name": current_user["name"],
        "cover_url": None,
        "songs": [],
        "song_count": 0,
        "is_public": playlist.is_public,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.playlists.insert_one(playlist_doc)
    
    return {k: v for k, v in playlist_doc.items() if k != "_id"}

@api_router.get("/playlists")
async def get_playlists(
    user_id: Optional[str] = None,
    is_public: Optional[bool] = None,
    limit: int = Query(20, le=100),
    skip: int = 0,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if user_id:
        query["user_id"] = user_id
    else:
        # Show public playlists or user's own playlists
        query["$or"] = [{"is_public": True}, {"user_id": current_user["id"]}]
    
    if is_public is not None:
        query["is_public"] = is_public
    
    playlists = await db.playlists.find(query, {"_id": 0, "songs": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return playlists

@api_router.get("/playlists/my")
async def get_my_playlists(current_user: dict = Depends(get_current_user)):
    playlists = await db.playlists.find({"user_id": current_user["id"]}, {"_id": 0, "songs": 0}).sort("created_at", -1).to_list(100)
    return playlists

@api_router.get("/playlists/{playlist_id}")
async def get_playlist(playlist_id: str, current_user: dict = Depends(get_current_user)):
    playlist = await db.playlists.find_one({"id": playlist_id}, {"_id": 0})
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    
    if not playlist["is_public"] and playlist["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get full song details - batch fetch to avoid N+1
    song_ids = playlist.get("songs", [])
    if song_ids:
        songs_cursor = db.songs.find({"id": {"$in": song_ids}}, {"_id": 0})
        songs_dict = {s["id"]: s for s in await songs_cursor.to_list(len(song_ids))}
        songs = [songs_dict[sid] for sid in song_ids if sid in songs_dict]
    else:
        songs = []
    
    playlist["songs"] = songs
    return playlist

@api_router.put("/playlists/{playlist_id}")
async def update_playlist(
    playlist_id: str,
    update: PlaylistUpdate,
    current_user: dict = Depends(get_current_user)
):
    playlist = await db.playlists.find_one({"id": playlist_id})
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    
    if playlist["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not your playlist")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if update_data:
        await db.playlists.update_one({"id": playlist_id}, {"$set": update_data})
    
    updated = await db.playlists.find_one({"id": playlist_id}, {"_id": 0, "songs": 0})
    return updated

@api_router.delete("/playlists/{playlist_id}")
async def delete_playlist(playlist_id: str, current_user: dict = Depends(get_current_user)):
    playlist = await db.playlists.find_one({"id": playlist_id})
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    
    if playlist["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not your playlist")
    
    await db.playlists.delete_one({"id": playlist_id})
    return {"message": "Playlist deleted"}

@api_router.post("/playlists/{playlist_id}/songs/{song_id}")
async def add_song_to_playlist(
    playlist_id: str,
    song_id: str,
    current_user: dict = Depends(get_current_user)
):
    playlist = await db.playlists.find_one({"id": playlist_id})
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    
    if playlist["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not your playlist")
    
    song = await db.songs.find_one({"id": song_id})
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    
    if song_id in playlist.get("songs", []):
        raise HTTPException(status_code=400, detail="Song already in playlist")
    
    # Update cover if first song
    update_data = {"$push": {"songs": song_id}, "$inc": {"song_count": 1}}
    if not playlist.get("cover_url") and song.get("cover_url"):
        update_data["$set"] = {"cover_url": song["cover_url"]}
    
    await db.playlists.update_one({"id": playlist_id}, update_data)
    return {"message": "Song added to playlist"}

@api_router.delete("/playlists/{playlist_id}/songs/{song_id}")
async def remove_song_from_playlist(
    playlist_id: str,
    song_id: str,
    current_user: dict = Depends(get_current_user)
):
    playlist = await db.playlists.find_one({"id": playlist_id})
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    
    if playlist["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not your playlist")
    
    await db.playlists.update_one(
        {"id": playlist_id},
        {"$pull": {"songs": song_id}, "$inc": {"song_count": -1}}
    )
    return {"message": "Song removed from playlist"}

# ============== ARTIST ROUTES ==============

@api_router.get("/artists")
async def get_artists(limit: int = Query(20, le=100), skip: int = 0):
    artists = await db.users.find(
        {"user_type": "artist"},
        {"_id": 0, "password": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Add song count for each artist - batch using aggregation
    if artists:
        artist_ids = [a["id"] for a in artists]
        counts_cursor = db.songs.aggregate([
            {"$match": {"artist_id": {"$in": artist_ids}}},
            {"$group": {"_id": "$artist_id", "count": {"$sum": 1}}}
        ])
        counts_dict = {c["_id"]: c["count"] for c in await counts_cursor.to_list(len(artist_ids))}
        for artist in artists:
            artist["song_count"] = counts_dict.get(artist["id"], 0)
    
    return artists

@api_router.get("/artists/{artist_id}")
async def get_artist(artist_id: str):
    artist = await db.users.find_one(
        {"id": artist_id, "user_type": "artist"},
        {"_id": 0, "password": 0}
    )
    if not artist:
        raise HTTPException(status_code=404, detail="Artist not found")
    
    songs = await db.songs.find({"artist_id": artist_id}, {"_id": 0}).sort("play_count", -1).to_list(50)
    albums = await db.albums.find({"artist_id": artist_id}, {"_id": 0}).to_list(50)
    
    artist["songs"] = songs
    artist["albums"] = albums
    artist["song_count"] = len(songs)
    artist["album_count"] = len(albums)
    
    return artist

@api_router.put("/artists/profile")
async def update_artist_profile(
    name: Optional[str] = Form(None),
    bio: Optional[str] = Form(None),
    avatar_file: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    if current_user["user_type"] != "artist":
        raise HTTPException(status_code=403, detail="Only artists can update profile")
    
    update_data = {}
    if name:
        update_data["name"] = name
    if bio:
        update_data["bio"] = bio
    if avatar_file:
        avatar_content = await avatar_file.read()
        avatar_base64 = base64.b64encode(avatar_content).decode('utf-8')
        update_data["avatar"] = f"data:image/jpeg;base64,{avatar_base64}"
    
    if update_data:
        await db.users.update_one({"id": current_user["id"]}, {"$set": update_data})
        # Update artist name in songs
        if name:
            await db.songs.update_many({"artist_id": current_user["id"]}, {"$set": {"artist_name": name}})
            await db.albums.update_many({"artist_id": current_user["id"]}, {"$set": {"artist_name": name}})
    
    updated = await db.users.find_one({"id": current_user["id"]}, {"_id": 0, "password": 0})
    return updated

# ============== SEARCH ROUTES ==============

@api_router.get("/search")
async def search(q: str = Query(..., min_length=1), limit: int = Query(10, le=50)):
    # Search songs
    songs = await db.songs.find(
        {"$or": [
            {"title": {"$regex": q, "$options": "i"}},
            {"artist_name": {"$regex": q, "$options": "i"}},
            {"genre": {"$regex": q, "$options": "i"}}
        ]},
        {"_id": 0}
    ).limit(limit).to_list(limit)
    
    # Search albums
    albums = await db.albums.find(
        {"$or": [
            {"title": {"$regex": q, "$options": "i"}},
            {"artist_name": {"$regex": q, "$options": "i"}}
        ]},
        {"_id": 0}
    ).limit(limit).to_list(limit)
    
    # Search artists
    artists = await db.users.find(
        {"user_type": "artist", "name": {"$regex": q, "$options": "i"}},
        {"_id": 0, "password": 0}
    ).limit(limit).to_list(limit)
    
    # Search playlists
    playlists = await db.playlists.find(
        {"is_public": True, "name": {"$regex": q, "$options": "i"}},
        {"_id": 0, "songs": 0}
    ).limit(limit).to_list(limit)
    
    return {
        "songs": songs,
        "albums": albums,
        "artists": artists,
        "playlists": playlists
    }

# ============== RECOMMENDATIONS ==============

@api_router.get("/recommendations")
async def get_recommendations(current_user: dict = Depends(get_current_user)):
    # Check subscription for listeners
    if current_user["user_type"] == "listener":
        active_sub = await db.subscriptions.find_one({
            "user_id": current_user["id"],
            "status": "active",
            "expires_at": {"$gt": datetime.now(timezone.utc).isoformat()}
        })
        if not active_sub:
            raise HTTPException(
                status_code=402,
                detail="Subscription required. Please subscribe to access music streaming."
            )
    
    # Get user's listening history
    history = await db.listening_history.find(
        {"user_id": current_user["id"]}
    ).sort("played_at", -1).limit(50).to_list(50)
    
    listened_song_ids = [h["song_id"] for h in history]
    
    # Get genres from listened songs - batch fetch
    listened_genres = []
    if listened_song_ids:
        songs_with_genres = await db.songs.find(
            {"id": {"$in": listened_song_ids[:20]}},
            {"_id": 0, "genre": 1}
        ).to_list(20)
        listened_genres = [s["genre"] for s in songs_with_genres if s.get("genre")]
    
    # Get most common genres
    genre_counts = {}
    for genre in listened_genres:
        genre_counts[genre] = genre_counts.get(genre, 0) + 1
    
    top_genres = sorted(genre_counts.keys(), key=lambda x: genre_counts[x], reverse=True)[:3]
    
    # Get recommendations based on genres
    recommended_songs = []
    if top_genres:
        recommended_songs = await db.songs.find(
            {"genre": {"$in": top_genres}, "id": {"$nin": listened_song_ids}},
            {"_id": 0}
        ).sort("play_count", -1).limit(20).to_list(20)
    
    # If not enough recommendations, get popular songs
    if len(recommended_songs) < 10:
        popular = await db.songs.find(
            {"id": {"$nin": listened_song_ids + [s["id"] for s in recommended_songs]}},
            {"_id": 0}
        ).sort("play_count", -1).limit(20 - len(recommended_songs)).to_list(20 - len(recommended_songs))
        recommended_songs.extend(popular)
    
    # Get new releases
    new_releases = await db.songs.find({}, {"_id": 0}).sort("created_at", -1).limit(10).to_list(10)
    
    # Get trending (most played recently)
    trending = await db.songs.find({}, {"_id": 0}).sort("play_count", -1).limit(10).to_list(10)
    
    return {
        "for_you": recommended_songs,
        "new_releases": new_releases,
        "trending": trending,
        "top_genres": top_genres
    }

# ============== BROWSE ==============

@api_router.get("/browse/genres")
async def get_genres():
    genres = await db.songs.distinct("genre")
    return genres

@api_router.get("/browse/featured")
async def get_featured():
    # Get featured playlists (public playlists with most songs)
    featured_playlists = await db.playlists.find(
        {"is_public": True},
        {"_id": 0, "songs": 0}
    ).sort("song_count", -1).limit(6).to_list(6)
    
    # Get top artists
    top_artists = await db.users.find(
        {"user_type": "artist"},
        {"_id": 0, "password": 0}
    ).limit(6).to_list(6)
    
    # Batch get song counts for artists
    if top_artists:
        artist_ids = [a["id"] for a in top_artists]
        counts_cursor = db.songs.aggregate([
            {"$match": {"artist_id": {"$in": artist_ids}}},
            {"$group": {"_id": "$artist_id", "count": {"$sum": 1}}}
        ])
        counts_dict = {c["_id"]: c["count"] for c in await counts_cursor.to_list(len(artist_ids))}
        for artist in top_artists:
            artist["song_count"] = counts_dict.get(artist["id"], 0)
    
    # Get popular albums
    popular_albums = await db.albums.find({}, {"_id": 0}).sort("song_count", -1).limit(6).to_list(6)
    
    return {
        "featured_playlists": featured_playlists,
        "top_artists": top_artists,
        "popular_albums": popular_albums
    }

# ============== LIBRARY ==============

@api_router.get("/library/history")
async def get_listening_history(
    limit: int = Query(50, le=100),
    current_user: dict = Depends(get_current_user)
):
    history = await db.listening_history.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("played_at", -1).limit(limit).to_list(limit)
    
    # Get unique song ids preserving order
    seen_ids = set()
    unique_history = []
    for h in history:
        if h["song_id"] not in seen_ids:
            seen_ids.add(h["song_id"])
            unique_history.append(h)
    
    # Batch fetch all songs
    song_ids = [h["song_id"] for h in unique_history]
    if song_ids:
        songs_cursor = db.songs.find({"id": {"$in": song_ids}}, {"_id": 0})
        songs_dict = {s["id"]: s for s in await songs_cursor.to_list(len(song_ids))}
        
        # Build result preserving order and adding played_at
        songs = []
        for h in unique_history:
            if h["song_id"] in songs_dict:
                song = songs_dict[h["song_id"]].copy()
                song["played_at"] = h["played_at"]
                songs.append(song)
    else:
        songs = []
    
    return songs

# ============== STATS (Artist Dashboard) ==============

@api_router.get("/stats/artist")
async def get_artist_stats(current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "artist":
        raise HTTPException(status_code=403, detail="Only artists can view stats")
    
    # Get total plays using aggregation for efficiency
    pipeline = [
        {"$match": {"artist_id": current_user["id"]}},
        {"$group": {"_id": None, "total_plays": {"$sum": "$play_count"}, "count": {"$sum": 1}}}
    ]
    result = await db.songs.aggregate(pipeline).to_list(1)
    total_plays = result[0]["total_plays"] if result else 0
    song_count = result[0]["count"] if result else 0
    
    # Get album count
    album_count = await db.albums.count_documents({"artist_id": current_user["id"]})
    
    # Top songs (only fetch needed fields, exclude large audio_url)
    top_songs = sorted(songs, key=lambda x: x.get("play_count", 0), reverse=True)[:5]
    
    return {
        "total_plays": total_plays,
        "song_count": song_count,
        "album_count": album_count,
        "top_songs": top_songs
    }

# ============== ROOT ==============

@api_router.get("/")
async def root():
    return {"message": "FyahTrakz API v1.0"}

# ============== PAYMENT ROUTES ==============

@api_router.post("/payments/subscription/checkout")
async def create_subscription_checkout(
    request: Request,
    payment_req: PaymentRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a Stripe checkout session for listener subscription"""
    if current_user["user_type"] != "listener":
        raise HTTPException(status_code=400, detail="Only listeners can subscribe")
    
    # Check if user already has active subscription
    active_sub = await db.subscriptions.find_one({
        "user_id": current_user["id"],
        "status": "active",
        "expires_at": {"$gt": datetime.now(timezone.utc).isoformat()}
    })
    if active_sub:
        raise HTTPException(status_code=400, detail="You already have an active subscription")
    
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    success_url = f"{payment_req.origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{payment_req.origin_url}/payment/cancel"
    
    checkout_request = CheckoutSessionRequest(
        amount=LISTENER_SUBSCRIPTION_PRICE,
        currency="aud",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": current_user["id"],
            "user_email": current_user["email"],
            "payment_type": "subscription"
        }
    )
    
    session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    transaction_doc = {
        "id": str(uuid.uuid4()),
        "session_id": session.session_id,
        "user_id": current_user["id"],
        "user_email": current_user["email"],
        "amount": LISTENER_SUBSCRIPTION_PRICE,
        "currency": "aud",
        "payment_type": "subscription",
        "status": "pending",
        "payment_status": "initiated",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payment_transactions.insert_one(transaction_doc)
    
    return {"checkout_url": session.url, "session_id": session.session_id}

@api_router.post("/payments/upload/checkout")
async def create_upload_checkout(
    request: Request,
    payment_req: UploadCreditRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a Stripe checkout session for artist song upload credit"""
    if current_user["user_type"] != "artist":
        raise HTTPException(status_code=400, detail="Only artists can purchase upload credits")
    
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    success_url = f"{payment_req.origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{payment_req.origin_url}/artist/upload"
    
    checkout_request = CheckoutSessionRequest(
        amount=ARTIST_UPLOAD_PRICE,
        currency="aud",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": current_user["id"],
            "user_email": current_user["email"],
            "payment_type": "upload_credit"
        }
    )
    
    session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    transaction_doc = {
        "id": str(uuid.uuid4()),
        "session_id": session.session_id,
        "user_id": current_user["id"],
        "user_email": current_user["email"],
        "amount": ARTIST_UPLOAD_PRICE,
        "currency": "aud",
        "payment_type": "upload_credit",
        "status": "pending",
        "payment_status": "initiated",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payment_transactions.insert_one(transaction_doc)
    
    return {"checkout_url": session.url, "session_id": session.session_id}

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(
    request: Request,
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Check payment status and update subscription/credits if paid"""
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    # Get checkout status from Stripe
    checkout_status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
    
    # Find the transaction
    transaction = await db.payment_transactions.find_one({"session_id": session_id})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Verify transaction belongs to current user
    if transaction["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Update transaction status
    new_status = "completed" if checkout_status.payment_status == "paid" else checkout_status.status
    await db.payment_transactions.update_one(
        {"session_id": session_id},
        {"$set": {
            "status": new_status,
            "payment_status": checkout_status.payment_status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # If payment successful and not already processed
    if checkout_status.payment_status == "paid" and transaction["payment_status"] != "paid":
        payment_type = checkout_status.metadata.get("payment_type") or transaction.get("payment_type")
        
        if payment_type == "subscription":
            # Create/update subscription
            subscription_doc = {
                "id": str(uuid.uuid4()),
                "user_id": current_user["id"],
                "status": "active",
                "started_at": datetime.now(timezone.utc).isoformat(),
                "expires_at": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
                "payment_session_id": session_id
            }
            await db.subscriptions.insert_one(subscription_doc)
            
            # Update user subscription status
            await db.users.update_one(
                {"id": current_user["id"]},
                {"$set": {"has_subscription": True, "subscription_expires": subscription_doc["expires_at"]}}
            )
            
        elif payment_type == "upload_credit":
            # Add upload credit to user
            await db.users.update_one(
                {"id": current_user["id"]},
                {"$inc": {"upload_credits": 1}}
            )
    
    return {
        "status": new_status,
        "payment_status": checkout_status.payment_status,
        "amount": checkout_status.amount_total / 100,  # Convert from cents
        "currency": checkout_status.currency,
        "payment_type": transaction.get("payment_type")
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events"""
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        # Update transaction based on webhook event
        if webhook_response.session_id:
            await db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id},
                {"$set": {
                    "payment_status": webhook_response.payment_status,
                    "webhook_event_id": webhook_response.event_id,
                    "webhook_event_type": webhook_response.event_type,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            # Process successful payment
            if webhook_response.payment_status == "paid":
                transaction = await db.payment_transactions.find_one({"session_id": webhook_response.session_id})
                if transaction:
                    user_id = webhook_response.metadata.get("user_id") or transaction.get("user_id")
                    payment_type = webhook_response.metadata.get("payment_type") or transaction.get("payment_type")
                    
                    if payment_type == "subscription":
                        # Check if subscription already exists for this session
                        existing = await db.subscriptions.find_one({"payment_session_id": webhook_response.session_id})
                        if not existing:
                            subscription_doc = {
                                "id": str(uuid.uuid4()),
                                "user_id": user_id,
                                "status": "active",
                                "started_at": datetime.now(timezone.utc).isoformat(),
                                "expires_at": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
                                "payment_session_id": webhook_response.session_id
                            }
                            await db.subscriptions.insert_one(subscription_doc)
                            await db.users.update_one(
                                {"id": user_id},
                                {"$set": {"has_subscription": True, "subscription_expires": subscription_doc["expires_at"]}}
                            )
                    
                    elif payment_type == "upload_credit":
                        # Check if credit already added for this session
                        if not transaction.get("credit_added"):
                            await db.users.update_one(
                                {"id": user_id},
                                {"$inc": {"upload_credits": 1}}
                            )
                            await db.payment_transactions.update_one(
                                {"session_id": webhook_response.session_id},
                                {"$set": {"credit_added": True}}
                            )
        
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/payments/subscription/status")
async def get_subscription_status(current_user: dict = Depends(get_current_user)):
    """Check if user has active subscription"""
    if current_user["user_type"] != "listener":
        return {"has_subscription": True, "is_artist": True}  # Artists don't need subscription
    
    # Check for active subscription
    active_sub = await db.subscriptions.find_one({
        "user_id": current_user["id"],
        "status": "active",
        "expires_at": {"$gt": datetime.now(timezone.utc).isoformat()}
    })
    
    return {
        "has_subscription": active_sub is not None,
        "expires_at": active_sub["expires_at"] if active_sub else None,
        "price": LISTENER_SUBSCRIPTION_PRICE
    }

@api_router.get("/payments/upload-credits")
async def get_upload_credits(current_user: dict = Depends(get_current_user)):
    """Get artist's upload credits"""
    if current_user["user_type"] != "artist":
        raise HTTPException(status_code=400, detail="Only artists have upload credits")
    
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0, "upload_credits": 1})
    return {
        "credits": user.get("upload_credits", 0),
        "price_per_upload": ARTIST_UPLOAD_PRICE
    }

# ============== ADMIN ROUTES ==============

@api_router.post("/admin/setup")
async def setup_admin():
    """Create initial admin account if none exists"""
    existing_admin = await db.users.find_one({"user_type": "admin"})
    if existing_admin:
        raise HTTPException(status_code=400, detail="Admin already exists")
    
    admin_doc = {
        "id": str(uuid.uuid4()),
        "email": "admin@fyahtrakz.com",
        "password": hash_password("admin123"),
        "name": "Admin",
        "user_type": "admin",
        "avatar": None,
        "bio": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(admin_doc)
    
    return {"message": "Admin account created", "email": "admin@fyahtrakz.com", "password": "admin123"}

# --- User Management ---

@api_router.get("/admin/users")
async def admin_get_users(
    user_type: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(50, le=200),
    skip: int = 0,
    admin: dict = Depends(get_admin_user)
):
    """Get all users with filters"""
    query = {}
    if user_type:
        query["user_type"] = user_type
    if status == "banned":
        query["is_banned"] = True
    elif status == "active":
        query["is_banned"] = {"$ne": True}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    
    users = await db.users.find(query, {"_id": 0, "password": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.users.count_documents(query)
    
    return {"users": users, "total": total}

@api_router.get("/admin/users/{user_id}")
async def admin_get_user(user_id: str, admin: dict = Depends(get_admin_user)):
    """Get detailed user info"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get additional stats
    if user["user_type"] == "artist":
        user["song_count"] = await db.songs.count_documents({"artist_id": user_id})
        user["total_plays"] = sum([s.get("play_count", 0) for s in await db.songs.find({"artist_id": user_id}, {"play_count": 1}).to_list(1000)])
    elif user["user_type"] == "listener":
        user["playlist_count"] = await db.playlists.count_documents({"user_id": user_id})
        subscription = await db.subscriptions.find_one({"user_id": user_id, "status": "active"}, {"_id": 0})
        user["subscription"] = subscription
    
    # Get payment history
    payments = await db.payment_transactions.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).limit(10).to_list(10)
    user["recent_payments"] = payments
    
    return user

@api_router.put("/admin/users/{user_id}/ban")
async def admin_ban_user(user_id: str, admin: dict = Depends(get_admin_user)):
    """Ban a user"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user["user_type"] == "admin":
        raise HTTPException(status_code=400, detail="Cannot ban admin")
    
    await db.users.update_one({"id": user_id}, {"$set": {"is_banned": True, "banned_at": datetime.now(timezone.utc).isoformat()}})
    return {"message": "User banned"}

@api_router.put("/admin/users/{user_id}/unban")
async def admin_unban_user(user_id: str, admin: dict = Depends(get_admin_user)):
    """Unban a user"""
    await db.users.update_one({"id": user_id}, {"$set": {"is_banned": False}, "$unset": {"banned_at": ""}})
    return {"message": "User unbanned"}

@api_router.put("/admin/users/{user_id}/subscription")
async def admin_manage_subscription(
    user_id: str,
    action: str = Query(..., regex="^(grant|revoke|extend)$"),
    days: int = Query(30, ge=1, le=365),
    admin: dict = Depends(get_admin_user)
):
    """Manage user subscription"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if action == "grant":
        subscription_doc = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "status": "active",
            "started_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": (datetime.now(timezone.utc) + timedelta(days=days)).isoformat(),
            "granted_by_admin": admin["id"]
        }
        await db.subscriptions.insert_one(subscription_doc)
        await db.users.update_one({"id": user_id}, {"$set": {"has_subscription": True, "subscription_expires": subscription_doc["expires_at"]}})
        return {"message": f"Subscription granted for {days} days"}
    
    elif action == "revoke":
        await db.subscriptions.update_many({"user_id": user_id, "status": "active"}, {"$set": {"status": "revoked"}})
        await db.users.update_one({"id": user_id}, {"$set": {"has_subscription": False}})
        return {"message": "Subscription revoked"}
    
    elif action == "extend":
        active_sub = await db.subscriptions.find_one({"user_id": user_id, "status": "active"})
        if active_sub:
            current_expires = datetime.fromisoformat(active_sub["expires_at"].replace("Z", "+00:00"))
            new_expires = current_expires + timedelta(days=days)
            await db.subscriptions.update_one({"id": active_sub["id"]}, {"$set": {"expires_at": new_expires.isoformat()}})
            await db.users.update_one({"id": user_id}, {"$set": {"subscription_expires": new_expires.isoformat()}})
            return {"message": f"Subscription extended by {days} days"}
        else:
            raise HTTPException(status_code=400, detail="No active subscription to extend")

@api_router.put("/admin/users/{user_id}/credits")
async def admin_manage_credits(
    user_id: str,
    credits: int = Query(..., ge=-100, le=100),
    admin: dict = Depends(get_admin_user)
):
    """Add or remove upload credits"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user["user_type"] != "artist":
        raise HTTPException(status_code=400, detail="Only artists have upload credits")
    
    await db.users.update_one({"id": user_id}, {"$inc": {"upload_credits": credits}})
    return {"message": f"Credits adjusted by {credits}"}

# --- Content Moderation ---

@api_router.get("/admin/songs")
async def admin_get_songs(
    status: Optional[str] = None,
    artist_id: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(50, le=200),
    skip: int = 0,
    admin: dict = Depends(get_admin_user)
):
    """Get all songs with filters"""
    query = {}
    if status == "flagged":
        query["is_flagged"] = True
    elif status == "removed":
        query["is_removed"] = True
    if artist_id:
        query["artist_id"] = artist_id
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"artist_name": {"$regex": search, "$options": "i"}}
        ]
    
    songs = await db.songs.find(query, {"_id": 0, "audio_url": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.songs.count_documents(query)
    
    return {"songs": songs, "total": total}

@api_router.put("/admin/songs/{song_id}/remove")
async def admin_remove_song(song_id: str, reason: str = "", admin: dict = Depends(get_admin_user)):
    """Remove a song"""
    song = await db.songs.find_one({"id": song_id})
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    
    await db.songs.update_one({"id": song_id}, {"$set": {
        "is_removed": True,
        "removed_at": datetime.now(timezone.utc).isoformat(),
        "removed_by": admin["id"],
        "removal_reason": reason
    }})
    return {"message": "Song removed"}

@api_router.put("/admin/songs/{song_id}/restore")
async def admin_restore_song(song_id: str, admin: dict = Depends(get_admin_user)):
    """Restore a removed song"""
    await db.songs.update_one({"id": song_id}, {"$set": {"is_removed": False}, "$unset": {"removed_at": "", "removed_by": "", "removal_reason": ""}})
    return {"message": "Song restored"}

@api_router.put("/admin/songs/{song_id}/flag")
async def admin_flag_song(song_id: str, reason: str = "", admin: dict = Depends(get_admin_user)):
    """Flag a song for review"""
    await db.songs.update_one({"id": song_id}, {"$set": {"is_flagged": True, "flag_reason": reason}})
    return {"message": "Song flagged"}

@api_router.put("/admin/songs/{song_id}/unflag")
async def admin_unflag_song(song_id: str, admin: dict = Depends(get_admin_user)):
    """Remove flag from song"""
    await db.songs.update_one({"id": song_id}, {"$set": {"is_flagged": False}, "$unset": {"flag_reason": ""}})
    return {"message": "Song unflagged"}

@api_router.delete("/admin/songs/{song_id}")
async def admin_delete_song(song_id: str, admin: dict = Depends(get_admin_user)):
    """Permanently delete a song"""
    song = await db.songs.find_one({"id": song_id})
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    
    # Remove from playlists
    await db.playlists.update_many({}, {"$pull": {"songs": song_id}})
    await db.songs.delete_one({"id": song_id})
    
    return {"message": "Song permanently deleted"}

# --- Financial Dashboard ---

@api_router.get("/admin/finance/overview")
async def admin_finance_overview(admin: dict = Depends(get_admin_user)):
    """Get financial overview"""
    # Total revenue
    pipeline = [
        {"$match": {"payment_status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}, "count": {"$sum": 1}}}
    ]
    result = await db.payment_transactions.aggregate(pipeline).to_list(1)
    total_revenue = result[0]["total"] if result else 0
    total_transactions = result[0]["count"] if result else 0
    
    # Revenue by type
    pipeline_by_type = [
        {"$match": {"payment_status": "paid"}},
        {"$group": {"_id": "$payment_type", "total": {"$sum": "$amount"}, "count": {"$sum": 1}}}
    ]
    revenue_by_type = await db.payment_transactions.aggregate(pipeline_by_type).to_list(10)
    
    # Monthly revenue (last 6 months)
    six_months_ago = (datetime.now(timezone.utc) - timedelta(days=180)).isoformat()
    pipeline_monthly = [
        {"$match": {"payment_status": "paid", "created_at": {"$gte": six_months_ago}}},
        {"$addFields": {"month": {"$substr": ["$created_at", 0, 7]}}},
        {"$group": {"_id": "$month", "total": {"$sum": "$amount"}, "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]
    monthly_revenue = await db.payment_transactions.aggregate(pipeline_monthly).to_list(12)
    
    # Active subscriptions
    active_subs = await db.subscriptions.count_documents({
        "status": "active",
        "expires_at": {"$gt": datetime.now(timezone.utc).isoformat()}
    })
    
    return {
        "total_revenue": total_revenue,
        "total_transactions": total_transactions,
        "revenue_by_type": {r["_id"]: {"total": r["total"], "count": r["count"]} for r in revenue_by_type},
        "monthly_revenue": monthly_revenue,
        "active_subscriptions": active_subs,
        "currency": "AUD"
    }

@api_router.get("/admin/finance/transactions")
async def admin_get_transactions(
    payment_type: Optional[str] = None,
    status: Optional[str] = None,
    user_id: Optional[str] = None,
    limit: int = Query(50, le=200),
    skip: int = 0,
    admin: dict = Depends(get_admin_user)
):
    """Get all transactions"""
    query = {}
    if payment_type:
        query["payment_type"] = payment_type
    if status:
        query["payment_status"] = status
    if user_id:
        query["user_id"] = user_id
    
    transactions = await db.payment_transactions.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.payment_transactions.count_documents(query)
    
    return {"transactions": transactions, "total": total}

@api_router.post("/admin/finance/refund/{transaction_id}")
async def admin_refund_transaction(transaction_id: str, admin: dict = Depends(get_admin_user)):
    """Mark transaction as refunded (actual Stripe refund would need additional integration)"""
    transaction = await db.payment_transactions.find_one({"id": transaction_id})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    await db.payment_transactions.update_one({"id": transaction_id}, {"$set": {
        "payment_status": "refunded",
        "refunded_at": datetime.now(timezone.utc).isoformat(),
        "refunded_by": admin["id"]
    }})
    
    # If subscription, revoke it
    if transaction.get("payment_type") == "subscription":
        await db.subscriptions.update_many(
            {"payment_session_id": transaction.get("session_id")},
            {"$set": {"status": "refunded"}}
        )
        await db.users.update_one({"id": transaction["user_id"]}, {"$set": {"has_subscription": False}})
    
    # If upload credit, deduct it
    elif transaction.get("payment_type") == "upload_credit":
        await db.users.update_one({"id": transaction["user_id"]}, {"$inc": {"upload_credits": -1}})
    
    return {"message": "Transaction marked as refunded"}

# --- Platform Settings ---

@api_router.get("/admin/settings")
async def admin_get_settings(admin: dict = Depends(get_admin_user)):
    """Get platform settings"""
    settings = await db.settings.find_one({"id": "platform_settings"}, {"_id": 0})
    if not settings:
        settings = {
            "id": "platform_settings",
            "artist_upload_price": ARTIST_UPLOAD_PRICE,
            "listener_subscription_price": LISTENER_SUBSCRIPTION_PRICE,
            "currency": "AUD",
            "allow_free_uploads": False,
            "require_subscription": True,
            "maintenance_mode": False
        }
        await db.settings.insert_one(settings)
    return settings

@api_router.put("/admin/settings")
async def admin_update_settings(
    artist_upload_price: Optional[float] = None,
    listener_subscription_price: Optional[float] = None,
    allow_free_uploads: Optional[bool] = None,
    require_subscription: Optional[bool] = None,
    maintenance_mode: Optional[bool] = None,
    admin: dict = Depends(get_admin_user)
):
    """Update platform settings"""
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat(), "updated_by": admin["id"]}
    
    if artist_upload_price is not None:
        update_data["artist_upload_price"] = artist_upload_price
    if listener_subscription_price is not None:
        update_data["listener_subscription_price"] = listener_subscription_price
    if allow_free_uploads is not None:
        update_data["allow_free_uploads"] = allow_free_uploads
    if require_subscription is not None:
        update_data["require_subscription"] = require_subscription
    if maintenance_mode is not None:
        update_data["maintenance_mode"] = maintenance_mode
    
    await db.settings.update_one({"id": "platform_settings"}, {"$set": update_data}, upsert=True)
    return {"message": "Settings updated"}

# --- Analytics ---

@api_router.get("/admin/analytics/overview")
async def admin_analytics_overview(admin: dict = Depends(get_admin_user)):
    """Get platform analytics overview"""
    # User counts
    total_users = await db.users.count_documents({"user_type": {"$ne": "admin"}})
    total_artists = await db.users.count_documents({"user_type": "artist"})
    total_listeners = await db.users.count_documents({"user_type": "listener"})
    
    # Content counts
    total_songs = await db.songs.count_documents({"is_removed": {"$ne": True}})
    total_albums = await db.albums.count_documents({})
    total_playlists = await db.playlists.count_documents({})
    
    # Play counts
    pipeline = [{"$group": {"_id": None, "total_plays": {"$sum": "$play_count"}}}]
    result = await db.songs.aggregate(pipeline).to_list(1)
    total_plays = result[0]["total_plays"] if result else 0
    
    # New users this month
    month_start = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
    new_users_month = await db.users.count_documents({"created_at": {"$gte": month_start}, "user_type": {"$ne": "admin"}})
    
    # Active subscriptions
    active_subs = await db.subscriptions.count_documents({
        "status": "active",
        "expires_at": {"$gt": datetime.now(timezone.utc).isoformat()}
    })
    
    return {
        "users": {
            "total": total_users,
            "artists": total_artists,
            "listeners": total_listeners,
            "new_this_month": new_users_month
        },
        "content": {
            "songs": total_songs,
            "albums": total_albums,
            "playlists": total_playlists,
            "total_plays": total_plays
        },
        "subscriptions": {
            "active": active_subs
        }
    }

@api_router.get("/admin/analytics/top-songs")
async def admin_top_songs(limit: int = Query(20, le=100), admin: dict = Depends(get_admin_user)):
    """Get top songs by play count"""
    songs = await db.songs.find({"is_removed": {"$ne": True}}, {"_id": 0, "audio_url": 0}).sort("play_count", -1).limit(limit).to_list(limit)
    return songs

@api_router.get("/admin/analytics/top-artists")
async def admin_top_artists(limit: int = Query(20, le=100), admin: dict = Depends(get_admin_user)):
    """Get top artists by total plays"""
    pipeline = [
        {"$match": {"is_removed": {"$ne": True}}},
        {"$group": {"_id": "$artist_id", "artist_name": {"$first": "$artist_name"}, "total_plays": {"$sum": "$play_count"}, "song_count": {"$sum": 1}}},
        {"$sort": {"total_plays": -1}},
        {"$limit": limit}
    ]
    artists = await db.songs.aggregate(pipeline).to_list(limit)
    return artists

@api_router.get("/admin/analytics/growth")
async def admin_growth_analytics(admin: dict = Depends(get_admin_user)):
    """Get growth analytics over time"""
    # User growth by month (last 6 months)
    six_months_ago = (datetime.now(timezone.utc) - timedelta(days=180)).isoformat()
    pipeline = [
        {"$match": {"created_at": {"$gte": six_months_ago}, "user_type": {"$ne": "admin"}}},
        {"$addFields": {"month": {"$substr": ["$created_at", 0, 7]}}},
        {"$group": {"_id": {"month": "$month", "type": "$user_type"}, "count": {"$sum": 1}}},
        {"$sort": {"_id.month": 1}}
    ]
    user_growth = await db.users.aggregate(pipeline).to_list(100)
    
    # Song uploads by month
    pipeline_songs = [
        {"$match": {"created_at": {"$gte": six_months_ago}}},
        {"$addFields": {"month": {"$substr": ["$created_at", 0, 7]}}},
        {"$group": {"_id": "$month", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]
    song_growth = await db.songs.aggregate(pipeline_songs).to_list(12)
    
    return {
        "user_growth": user_growth,
        "song_growth": song_growth
    }

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
