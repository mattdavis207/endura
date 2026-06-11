from supabase import Client, create_client

from app.core.config import get_settings

settings = get_settings()


def create_supabase_client() -> Client:
    supabase: Client = create_client(settings.supabase_url, settings.supabase_key)
    return supabase

# for writing OAuth states and strava tokens.
def create_supabase_admin_client() -> Client:
    service_role_key = settings.supabase_service_role_key

    if not service_role_key:
        raise SupabaseConfigurationError(
            "SUPABASE_SERVICE_ROLE_KEY is required for server-side database writes"
        )

    return create_client(settings.supabase_url, service_role_key)

class SupabaseConfigurationError(RuntimeError):
    pass

