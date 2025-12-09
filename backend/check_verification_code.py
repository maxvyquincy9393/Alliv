"""
Script untuk melihat kode verifikasi dari database
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/alliv_test")

async def check_verification_codes():
    """Cek kode verifikasi terbaru dari database"""
    
    print("=" * 70)
    print("🔍 COLABMATCH - Cek Kode Verifikasi Email")
    print("=" * 70)
    print()
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGO_URI)
    db = client.get_database()
    
    try:
        # Cari user dengan email verification pending
        users = await db.users.find({
            "emailVerified": False
        }).sort("createdAt", -1).limit(10).to_list(length=10)
        
        if not users:
            print("❌ Tidak ada user dengan email yang belum diverifikasi.")
            print()
            print("💡 Tips:")
            print("   - Pastikan Anda sudah mendaftar/register")
            print("   - Cek apakah email sudah terverifikasi")
            return
        
        print(f"📋 Ditemukan {len(users)} user dengan email belum diverifikasi:\n")
        
        for idx, user in enumerate(users, 1):
            print(f"{idx}. Email: {user.get('email', 'N/A')}")
            print(f"   Nama: {user.get('firstName', '')} {user.get('lastName', '')}")
            
            # Cek verification code
            verification_code = user.get('emailVerificationCode')
            code_expires = user.get('emailVerificationCodeExpires')
            
            if verification_code:
                # Format kode untuk display (XXX XXX)
                formatted_code = " ".join(verification_code[i:i+3] for i in range(0, len(verification_code), 3))
                
                print(f"   ✅ Kode Verifikasi: {formatted_code}")
                print(f"   📝 Kode Raw: {verification_code}")
                
                if code_expires:
                    now = datetime.now(timezone.utc)
                    if isinstance(code_expires, datetime):
                        if code_expires.tzinfo is None:
                            code_expires = code_expires.replace(tzinfo=timezone.utc)
                        
                        if code_expires > now:
                            remaining = (code_expires - now).total_seconds() / 60
                            print(f"   ⏰ Berlaku: {remaining:.1f} menit lagi")
                        else:
                            print(f"   ⚠️  EXPIRED! Kode sudah tidak berlaku.")
                            print(f"      Silakan request kode baru.")
                    else:
                        print(f"   ⏰ Expires: {code_expires}")
            else:
                print(f"   ❌ Tidak ada kode verifikasi")
            
            print(f"   📅 Dibuat: {user.get('createdAt', 'N/A')}")
            print()
        
        print("=" * 70)
        print("💡 Cara menggunakan kode:")
        print("   1. Salin kode verifikasi di atas")
        print("   2. Buka halaman verify-email di browser")
        print("   3. Masukkan kode tersebut")
        print("=" * 70)
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(check_verification_codes())
