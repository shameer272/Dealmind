from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from enum import Enum

class MemoryType(str, Enum):
    CUSTOMER_PROFILE = "CUSTOMER_PROFILE"
    DEAL_CONTEXT = "DEAL_CONTEXT"
    PAIN_POINT = "PAIN_POINT"
    OBJECTION = "OBJECTION"
    PREFERENCE = "PREFERENCE"
    COMPETITOR = "COMPETITOR"
    BUDGET = "BUDGET"
    TIMELINE = "TIMELINE"
    STAKEHOLDER = "STAKEHOLDER"
    COMMITMENT = "COMMITMENT"
    FOLLOW_UP = "FOLLOW_UP"
    SUCCESS_PATTERN = "SUCCESS_PATTERN"
    FAILURE_PATTERN = "FAILURE_PATTERN"

# Organization
class OrganizationBase(BaseModel):
    name: str

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationResponse(OrganizationBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    created_at: datetime

# Base User
class UserBase(BaseModel):
    name: str
    email: str
    role: str = "sales_rep"  # sales_rep, sales_manager, admin

class UserRegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    confirm_password: str
    company_name: str
    role: Optional[str] = "sales_rep"

class UserLoginRequest(BaseModel):
    email: str
    password: str

class UserCreate(UserBase):
    password: str
    organization_id: Optional[str] = None

class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    organization_id: Optional[str] = None
    organization_name: Optional[str] = None
    is_active: bool = True
    created_at: datetime

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    organization: Optional[OrganizationResponse] = None

# Contact
class ContactBase(BaseModel):
    name: str
    role: str = "Decision Maker"
    email: Optional[str] = None
    phone: Optional[str] = None

class ContactCreate(ContactBase):
    company_id: str

class ContactResponse(ContactBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    company_id: str
    created_at: datetime

# Company
class CompanyBase(BaseModel):
    name: str
    industry: str = "Technology"
    website: Optional[str] = None
    size: str = "100-500"
    location: str = "Bengaluru, India"

class CompanyCreate(CompanyBase):
    pass

class CompanyResponse(CompanyBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    created_at: datetime
    contacts: List[ContactResponse] = []

# Deal
class DealBase(BaseModel):
    name: str
    stage: str = "Discovery"
    value: float = 0.0
    currency: str = "INR"
    probability: int = 50
    expected_close_date: Optional[datetime] = None
    status: str = "active"

class DealCreate(DealBase):
    company_id: Optional[str] = None
    owner_id: Optional[str] = None
    company_name: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    size: Optional[str] = None
    location: Optional[str] = None
    primary_contact_name: Optional[str] = None
    primary_contact_email: Optional[str] = None

class DealUpdate(BaseModel):
    name: Optional[str] = None
    stage: Optional[str] = None
    value: Optional[float] = None
    currency: Optional[str] = None
    probability: Optional[int] = None
    expected_close_date: Optional[datetime] = None
    status: Optional[str] = None

class DealResponse(DealBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    organization_id: Optional[str] = None
    company_id: str
    owner_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    company: Optional[CompanyResponse] = None

# Interaction
class InteractionBase(BaseModel):
    type: str = "Meeting"  # Call, Meeting, Email, Note, Demo, Proposal, Follow-up
    title: str
    content: str
    participants: Optional[str] = "Sales Rep, Client"
    outcome: Optional[str] = None
    next_steps: Optional[str] = None
    occurred_at: Optional[datetime] = None

class InteractionCreate(InteractionBase):
    deal_id: str

class InteractionResponse(InteractionBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    deal_id: str
    created_by: Optional[str] = None
    created_at: datetime
    occurred_at: datetime

# Task
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    status: str = "pending"
    priority: str = "medium"

class TaskCreate(TaskBase):
    deal_id: str

class TaskResponse(TaskBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    deal_id: str
    created_at: datetime

# Hindsight Memory Models
class MemoryItem(BaseModel):
    id: str
    deal_id: str
    company_id: Optional[str] = None
    memory_type: MemoryType
    fact: str
    importance: str = "medium"  # low, medium, high, critical
    source_interaction_id: Optional[str] = None
    source_title: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    confidence: float = 0.95
    tags: List[str] = []

class MemorySearchRequest(BaseModel):
    query: str
    deal_id: Optional[str] = None
    memory_types: Optional[List[MemoryType]] = None
    top_k: int = 10

class MemorySearchResult(BaseModel):
    query: str
    total_memories: int
    memories: List[MemoryItem]

# Structured AI Output Models
class ExtractedFact(BaseModel):
    memory_type: MemoryType
    fact: str
    importance: str = "medium"
    confidence: float = 0.95
    tags: List[str] = []

class InteractionAnalysisResult(BaseModel):
    summary: str
    extracted_facts: List[ExtractedFact]
    customer_sentiment: str = "Neutral"
    objections_detected: List[str] = []
    competitors_mentioned: List[str] = []
    budget_insights: Optional[str] = None
    commitments_made: List[str] = []
    recommended_next_step: str

class MeetingBriefRequest(BaseModel):
    deal_id: str
    meeting_objective: str = "Upcoming sales alignment and objection resolution"
    contact_name: Optional[str] = None

class MemorySourceRef(BaseModel):
    memory_type: str
    fact: str
    source_interaction: Optional[str] = None
    occurred_at: Optional[str] = None

class MeetingBriefResponse(BaseModel):
    deal_id: str
    company_name: str
    deal_value_formatted: str
    stage: str
    customer_snapshot: Dict[str, Any]
    what_they_care_about: List[str]
    previous_objections: List[str]
    competitors: List[str]
    unresolved_commitments: List[str]
    recommended_talking_points: List[str]
    risks: List[str]
    suggested_next_step: str
    why_explanation: str
    memory_sources: List[MemorySourceRef]

class FollowUpRequest(BaseModel):
    deal_id: str
    interaction_id: Optional[str] = None
    tone: str = "Professional & consultative"

class FollowUpResponse(BaseModel):
    subject: str
    body: str
    addressed_points: List[str]
    commitments_included: List[str]
    memory_references_used: List[str]

class ObjectionDetail(BaseModel):
    category: str  # Pricing, Integration, Security, Timeline, ROI
    severity: str  # High, Medium, Low
    frequency: int
    first_detected: Optional[str] = None
    last_detected: Optional[str] = None
    related_interactions: List[str]
    sales_response_used: str
    resolution_status: str  # Resolved, Open, At Risk
    ai_recommendation: str
    why_explanation: str

class ObjectionRadarResponse(BaseModel):
    deal_id: str
    objections: List[ObjectionDetail]

class HealthFactor(BaseModel):
    name: str
    status: str  # positive, warning, negative
    weight: int
    details: str

class DealHealthResponse(BaseModel):
    deal_id: str
    score: int
    status_label: str  # Excellent, Healthy, Caution, At Risk
    summary: str
    factors: List[HealthFactor]
    why_explanation: str

class MemoryComparisonResponse(BaseModel):
    query: str
    deal_id: str
    deal_name: str
    without_memory_response: str
    with_memory_response: str
    key_memory_differentiators: List[str]
    retrieved_memory_count: int
    memory_highlights: List[MemorySourceRef]
