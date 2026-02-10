"""Enum definitions matching SQL schema ENUM types."""

from enum import Enum


# --- Project Enums (from 001_project_creation_schema.sql) ---

class ProjectType(str, Enum):
    REPOSITORY = "repository"
    FILES = "files"
    MANUAL = "manual"


class ProjectStatus(str, Enum):
    DRAFT = "draft"
    PROCESSING = "processing"
    ACTIVE = "active"
    ERROR = "error"


class ProjectPrivacy(str, Enum):
    PRIVATE = "private"
    SHARED = "shared"


class ChunkingStrategy(str, Enum):
    SEMANTIC = "semantic"
    FIXED = "fixed"
    RECURSIVE = "recursive"
    CUSTOM = "custom"


class GitProvider(str, Enum):
    GITHUB = "github"
    GITLAB = "gitlab"
    BITBUCKET = "bitbucket"
    AZURE = "azure"


class RepositoryStatus(str, Enum):
    PENDING = "pending"
    CONNECTED = "connected"
    SYNCING = "syncing"
    ERROR = "error"


class ProjectMemberRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    DEVELOPER = "developer"
    VIEWER = "viewer"
    AUDITOR = "auditor"


class IngestionPhase(str, Enum):
    REPOSITORY_FETCH = "repository_fetch"
    PARSING = "parsing"
    CHUNKING = "chunking"
    OPTIMIZATION = "optimization"
    INDEXING = "indexing"


# --- Skill Enums (from 002_skills_tables.sql) ---

class SkillCategory(str, Enum):
    ANALYSIS = "analysis"
    GENERATION = "generation"
    TRANSFORMATION = "transformation"
    COMMUNICATION = "communication"
    AUTOMATION = "automation"
    CUSTOM = "custom"


class SkillOutputFormat(str, Enum):
    MARKDOWN = "markdown"
    JSON = "json"
    TEXT = "text"
    HTML = "html"
    CODE = "code"


class ExecutionStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ExecutionType(str, Enum):
    MANUAL = "manual"
    HABIT = "habit"
    REFLEX = "reflex"
    API = "api"


class ReflexTriggerType(str, Enum):
    WEBHOOK = "webhook"
    EMAIL = "email"
    FILE_CHANGE = "file_change"
    API_CALL = "api_call"
    SCHEDULE = "schedule"
    EVENT = "event"


# --- Billing Enums (from TypeScript types/settings/billing.ts) ---

class PlanTier(str, Enum):
    FREE = "free"
    PRO = "pro"
    TEAMS = "teams"
    ENTERPRISE = "enterprise"


class BillingInterval(str, Enum):
    MONTHLY = "monthly"
    ANNUALLY = "annually"


class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    PAST_DUE = "past_due"
    CANCELED = "canceled"
    TRIALING = "trialing"
    INCOMPLETE = "incomplete"


class PaymentMethodType(str, Enum):
    CARD = "card"
    IDEAL = "ideal"
    SEPA_DEBIT = "sepa_debit"
