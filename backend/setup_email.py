"""
Script untuk setup email SMTP di COLABMATCH
"""
import os
from pathlib import Path

def setup_smtp():
    """Setup SMTP configuration untuk email verification"""
    
    print("=" * 60)
    print("🔧 COLABMATCH - Email SMTP Setup")
    print("=" * 60)
    print()
    
    print("Pilih provider email:")
    print("1. Gmail (Recommended)")
    print("2. Outlook/Hotmail")
    print("3. Custom SMTP")
    print("4. Skip (Gunakan Mock Email - Development Mode)")
    print()
    
    choice = input("Pilihan Anda (1-4): ").strip()
    
    env_file = Path(__file__).parent / ".env"
    
    # Baca existing .env
    if env_file.exists():
        with open(env_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    else:
        lines = []
    
    # Remove existing SMTP_URL and EMAIL_FROM
    lines = [l for l in lines if not l.startswith('SMTP_URL=') and not l.startswith('EMAIL_FROM=')]
    
    if choice == "1":
        print("\n📧 Gmail Setup")
        print("-" * 60)
        print("⚠️  PENTING: Anda perlu App Password, bukan password Gmail biasa!")
        print()
        print("Cara mendapatkan App Password:")
        print("1. Buka: https://myaccount.google.com/security")
        print("2. Aktifkan 2-Step Verification (jika belum)")
        print("3. Cari 'App Passwords'")
        print("4. Generate password untuk 'Mail' atau 'Other'")
        print("5. Salin 16-digit password yang diberikan")
        print()
        
        email = input("Email Gmail Anda: ").strip()
        app_password = input("App Password (16 digit): ").strip().replace(" ", "")
        
        smtp_url = f"smtp://{email}:{app_password}@smtp.gmail.com:587"
        email_from = input(f"Email pengirim (default: {email}): ").strip() or email
        
        lines.append(f"SMTP_URL={smtp_url}\n")
        lines.append(f"EMAIL_FROM={email_from}\n")
        
        print("\n✅ Gmail SMTP configured!")
        
    elif choice == "2":
        print("\n📧 Outlook/Hotmail Setup")
        print("-" * 60)
        
        email = input("Email Outlook/Hotmail Anda: ").strip()
        password = input("Password: ").strip()
        
        smtp_url = f"smtp://{email}:{password}@smtp-mail.outlook.com:587"
        email_from = input(f"Email pengirim (default: {email}): ").strip() or email
        
        lines.append(f"SMTP_URL={smtp_url}\n")
        lines.append(f"EMAIL_FROM={email_from}\n")
        
        print("\n✅ Outlook SMTP configured!")
        
    elif choice == "3":
        print("\n📧 Custom SMTP Setup")
        print("-" * 60)
        
        host = input("SMTP Host (e.g., smtp.example.com): ").strip()
        port = input("SMTP Port (default: 587): ").strip() or "587"
        username = input("Username: ").strip()
        password = input("Password: ").strip()
        email_from = input("Email pengirim: ").strip()
        
        smtp_url = f"smtp://{username}:{password}@{host}:{port}"
        
        lines.append(f"SMTP_URL={smtp_url}\n")
        lines.append(f"EMAIL_FROM={email_from}\n")
        
        print("\n✅ Custom SMTP configured!")
        
    elif choice == "4":
        print("\n🔧 Development Mode (Mock Email)")
        print("-" * 60)
        print("Email verifikasi akan ditampilkan di console/terminal.")
        print("Tidak ada email sungguhan yang akan dikirim.")
        print()
        
        # Tidak menambahkan SMTP_URL, biarkan kosong
        lines.append("# SMTP_URL=  # Uncomment and configure for production\n")
        lines.append("EMAIL_FROM=noreply@alliv.app\n")
        
        print("✅ Mock email mode enabled!")
    
    else:
        print("\n❌ Pilihan tidak valid!")
        return
    
    # Tulis kembali .env
    with open(env_file, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    
    print()
    print("=" * 60)
    print("✅ Konfigurasi email berhasil disimpan!")
    print("=" * 60)
    print()
    print("⚠️  RESTART backend server agar perubahan berlaku:")
    print("   1. Tekan Ctrl+C di terminal backend")
    print("   2. Jalankan ulang: python run_server.py")
    print()

if __name__ == "__main__":
    try:
        setup_smtp()
    except KeyboardInterrupt:
        print("\n\n❌ Setup dibatalkan.")
    except Exception as e:
        print(f"\n❌ Error: {e}")
