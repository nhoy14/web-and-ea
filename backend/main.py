import os
import random
import string
import datetime
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, create_engine, Float
from sqlalchemy.orm import relationship, declarative_base, sessionmaker, Session
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr

# --- DATABASE CONFIGURATION ---
DATABASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_URL = f"sqlite:///{os.path.join(DATABASE_DIR, 'licensing.db')}"

# Create SQLite engine
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency to get db session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- DATABASE MODELS ---
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    licenses = relationship("License", back_populates="owner", cascade="all, delete-orphan")


class License(Base):
    __tablename__ = "licenses"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_account = Column(String, nullable=True) # Account bounds on first EA run
    expiry_date = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    mt5_balance = Column(Float, nullable=True)
    mt5_equity = Column(Float, nullable=True)
    mt5_today_profit = Column(Float, nullable=True)
    mt5_weekly_profit = Column(Float, nullable=True)
    mt5_server = Column(String, nullable=True)
    last_seen = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="licenses")


class BotRelease(Base):
    __tablename__ = "bot_releases"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    subtext = Column(String, nullable=True)
    badge = Column(String, default="Ready")
    bullets = Column(String, nullable=True) # newline-separated list
    type = Column(String, default="bot") # "bot" or "setting"
    download_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


# --- PYDANTIC SCHEMAS ---
# Auth Schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    email: EmailStr
    is_admin: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# License Schemas
class LicenseCreate(BaseModel):
    expiry_months: int = 12

class BindLicenseRequest(BaseModel):
    account: str

class LicenseOut(BaseModel):
    id: int
    key: str
    assigned_account: Optional[str] = None
    expiry_date: datetime.datetime
    is_active: bool
    created_at: datetime.datetime
    
    mt5_balance: Optional[float] = None
    mt5_equity: Optional[float] = None
    mt5_today_profit: Optional[float] = None
    mt5_weekly_profit: Optional[float] = None
    mt5_server: Optional[str] = None
    last_seen: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

class LicenseVerifyResponse(BaseModel):
    status: str
    message: str
    expiry_date: Optional[str] = None
    assigned_account: Optional[str] = None


class BotReleaseCreate(BaseModel):
    title: str
    subtext: Optional[str] = None
    badge: str = "Ready"
    bullets: Optional[str] = None
    type: str = "bot"
    download_url: Optional[str] = None


class BotReleaseOut(BaseModel):
    id: int
    title: str
    subtext: Optional[str] = None
    badge: str
    bullets: Optional[str] = None
    type: str
    download_url: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# --- APP SETUP ---
# Create DB Tables if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(title="EA Licensing System API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication & Hashing setup
SECRET_KEY = "DAJ_SUPER_SECRET_KEY_FOR_JWT_SECURITY_2026"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 Hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Auto-create default admin user if not exists
db = SessionLocal()
try:
    admin_user = db.query(User).filter(User.email == "admin@supertradingea.com").first()
    if not admin_user:
        hashed_pwd = pwd_context.hash("1")
        new_admin = User(email="admin@supertradingea.com", password_hash=hashed_pwd, is_admin=True)
        db.add(new_admin)
        db.commit()
        print("Created default admin user: admin@supertradingea.com / password: 1")
    else:
        # If the user already exists, ensure they are set as an admin
        if not admin_user.is_admin:
            admin_user.is_admin = True
            db.commit()
            print("Ensured admin privileges for admin@supertradingea.com")
            
    # Auto-create default bot releases if table is empty
    bot_count = db.query(BotRelease).count()
    if bot_count == 0:
        default_releases = [
            BotRelease(
                title="SuperTradingEA V2.2.2 ( File-Based )",
                subtext="Direct download • MTS-ready",
                badge="Ready",
                bullets="Same version as the terminal but running bot and modify setting on the vps.",
                type="bot"
            ),
            BotRelease(
                title="SuperTradingEA V2.2.2",
                subtext="Direct download • MTS-ready",
                badge="Ready",
                bullets="[NEW] Support terminal access\n[NEW] Support multiple strategies in one EA file\n[BETA] Swing profile data direction filter\n[BETA] Money flow pressure filter\n[NEW] Support multiple strategies",
                type="bot"
            ),
            BotRelease(
                title="SuperTradingEA V1.1",
                subtext="Direct download • MTS-ready",
                badge="Ready",
                bullets="News Filter [NEW]\nBreakeven Exit Mode [NEW]\nGrace Clearance Mode [NEW]",
                type="bot"
            ),
            BotRelease(
                title="SuperTradingEA URL",
                subtext="Direct download • MTS-ready",
                badge="Ready",
                bullets="Use the official URL for the terminal access",
                type="bot"
            ),
            BotRelease(
                title="SuperTradingEA V1",
                subtext="Direct download • MTS-ready",
                badge="Ready",
                bullets="Grid Martingale\nBi-Directional Grid\nAdaptive Pip Step\nAdaptive Take Profit\nZone Filter - Stochastic OB OS\nSessions Filter\nDaily Profit Target ( Supported Value & Percentage )\nEquity Protection\nGUI Dashboard",
                type="bot"
            ),
            BotRelease(
                title="XAUUSD Conservative Settings",
                subtext="Low drawdown preset • 1M timeframe",
                badge="Setfile",
                bullets="Configured for $500+ accounts\nATR smoothing multiplier: 1.5x\nMartingale factor: 1.2x (Conservative)\nNews filter enabled",
                type="setting"
            ),
            BotRelease(
                title="XAUUSD Aggressive Settings",
                subtext="High yield preset • 1M timeframe",
                badge="Setfile",
                bullets="Configured for $1000+ accounts\nATR smoothing multiplier: 2.2x\nMartingale factor: 1.8x (Aggressive)\nDaily equity protection set to 15%",
                type="setting"
            ),
            BotRelease(
                title="GBPUSD Grid Settings",
                subtext="Currency trend preset • 5M timeframe",
                badge="Setfile",
                bullets="Configured for stable currency pairs\nBi-directional hedge grid setup\nTake profit exit: 12 pips",
                type="setting"
            )
        ]
        db.add_all(default_releases)
        db.commit()
        print("Created default bot releases and settings presets.")
except Exception as e:
    print(f"Error initializing DB: {e}")
finally:
    db.close()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Dependency to get current user
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == token_data.email).first()
    if user is None:
        raise credentials_exception
    return user

# Helper function to generate high-quality license keys
def generate_random_license_key():
    # Format: DAJ-XXXX-XXXX-XXXX
    parts = []
    for _ in range(3):
        parts.append("".join(random.choices(string.ascii_uppercase + string.digits, k=4)))
    return "DAJ-" + "-".join(parts)


# --- ROUTES ---

@app.get("/")
def read_root():
    return {"message": "EA Licensing System API is running."}

@app.post("/api/auth/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered."
        )
    
    hashed_pwd = get_password_hash(user_data.password)
    # Automatically make admin@supertradingea.com an admin
    is_admin = (user_data.email.lower() == "admin@supertradingea.com")
    new_user = User(email=user_data.email, password_hash=hashed_pwd, is_admin=is_admin)
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/auth/login")
def login(user_data: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer", "email": user.email, "is_admin": user.is_admin}

@app.post("/api/licenses/generate", response_model=LicenseOut)
def generate_license(license_data: LicenseCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Generate unique license key
    key = generate_random_license_key()
    while db.query(License).filter(License.key == key).first() is not None:
        key = generate_random_license_key()
        
    expiry = datetime.datetime.utcnow() + datetime.timedelta(days=30 * license_data.expiry_months)
    
    new_license = License(
        key=key,
        user_id=current_user.id,
        expiry_date=expiry,
        is_active=True
    )
    
    db.add(new_license)
    db.commit()
    db.refresh(new_license)
    return new_license

@app.get("/api/licenses/me", response_model=List[LicenseOut])
def get_my_licenses(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(License).filter(License.user_id == current_user.id).all()

@app.post("/api/licenses/{license_id}/bind")
def bind_license(license_id: int, req: BindLicenseRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    lic = db.query(License).filter(License.id == license_id, License.user_id == current_user.id).first()
    if not lic:
        raise HTTPException(status_code=404, detail="License not found.")
    if lic.assigned_account:
        raise HTTPException(status_code=400, detail="License is already bound to an account.")
    lic.assigned_account = req.account
    db.commit()
    db.refresh(lic)
    return {"status": "success", "assigned_account": lic.assigned_account}

# --- EA VERIFICATION ENDPOINT (MQL5 Query Endpoint) ---
@app.get("/api/licenses/verify", response_model=LicenseVerifyResponse)
def verify_license(
    key: str = Query(..., description="The license key to verify"),
    account: str = Query(..., description="The MT5 account login requesting access"),
    balance: Optional[float] = Query(None),
    equity: Optional[float] = Query(None),
    today_profit: Optional[float] = Query(None),
    weekly_profit: Optional[float] = Query(None),
    server: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    # Special dynamic validation for STEA format keys (e.g. STEA-XAUUSD-505857-LIVE)
    if key.startswith("STEA-"):
        parts = key.split("-")
        if len(parts) == 4:
            key_account = parts[2]
            key_type = parts[3]
            if key_account == account and key_type in ["LIVE", "DEMO"]:
                return LicenseVerifyResponse(
                    status="success",
                    message=f"License active and verified via STEA pattern ({key_type} account).",
                    expiry_date="2026.12.31 23:59",
                    assigned_account=account
                )
            else:
                return LicenseVerifyResponse(
                    status="error",
                    message=f"License key account mismatch. Key is registered for account {key_account}."
                )

    license_obj = db.query(License).filter(License.key == key).first()
    
    if not license_obj:
        return LicenseVerifyResponse(
            status="error",
            message="License Key not found in database."
        )
        
    if not license_obj.is_active:
        return LicenseVerifyResponse(
            status="error",
            message="License Key is disabled."
        )
        
    # Check expiry
    if license_obj.expiry_date < datetime.datetime.utcnow():
        return LicenseVerifyResponse(
            status="error",
            message="License has expired."
        )
        
    # Check account binding
    if license_obj.assigned_account is None or license_obj.assigned_account == "":
        # Bind the account on first run
        license_obj.assigned_account = account
        license_obj.mt5_balance = balance
        license_obj.mt5_equity = equity
        license_obj.mt5_today_profit = today_profit
        license_obj.mt5_weekly_profit = weekly_profit
        license_obj.mt5_server = server
        license_obj.last_seen = datetime.datetime.utcnow()
        db.commit()
        db.refresh(license_obj)
        return LicenseVerifyResponse(
            status="success",
            message="License successfully bound to your account and activated.",
            expiry_date=license_obj.expiry_date.strftime("%Y.%m.%d %H:%M"),
            assigned_account=account
        )
        
    if license_obj.assigned_account != account:
        return LicenseVerifyResponse(
            status="error",
            message=f"License is registered to account {license_obj.assigned_account}. Cannot bind to {account}."
        )
        
    # Active & Valid
    license_obj.mt5_balance = balance
    license_obj.mt5_equity = equity
    license_obj.mt5_today_profit = today_profit
    license_obj.mt5_weekly_profit = weekly_profit
    license_obj.mt5_server = server
    license_obj.last_seen = datetime.datetime.utcnow()
    db.commit()
    db.refresh(license_obj)
    
    return LicenseVerifyResponse(
        status="success",
        message="License active and verified.",
        expiry_date=license_obj.expiry_date.strftime("%Y.%m.%d %H:%M"),
        assigned_account=license_obj.assigned_account
    )


# --- ADMIN SCHEMAS & ENDPOINTS ---

class ExtendLicenseRequest(BaseModel):
    months: int

class AdminGenerateLicenseRequest(BaseModel):
    user_id: int
    expiry_months: int = 12
    custom_key: Optional[str] = None


@app.get("/api/admin/users")
def admin_get_users(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin privileges required.")
    users = db.query(User).all()
    return [{"id": u.id, "email": u.email, "is_admin": u.is_admin, "created_at": u.created_at} for u in users]


@app.get("/api/admin/licenses")
def admin_get_licenses(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin privileges required.")
    licenses = db.query(License).all()
    return [{
        "id": l.id,
        "key": l.key,
        "user_id": l.user_id,
        "user_email": l.owner.email if l.owner else "Unknown",
        "assigned_account": l.assigned_account,
        "expiry_date": l.expiry_date,
        "is_active": l.is_active,
        "created_at": l.created_at,
        "mt5_balance": l.mt5_balance,
        "mt5_equity": l.mt5_equity,
        "mt5_today_profit": l.mt5_today_profit,
        "mt5_weekly_profit": l.mt5_weekly_profit,
        "mt5_server": l.mt5_server,
        "last_seen": l.last_seen
    } for l in licenses]


@app.post("/api/admin/licenses/{license_id}/toggle")
def admin_toggle_license(license_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin privileges required.")
    lic = db.query(License).filter(License.id == license_id).first()
    if not lic:
        raise HTTPException(status_code=404, detail="License not found.")
    lic.is_active = not lic.is_active
    db.commit()
    db.refresh(lic)
    return {"status": "success", "is_active": lic.is_active}


@app.post("/api/admin/licenses/{license_id}/extend")
def admin_extend_license(license_id: int, req: ExtendLicenseRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin privileges required.")
    lic = db.query(License).filter(License.id == license_id).first()
    if not lic:
        raise HTTPException(status_code=404, detail="License not found.")
    # Extend from current expiry or now, whichever is later
    base_date = max(lic.expiry_date, datetime.datetime.utcnow())
    lic.expiry_date = base_date + datetime.timedelta(days=30 * req.months)
    db.commit()
    db.refresh(lic)
    return {"status": "success", "expiry_date": lic.expiry_date}


@app.delete("/api/admin/licenses/{license_id}")
def admin_delete_license(license_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin privileges required.")
    lic = db.query(License).filter(License.id == license_id).first()
    if not lic:
        raise HTTPException(status_code=404, detail="License not found.")
    db.delete(lic)
    db.commit()
    return {"status": "success"}


@app.post("/api/admin/licenses/generate")
def admin_generate_license(req: AdminGenerateLicenseRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin privileges required.")
    
    target_user = db.query(User).filter(User.id == req.user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found.")
        
    key = req.custom_key
    if not key:
        key = generate_random_license_key()
        while db.query(License).filter(License.key == key).first() is not None:
            key = generate_random_license_key()
    else:
        # Check uniqueness of custom key
        if db.query(License).filter(License.key == key).first() is not None:
            raise HTTPException(status_code=400, detail="License key already exists.")
            
    expiry = datetime.datetime.utcnow() + datetime.timedelta(days=30 * req.expiry_months)
    
    new_license = License(
        key=key,
        user_id=target_user.id,
        expiry_date=expiry,
        is_active=True
    )
    db.add(new_license)
    db.commit()
    db.refresh(new_license)
    return new_license


# --- BOTS & SETTINGS ROUTE HANDLERS ---

@app.get("/api/bots", response_model=List[BotReleaseOut])
def get_bot_releases(db: Session = Depends(get_db)):
    return db.query(BotRelease).order_by(BotRelease.created_at.desc()).all()


@app.post("/api/admin/bots", response_model=BotReleaseOut)
def admin_create_bot_release(
    req: BotReleaseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin privileges required.")
    
    new_release = BotRelease(
        title=req.title,
        subtext=req.subtext,
        badge=req.badge,
        bullets=req.bullets,
        type=req.type,
        download_url=req.download_url
    )
    db.add(new_release)
    db.commit()
    db.refresh(new_release)
    return new_release


@app.put("/api/admin/bots/{bot_id}", response_model=BotReleaseOut)
def admin_update_bot_release(
    bot_id: int,
    req: BotReleaseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin privileges required.")
    
    release = db.query(BotRelease).filter(BotRelease.id == bot_id).first()
    if not release:
        raise HTTPException(status_code=404, detail="Release not found.")
        
    release.title = req.title
    release.subtext = req.subtext
    release.badge = req.badge
    release.bullets = req.bullets
    release.type = req.type
    release.download_url = req.download_url
    
    db.commit()
    db.refresh(release)
    return release


@app.delete("/api/admin/bots/{bot_id}")
def admin_delete_bot_release(
    bot_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin privileges required.")
    
    release = db.query(BotRelease).filter(BotRelease.id == bot_id).first()
    if not release:
        raise HTTPException(status_code=404, detail="Release not found.")
        
    db.delete(release)
    db.commit()
    return {"status": "success"}
