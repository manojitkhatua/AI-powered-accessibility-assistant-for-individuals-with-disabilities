from app.database.supabase import supabase


def create_memory(memory: dict) -> dict:
    response = (
        supabase
        .table("memories")
        .insert(memory)
        .execute()
    )

    return response.data[0]


def get_memories(user_id: str, limit: int = 20) -> list[dict]:
    response = (
        supabase
        .table("memories")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )

    return response.data