from supabase import create_client, Client
from app.core.config import get_settings

settings = get_settings()

# Initialize the client singleton
supabase: Client = create_client(settings.supabase_url, settings.supabase_key)


