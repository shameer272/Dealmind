import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.db.database import Base

def gen_uuid():
    return str(uuid.uuid4())

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String(255), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    companies = relationship("Company", back_populates="organization", cascade="all, delete-orphan")
    deals = relationship("Deal", back_populates="organization", cascade="all, delete-orphan")

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=True)
    organization_id = Column(String, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True, index=True)
    role = Column(String(100), default="sales_rep")  # sales_rep, sales_manager, admin
    is_active = Column(Integer, default=1)  # 1 for True, 0 for False (SQLite compatible)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="users")
    deals = relationship("Deal", back_populates="owner")
    interactions = relationship("Interaction", back_populates="creator")

class Company(Base):
    __tablename__ = "companies"

    id = Column(String, primary_key=True, default=gen_uuid)
    organization_id = Column(String, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True, index=True)
    name = Column(String(255), nullable=False)
    industry = Column(String(100), default="Technology")
    website = Column(String(255), nullable=True)
    size = Column(String(100), default="100-500")
    location = Column(String(255), default="Bengaluru, India")
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="companies")
    contacts = relationship("Contact", back_populates="company", cascade="all, delete-orphan")
    deals = relationship("Deal", back_populates="company", cascade="all, delete-orphan")

class Contact(Base):
    __tablename__ = "contacts"

    id = Column(String, primary_key=True, default=gen_uuid)
    company_id = Column(String, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(String(100), default="Decision Maker")
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company", back_populates="contacts")

class Deal(Base):
    __tablename__ = "deals"

    id = Column(String, primary_key=True, default=gen_uuid)
    organization_id = Column(String, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True, index=True)
    company_id = Column(String, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    stage = Column(String(100), default="Discovery")  # Lead, Discovery, Qualified, Proposal, Negotiation, Closed Won, Closed Lost
    value = Column(Float, default=0.0)
    currency = Column(String(10), default="INR")  # INR (₹) or USD ($)
    probability = Column(Integer, default=50)
    expected_close_date = Column(DateTime, nullable=True)
    owner_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(50), default="active")  # active, won, lost
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = relationship("Organization", back_populates="deals")

    company = relationship("Company", back_populates="deals")
    owner = relationship("User", back_populates="deals")
    interactions = relationship("Interaction", back_populates="deal", cascade="all, delete-orphan", order_by="Interaction.occurred_at.asc()")
    tasks = relationship("Task", back_populates="deal", cascade="all, delete-orphan")

class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(String, primary_key=True, default=gen_uuid)
    deal_id = Column(String, ForeignKey("deals.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(50), default="Meeting")  # Call, Meeting, Email, Note, Demo, Proposal, Follow-up
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    participants = Column(String(255), default="Sales Rep, Client")
    outcome = Column(Text, nullable=True)
    next_steps = Column(Text, nullable=True)
    occurred_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    deal = relationship("Deal", back_populates="interactions")
    creator = relationship("User", back_populates="interactions")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(String, primary_key=True, default=gen_uuid)
    deal_id = Column(String, ForeignKey("deals.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(DateTime, nullable=True)
    status = Column(String(50), default="pending")  # pending, completed, cancelled
    priority = Column(String(50), default="medium")  # high, medium, low
    created_at = Column(DateTime, default=datetime.utcnow)

    deal = relationship("Deal", back_populates="tasks")
