"""
Export Telegram Session String for Cloud Hosting (Render / Railway)
Run this script locally to generate a TELEGRAM_STRING_SESSION token.
Copy the generated string into your Render Environment Variables.
"""
import sys
import types
import os
from dotenv import load_dotenv

# Compatibility fix for Python 3.13+
if sys.version_info >= (3, 13):
    imghdr = types.ModuleType('imghdr')
    imghdr.what = lambda file, h=None: None
    sys.modules['imghdr'] = imghdr

load_dotenv()

from telethon import TelegramClient
from telethon.sessions import StringSession

API_ID = os.getenv('TELEGRAM_API_ID', '20087736')
API_HASH = os.getenv('TELEGRAM_API_HASH', '6fc2688220304c433513c64c48b01fe2')
PHONE = os.getenv('TELEGRAM_PHONE_NUMBER')

print("=" * 60)
print("🔑 Telegram Cloud Session Generator")
print("=" * 60)

async def main():
    async with TelegramClient(StringSession(), int(API_ID), API_HASH) as client:
        session_str = client.session.save()
        print("\n✅ Success! Your TELEGRAM_STRING_SESSION is:\n")
        print("-" * 60)
        print(session_str)
        print("-" * 60)
        print("\n👉 Add this as an Environment Variable in your Render dashboard:")
        print("Key   : TELEGRAM_STRING_SESSION")
        print(f"Value : {session_str}")
        print("=" * 60)

if __name__ == '__main__':
    import asyncio
    asyncio.run(main())

