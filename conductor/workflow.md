# KIJKO - Development Workflow

## Development Methodology

**Approach**: Hybrid (TDD for critical logic, Feature-first for UI)

### When to Use TDD

Apply Test-Driven Development for:
- Service layer functions (API calls, data transformation)
- Utility functions with complex logic
- State management logic
- Business rules and validation

### When to Use Feature-First

Apply Feature-first development for:
- UI components and layouts
- Styling changes
- Rapid prototyping
- Visual feedback iterations

## Task Execution Protocol

### For Each Task

1. **Read Spec**: Understand requirements from spec.md
2. **Identify Approach**: TDD or Feature-first based on task type
3. **Implement**: Follow the appropriate workflow below
4. **Verify**: Run tests and manual checks
5. **Commit**: Use conventional commit format
6. **Update Plan**: Mark task complete with commit SHA

### TDD Workflow (for services/logic)

```
1. RED    - Write failing test
2. GREEN  - Implement minimum code to pass
3. REFACTOR - Clean up without changing behavior
4. COMMIT - "test: add tests for X" then "feat: implement X"
```

### Feature-First Workflow (for UI)

```
1. IMPLEMENT - Build the component/feature
2. VERIFY    - Manual testing in browser
3. TEST      - Add tests for critical interactions
4. COMMIT    - "feat: add X component"
```

## Commit Convention

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `style` | Code style (formatting, no logic change) |
| `refactor` | Code restructuring |
| `test` | Adding/updating tests |
| `chore` | Maintenance tasks |
| `conductor` | Conductor-specific updates |

### Examples

```bash
feat(chat): add voice input support
fix(sidebar): correct mobile menu z-index
refactor(agents): extract agent card component
conductor(plan): mark task complete [abc123]
```

## Phase Completion Protocol

When completing a phase in plan.md:

### 1. Ensure Coverage

- All new functions have tests (for TDD tasks)
- All UI changes manually verified
- No TypeScript errors
- No ESLint warnings

### 2. Run Verification

```bash
npm run build          # Ensure production build works
# npm run test         # When tests are configured
```

### 3. Manual Verification

Create a verification checklist:
- [ ] Feature works as specified
- [ ] No console errors
- [ ] Responsive design works
- [ ] Dark mode compatible

### 4. Create Checkpoint

```bash
git add .
git commit -m "conductor(checkpoint): phase N complete"
git notes add -m "Phase N verification report: [details]"
```

### 5. Update Plan

Add checkpoint marker to phase heading:
```markdown
## Phase 1: Foundation [checkpoint: abc1234]
```

## Code Quality Standards

### TypeScript

- Strict mode enabled
- No `any` types (use `unknown` if needed)
- Explicit return types on exported functions
- Interface over type for objects

### React

- Functional components only
- Custom hooks for reusable logic
- Props destructuring
- Memoization only when needed

### Styling

- Tailwind utilities preferred
- Custom CSS only for complex animations
- Use `cn()` for conditional classes
- Follow design system colors

## File Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ChatInterface.tsx` |
| Hooks | camelCase with use | `useVoiceInput.ts` |
| Utils | camelCase | `formatDate.ts` |
| Types | PascalCase | `types.ts` |
| Services | camelCase + Service | `geminiService.ts` |

## Branch Strategy

```
main           - Production-ready code
feature/*      - New features
fix/*          - Bug fixes
refactor/*     - Code improvements
```

## Documentation Updates

After completing a track:
- Update tech-stack.md if new dependencies added
- Update product.md if features changed
- Update README.md if setup steps changed
