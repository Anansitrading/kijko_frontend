# Pydantic models matching TypeScript interfaces and SQL schema
from server.app.models.base import BaseSchema, MessageResponse, PaginatedResponse, TimestampMixin
from server.app.models.enums import *  # noqa: F401,F403
from server.app.models.project import (
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
    ProjectWithRelations,
    RepositoryCreate,
    RepositoryResponse,
    MemberCreate,
    MemberResponse,
    MemberUpdate,
    BulkInviteRequest,
    IngestionProgressResponse,
    ProjectFileResponse,
    ProjectNameValidation,
    RepositoryUrlValidation,
)
from server.app.models.skill import (
    SkillCreate,
    SkillResponse,
    SkillUpdate,
    SkillWithRelations,
    SkillTestRequest,
    SkillExecuteRequest,
    SkillBulkAction,
    SkillExportResponse,
)
from server.app.models.habit import (
    HabitCreate,
    HabitResponse,
    HabitUpdate,
    HabitWithSkill,
    HabitStats,
    CronValidationRequest,
    CronValidationResponse,
)
from server.app.models.reflex import (
    ReflexCreate,
    ReflexResponse,
    ReflexUpdate,
    ReflexWithSkill,
    ReflexTestRequest,
    ReflexWebhookInfo,
    ReflexStats,
)
from server.app.models.execution import (
    SkillExecutionResponse,
    ExecutionListFilter,
    ExecutionStats,
    ExecutionStatsBySkill,
    ExecutionStatsByPeriod,
)
from server.app.models.billing import (
    Plan,
    PlanLimits,
    Subscription,
    SubscriptionCreateRequest,
    SubscriptionUpdateRequest,
    PaymentMethod,
    PaymentMethodCreateRequest,
    Invoice,
    UsageMetric,
    UsageOverview,
    BillingDetails,
    BillingDetailsUpdate,
    BtwValidationResult,
    CheckoutSessionResponse,
)
from server.app.models.user import UserProfile, UserSearchResult

# Resolve forward references now that all models are imported
SkillWithRelations.model_rebuild()
