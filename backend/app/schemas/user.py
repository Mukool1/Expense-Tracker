from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: EmailStr

    class Config:
        from_attributes = True  # lets Pydantic read data off a SQLAlchemy object, not just a dict


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"