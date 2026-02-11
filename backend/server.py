from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

security = HTTPBearer()

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
        "bio": None,
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
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "name": current_user["name"],
        "user_type": current_user["user_type"],
        "avatar": current_user.get("avatar"),
        "bio": current_user.get("bio"),
        "created_at": current_user["created_at"]
    }

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
    
    for artist in top_artists:
        artist["song_count"] = await db.songs.count_documents({"artist_id": artist["id"]})
    
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
    
    # Get song details
    songs = []
    seen_ids = set()
    for h in history:
        if h["song_id"] not in seen_ids:
            song = await db.songs.find_one({"id": h["song_id"]}, {"_id": 0})
            if song:
                song["played_at"] = h["played_at"]
                songs.append(song)
                seen_ids.add(h["song_id"])
    
    return songs

# ============== STATS (Artist Dashboard) ==============

@api_router.get("/stats/artist")
async def get_artist_stats(current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "artist":
        raise HTTPException(status_code=403, detail="Only artists can view stats")
    
    # Get total plays
    songs = await db.songs.find({"artist_id": current_user["id"]}, {"_id": 0}).to_list(1000)
    total_plays = sum(s.get("play_count", 0) for s in songs)
    
    # Get song count
    song_count = len(songs)
    
    # Get album count
    album_count = await db.albums.count_documents({"artist_id": current_user["id"]})
    
    # Top songs
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
    return {"message": "TunePulse API v1.0"}

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
