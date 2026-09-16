from fastapi import APIRouter
from pydantic import BaseModel

from app.database.repositories.memory_repository import (
    create_memory,
    get_memories,
)


router = APIRouter(
    prefix="/api/memory",
    tags=["Memory"],
)


class MemoryCreate(BaseModel):
    user_id: str
    object_name: str
    description: str | None = None
    color: str | None = None
    location: str | None = None


@router.post("")
async def save_memory(memory: MemoryCreate):
    return create_memory(memory.model_dump())


@router.get("")
async def list_memories(user_id: str, limit: int = 20):
    return get_memories(user_id, limit)