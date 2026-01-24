# PRD: Role-Based Project Creation Modal

**Version:** 1.0  
**Date:** January 24, 2026  
**Status:** Draft for Review

## 1. Overview

### Objective
Implementeer role-based differentiation in de project creation modal op basis van de gebruikersrol die tijdens de onboarding intake wordt geselecteerd en opgeslagen in Settings > My Profile > Role & Preferences.

### Scope
- Settings profile integratie voor role opslag
- Modal UI/UX adaptatie per persona
- Default configuraties per rol
- Template filtering op basis van rol

---

## 2. User Roles & Personas

### 2.1 The Vibecoder (VIBECODER)
**Role:** Solo Developer / Freelance Full-Stack Developer / Solo Founder

**Kenmerken:**
- Werkt alleen, bouwt eigen SaaS producten
- 3-5 jaar development ervaring
- 8-12 maanden intensive LLM gebruik
- Hoge prijsgevoeligheid
- Beslissnelheid: 1-7 dagen

**Primary Pain Points:**
- Context window vult te snel
- Token anxiety en kosten-bewustzijn
- Repetitieve uitleg aan AI assistants
- Tijd kwijt aan fixing hallucinations (~50% van tijd)

**Job-to-be-Done:**  
"When I'm building a feature, I want to give my LLM perfect context about my codebase, so that I get production-ready code the first time without burning through my token budget."

---

### 2.2 The Enterprise Engineer (ENTERPRISE_ENGINEER)
**Role:** Software Engineer in Scale-up/Enterprise Teams (15-100 developers)

**Kenmerken:**
- Werkt in teams van 5-12 engineers
- 8+ jaar development ervaring
- 1-2 jaar LLM tooling gebruik
- Medium prijsgevoeligheid (team ROI focus)
- Beslissnelheid: 1-3 maanden

**Primary Pain Points:**
- Knowledge silos binnen het team
- Stale context door outdated code
- Nieuwe developers hebben 2+ maanden nodig om productive te worden
- Team verbrandt €5K/maand aan duplicate context

**Job-to-be-Done:**  
"When a team member asks the LLM to refactor legacy code, I want it to understand our entire system architecture and recent changes, so that we ship consistent, high-quality code without manual code reviews catching basic mistakes."

---

### 2.3 AI-Native Builder (AI_NATIVE_BUILDER)
**Role:** AI Engineer / Agent Builder / Technical Founder

**Kenmerken:**
- Werkt solo of in zeer klein team (2-4)
- 2+ jaar daily, deep LLM experimentation
- Bouwt AI-first producten
- Lage prijsgevoeligheid (technical superiority focus)
- Beslissnelheid: Instant (test dezelfde dag)

**Primary Pain Points:**
- MCP tool explosion (50+ tools)
- Performance degradation bij >100K tokens
- Tool discovery paradox
- Orchestration at scale breekt

**Job-to-be-Done:**  
"When I'm orchestrating multi-step agent workflows, I want intelligent tool routing without loading every tool definition into context, so that my agents make better decisions 10x faster at 1/10th the cost."

---

## 3. Technical Requirements

### 3.1 Data Model

**Database Schema:**
```sql
ALTER TABLE user_profiles 
ADD COLUMN role VARCHAR(50) 
CHECK (role IN ('VIBECODER', 'ENTERPRISE_ENGINEER', 'AI_NATIVE_BUILDER'));
```

**Prisma Alternative:**
```prisma
enum UserRole {
  VIBECODER
  ENTERPRISE_ENGINEER
  AI_NATIVE_BUILDER
}

model UserProfile {
  id        String   @id @default(uuid())
  role      UserRole
  // ... other fields
}
```

**Storage Location:**
- Table: `user_profiles`
- Field: `role`
- Type: `enum`
- Nullable: `false`
- Set during: `onboarding_intake`

### 3.2 API Endpoints

**GET /api/user/profile/role**
```typescript
Response: {
  role: 'VIBECODER' | 'ENTERPRISE_ENGINEER' | 'AI_NATIVE_BUILDER',
  role_config: RoleConfiguration
}
```

**PATCH /api/user/profile/role**
```typescript
Body: {
  role: 'VIBECODER' | 'ENTERPRISE_ENGINEER' | 'AI_NATIVE_BUILDER'
}
Auth: Required
Response: {
  success: boolean,
  role: UserRole
}
```

---

## 4. Modal Configuration Per Role

### 4.1 VIBECODER Modal Configuration

**UI Emphasis:** Speed & Efficiency

**Modal Header:**
- Title: "Create Your Project"
- Subtitle: "Get production-ready code faster"

**Default Settings:**
```json
{
  "repository_type": "single",
  "max_repositories": 1,
  "context_optimization": "aggressive",
  "token_limit_warning": true,
  "cost_tracking_visible": true,
  "template_category": "mvp_templates"
}
```

**Visible Sections:**
- ✅ Project name
- ✅ Repository connection (single)
- ✅ Quick start templates
- ✅ Token optimization settings
- ✅ Cost estimate

**Hidden Sections:**
- ❌ Team collaboration
- ❌ Advanced MCP config
- ❌ Multi-repo setup
- ❌ Enterprise security

**Preset Templates:**
1. **SaaS MVP**  
   Full-stack starter with authentication  
   Stack: Next.js, Supabase, Tailwind

2. **Landing Page + Backend**  
   Quick launch setup  
   Stack: React, Node.js, PostgreSQL

3. **API-First Product**  
   Backend-focused architecture  
   Stack: FastAPI, Redis, PostgreSQL

**CTA Messaging:**
- Button: "Create Project"
- Value prop: "Save 50% on token costs with optimized context"
- Tooltip: "Pre-configured for solo developers to ship faster"

**Onboarding Hints:**
- "We'll automatically optimize your context window"
- "Token usage tracking keeps you within budget"
- "One-shot code generation reduces back-and-forth"

---

### 4.2 ENTERPRISE_ENGINEER Modal Configuration

**UI Emphasis:** Collaboration & Security

**Modal Header:**
- Title: "Create Team Project"
- Subtitle: "Accelerate team velocity and knowledge sharing"

**Default Settings:**
```json
{
  "repository_type": "multi",
  "max_repositories": 10,
  "context_optimization": "balanced",
  "token_limit_warning": false,
  "team_sharing_enabled": true,
  "git_integration_priority": true,
  "ci_cd_hooks": true,
  "template_category": "enterprise_templates"
}
```

**Visible Sections:**
- ✅ Project name
- ✅ Team members invite
- ✅ Multi-repository setup
- ✅ Git integration
- ✅ CI/CD configuration
- ✅ Security settings
- ✅ Knowledge base import

**Hidden Sections:**
- ❌ Cost estimate (focus op team ROI)
- ❌ Experimental features
- ❌ MCP server advanced

**Preset Templates:**
1. **Microservices Architecture**  
   Multi-repo enterprise setup  
   Stack: Docker, Kubernetes, Multiple repos

2. **Legacy Code Modernization**  
   Map and refactor existing codebases  
   Stack: Code mapping, Documentation generation

3. **Monorepo with Shared Libraries**  
   Team-wide code sharing  
   Stack: Nx, Turborepo, Shared packages

**CTA Messaging:**
- Button: "Setup Team Project"
- Value prop: "Reduce onboarding time from 2 months to 2 weeks"
- Tooltip: "Includes team collaboration and security features"

**Onboarding Hints:**
- "Invite team members to share project context"
- "Real-time sync with your Git repositories"
- "Security and compliance built-in for enterprise"

---

### 4.3 AI_NATIVE_BUILDER Modal Configuration

**UI Emphasis:** Technical Superiority

**Modal Header:**
- Title: "Initialize AI-Native Project"
- Subtitle: "Advanced orchestration for multi-agent systems"

**Default Settings:**
```json
{
  "repository_type": "flexible",
  "max_repositories": "unlimited",
  "context_optimization": "custom",
  "token_limit_warning": false,
  "experimental_features_enabled": true,
  "mcp_server_config": "advanced",
  "agent_routing_enabled": true,
  "performance_monitoring": true,
  "template_category": "ai_native_templates"
}
```

**Visible Sections:**
- ✅ Project name
- ✅ Architecture selection
- ✅ MCP server configuration
- ✅ Multi-agent workflow
- ✅ Tool routing strategy
- ✅ Performance settings
- ✅ API configuration
- ✅ Custom prompts
- ✅ Experimental features

**Hidden Sections:**
- None (alle features beschikbaar)

**Preset Templates:**
1. **Multi-Agent Orchestration**  
   Complex agent coordination system  
   Stack: MCP, Tool routing, State management

2. **Intelligent Tool Router**  
   Solve the tool discovery paradox  
   Stack: Dynamic tool loading, Context optimization

3. **Production Agent Pipeline**  
   Scalable AI-first architecture  
   Stack: Agent mesh, Monitoring, A/B testing

**CTA Messaging:**
- Button: "Initialize Project"
- Value prop: "10x faster agent decisions at 1/10th the cost"
- Tooltip: "Full control over advanced AI orchestration"

**Onboarding Hints:**
- "Configure intelligent routing for 50+ tools"
- "Performance optimized for >100K token contexts"
- "Experimental features unlocked by default"

---

## 5. Implementation Guide

### Phase 1: Data Layer (1-2 days)

**Tasks:**

1. **Database Migration**
   - Add role enum field to `user_profiles` table
   - Files to modify: `migrations/`, `schema.prisma`

2. **Create Role Configuration**
   - Store role configs in `config/role_configurations.json` or `lib/roleConfigs.ts`

3. **API Endpoints**
   - Create GET and PATCH endpoints for user role
   - Files to create: `api/user/profile/role.ts`

---

### Phase 2: Onboarding Integration (2-3 days)

**Tasks:**

1. **Update Intake Flow**
   - Component: `OnboardingIntakeFlow.tsx`
   - Requirements:
     - Display all 3 role options met descriptions
     - Visual cards showing persona characteristics
     - Save selection to database on completion
     - Cannot skip this step

2. **Settings UI Update**
   - Component: `SettingsMyProfile.tsx`
   - Requirements:
     - Dropdown matching screenshot format
     - Show current role
     - Allow role changes with confirmation modal

---

### Phase 3: Modal Adaptation (4-5 days)

**Tasks:**

1. **Create Role-Based Modal Component**
   - Component: `ProjectCreationModal.tsx`
   - Architecture:
     - Load user role on modal open
     - Fetch corresponding role configuration
     - Conditionally render sections based on `visible_sections`
     - Apply default settings from role config
     - Show role-specific templates

2. **Implement Conditional Sections**
   - `BasicProjectInfo.tsx` (alle rollen)
   - `TeamCollaborationSection.tsx` (Enterprise only)
   - `MCPAdvancedConfig.tsx` (AI-Native only)
   - `CostOptimizationSection.tsx` (Vibecoder only)
   - `TemplateSelector.tsx` (role-filtered)

3. **Build Template Filtering System**
   - Filter templates by role category
   - Logic: Match `template.category` with `role.template_category`

---

### Phase 4: Testing & Refinement (2-3 days)

**Test Cases:**

1. **Vibecoder Path**
   - Complete onboarding as Vibecoder
   - Open project creation modal
   - Verify: Simplified UI, single repo, cost tracking visible
   - Verify: Team features hidden, advanced MCP hidden

2. **Enterprise Engineer Path**
   - Complete onboarding as Enterprise Engineer
   - Open project creation modal
   - Verify: Team invite visible, multi-repo options
   - Verify: Cost tracking de-emphasized

3. **AI-Native Builder Path**
   - Complete onboarding as AI-Native Builder
   - Verify: All advanced features visible

4. **Role Switching**
   - Change role in Settings
   - Verify: Modal adapts immediately

---

## 6. Component Architecture

### 6.1 Core Hook: useUserRole

```typescript
// hooks/useUserRole.ts
import { useState, useEffect } from 'react';
import { UserRole } from '@/types';

export function useUserRole() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchRole() {
      try {
        const response = await fetch('/api/user/profile/role');
        if (!response.ok) throw new Error('Failed to fetch role');
        const data = await response.json();
        setRole(data.role);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }
    fetchRole();
  }, []);

  return { role, loading, error };
}
```

### 6.2 Role Configuration

```typescript
// config/roleConfigurations.ts
import { UserRole, RoleConfiguration } from '@/types';

export const ROLE_CONFIGURATIONS: Record<UserRole, RoleConfiguration> = {
  VIBECODER: {
    modal_title: "Create Your Project",
    modal_subtitle: "Get production-ready code faster",
    ui_emphasis: "speed_and_efficiency",
    default_settings: {
      repository_type: "single",
      max_repositories: 1,
      context_optimization: "aggressive",
      token_limit_warning: true,
      cost_tracking_visible: true,
    },
    visible_sections: [
      "project_name",
      "repository_connection",
      "quick_start_templates",
      "token_optimization_settings",
      "cost_estimate",
    ],
    hidden_sections: [
      "team_collaboration",
      "advanced_mcp_config",
      "multi_repo_setup",
      "enterprise_security",
    ],
    preset_templates: [
      {
        id: "saas-mvp",
        name: "SaaS MVP",
        description: "Full-stack starter with authentication",
        stack: ["Next.js", "Supabase", "Tailwind"],
      },
      // ... more templates
    ],
    cta_messaging: {
      primary_button: "Create Project",
      value_prop: "Save 50% on token costs with optimized context",
      tooltip: "Pre-configured for solo developers to ship faster",
    },
    onboarding_hints: [
      "We'll automatically optimize your context window",
      "Token usage tracking keeps you within budget",
      "One-shot code generation reduces back-and-forth",
    ],
  },

  ENTERPRISE_ENGINEER: {
    // ... Enterprise config
    modal_title: "Create Team Project",
    modal_subtitle: "Accelerate team velocity and knowledge sharing",
    // ... rest of config
  },

  AI_NATIVE_BUILDER: {
    // ... AI-Native config
    modal_title: "Initialize AI-Native Project",
    modal_subtitle: "Advanced orchestration for multi-agent systems",
    // ... rest of config
  },
};

export function getRoleConfiguration(role: UserRole): RoleConfiguration {
  return ROLE_CONFIGURATIONS[role] || ROLE_CONFIGURATIONS.VIBECODER;
}
```

### 6.3 Main Modal Component

```typescript
// components/ProjectCreationModal.tsx
import { useUserRole } from '@/hooks/useUserRole';
import { getRoleConfiguration } from '@/config/roleConfigurations';
import { useState } from 'react';

interface ProjectCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectCreationModal({ isOpen, onClose }: ProjectCreationModalProps) {
  const { role, loading } = useUserRole();

  if (loading) return <LoadingSpinner />;
  if (!role) return <ErrorState message="Could not load user role" />;

  const roleConfig = getRoleConfiguration(role);
  const {
    modal_title,
    modal_subtitle,
    default_settings,
    visible_sections,
    preset_templates,
    cta_messaging,
    onboarding_hints,
  } = roleConfig;

  const [formData, setFormData] = useState(default_settings);

  const handleCreate = async () => {
    // Create project with formData
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="large">
      <ModalHeader>
        <h2 className="text-2xl font-bold">{modal_title}</h2>
        <p className="text-gray-600">{modal_subtitle}</p>
      </ModalHeader>

      <ModalBody>
        {/* Always visible */}
        <ProjectBasicInfo 
          data={formData} 
          onChange={setFormData} 
        />

        {/* Conditional sections */}
        {visible_sections.includes('team_members_invite') && (
          <TeamMembersSection 
            data={formData} 
            onChange={setFormData} 
          />
        )}

        {visible_sections.includes('token_optimization_settings') && (
          <TokenOptimizationSection 
            data={formData} 
            onChange={setFormData} 
          />
        )}

        {visible_sections.includes('mcp_server_configuration') && (
          <MCPServerConfig 
            data={formData} 
            onChange={setFormData} 
          />
        )}

        {visible_sections.includes('multi_repository_setup') && (
          <MultiRepositorySetup 
            data={formData} 
            onChange={setFormData}
            maxRepos={default_settings.max_repositories}
          />
        )}

        {/* Template selection */}
        <TemplateSelector 
          templates={preset_templates}
          selected={formData.template}
          onSelect={(template) => setFormData({...formData, template})}
        />

        {/* Onboarding hints */}
        <OnboardingHints hints={onboarding_hints} />
      </ModalBody>

      <ModalFooter>
        <div className="flex items-center justify-between w-full">
          <ValueProposition text={cta_messaging.value_prop} />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleCreate}
              tooltip={cta_messaging.tooltip}
            >
              {cta_messaging.primary_button}
            </Button>
          </div>
        </div>
      </ModalFooter>
    </Modal>
  );
}
```

---

## 7. Feature Comparison Matrix

| Feature | Vibecoder | Enterprise Engineer | AI-Native Builder |
|---------|-----------|---------------------|-------------------|
| **Max Repositories** | 1 | 10 | Unlimited |
| **Team Collaboration** | ❌ Hidden | ✅ Prominent | ⚙️ Available |
| **Cost Tracking** | ✅ Always visible | 📊 ROI-focused | ❌ Hidden |
| **Token Optimization** | ✅ Aggressive | ⚙️ Balanced | ⚙️ Custom |
| **Git/CI-CD Integration** | ⚙️ Basic | ✅ Priority | ✅ Advanced |
| **MCP Server Config** | ❌ Hidden | ❌ Hidden | ✅ Full access |
| **Multi-Agent Workflows** | ❌ Hidden | ❌ Hidden | ✅ Available |
| **Experimental Features** | ❌ Disabled | ❌ Disabled | ✅ Enabled |
| **Template Focus** | MVP & Launch | Enterprise patterns | AI orchestration |
| **Security Settings** | ⚙️ Basic | ✅ Prominent | ⚙️ Advanced |
| **Performance Monitoring** | ❌ Hidden | ⚙️ Available | ✅ Prominent |
| **API Configuration** | ⚙️ Basic | ⚙️ Standard | ✅ Full control |

**Legend:**
- ✅ = Prominently featured
- ⚙️ = Available but not emphasized
- ❌ = Hidden/disabled
- 📊 = Different presentation

---

## 8. Success Metrics

### Per Role KPIs

**Vibecoder:**
- Time to first project creation < 2 minutes
- Token cost reduction of 30%+ vs. unoptimized setup
- 80%+ choose MVP templates

**Enterprise Engineer:**
- Team onboarding time reduction (baseline vs. optimized)
- Number of team members invited per project
- Multi-repo adoption rate > 60%

**AI-Native Builder:**
- MCP server configuration completion rate
- Advanced features utilization > 70%
- Performance settings customization rate

### Overall Metrics
- Role selection completion rate during onboarding: 100%
- Project creation completion rate per role: > 85%
- Role switching rate in Settings: < 10%
- User satisfaction score per role path: > 4.5/5

---

## 9. TypeScript Types

```typescript
// types/role.ts
export type UserRole = 
  | 'VIBECODER' 
  | 'ENTERPRISE_ENGINEER' 
  | 'AI_NATIVE_BUILDER';

export interface RoleConfiguration {
  modal_title: string;
  modal_subtitle: string;
  ui_emphasis: string;
  default_settings: ProjectDefaultSettings;
  visible_sections: string[];
  hidden_sections: string[];
  preset_templates: Template[];
  cta_messaging: CTAMessaging;
  onboarding_hints: string[];
}

export interface ProjectDefaultSettings {
  repository_type: 'single' | 'multi' | 'flexible';
  max_repositories: number | 'unlimited';
  context_optimization: 'aggressive' | 'balanced' | 'custom';
  token_limit_warning: boolean;
  cost_tracking_visible?: boolean;
  team_sharing_enabled?: boolean;
  git_integration_priority?: boolean;
  ci_cd_hooks?: boolean;
  experimental_features_enabled?: boolean;
  mcp_server_config?: 'basic' | 'advanced';
  agent_routing_enabled?: boolean;
  performance_monitoring?: boolean;
  template_category: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  stack: string[];
  category?: string;
}

export interface CTAMessaging {
  primary_button: string;
  value_prop: string;
  tooltip: string;
}
```

---

## 10. Open Questions

1. **Role Change Handling:** What happens to existing projects when user changes role?
2. **Default Role:** Fallback behavior if role not set?
3. **Role Visibility:** Should we show role badge in UI?
4. **Mixed Teams:** How to handle Enterprise projects with AI-Native builders?
5. **A/B Testing:** Should we A/B test different template sets?

---

## 11. Future Enhancements (Phase 2)

- Dynamic role recommendations based on usage patterns
- Hybrid roles with custom configurations
- Project-level role overrides
- Team role distribution analytics
- Template marketplace per role
- Onboarding path optimization

---

**References:**
- User Research: Users_Guide_Engineering-2.pdf
- Settings UI: image.jpg
- Personas: Alex, Maya, Sam

---

**Total Estimated Timeline:** 9-13 days
**Priority:** High
**Dependencies:** Onboarding flow, Settings UI, Project creation system
