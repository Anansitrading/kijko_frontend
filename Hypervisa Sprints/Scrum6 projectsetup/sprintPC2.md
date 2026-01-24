# Sprint PC2: Project Basics Modal (Step 1)

## Goal
Build the first step of the project creation wizard with project name, description, and type selection.

## Prerequisites Completed By This Sprint
- Project creation modal foundation ready
- Name validation with duplicate detection and suggestions
- Project type selection (Repository/Files/Manual)
- Navigation to Step 2 enabled

## Dependencies From Previous Sprints
- **Sprint PC1**: Database schema, TypeScript types, form state management

## Deliverables

### Feature 1: Project Creation Modal Shell
- **Description**: Create the modal component with header, close button, and multi-step navigation
- **Acceptance Criteria**:
  - [ ] Modal opens/closes correctly
  - [ ] Header shows "Nieuw project" with close (X) button
  - [ ] Step indicator shows current step (1 of 5)
  - [ ] Footer has "Annuleren" and "Volgende" buttons
  - [ ] Modal is responsive (mobile-friendly)
  - [ ] Keyboard accessible (Escape to close, Tab navigation)
- **Technical Notes**:
  ```
  ┌─────────────────────────────────────────────────────┐
  │ Nieuw project                              ✕       │
  ├─────────────────────────────────────────────────────┤
  │ [Step content here]                                 │
  │                                                     │
  │ [Annuleren]  [Volgende →]                          │
  └─────────────────────────────────────────────────────┘
  ```

### Feature 2: Project Name Field with Validation
- **Description**: Input field for project name with real-time duplicate checking and smart suggestions
- **Acceptance Criteria**:
  - [ ] Input field with placeholder "Bijv. Product Research Q4"
  - [ ] Character limit: min 3, max 50 characters
  - [ ] Real-time validation feedback (debounced 300ms)
  - [ ] Duplicate name detection via API call
  - [ ] Smart suggestion when duplicate found (e.g., "Product Research Q4 - Phase 2")
  - [ ] Error state styling (red border, error message)
  - [ ] Success state styling (green checkmark)
  - [ ] Helper text: "(Min 3 char, max 50 - focus op waarde)"
- **Technical Notes**:
  ```typescript
  // Validation logic
  const validateProjectName = async (name: string) => {
    if (name.length < 3) return { valid: false, error: 'Minimum 3 characters' };
    if (name.length > 50) return { valid: false, error: 'Maximum 50 characters' };

    const existing = await checkDuplicateName(name);
    if (existing) {
      return {
        valid: false,
        error: `"${name}" bestaat al`,
        suggestion: generateVariant(name) // e.g., "Name - Phase 2"
      };
    }
    return { valid: true };
  };
  ```

### Feature 3: Description Field (Optional)
- **Description**: Optional textarea for project description with character counter
- **Acceptance Criteria**:
  - [ ] Textarea with placeholder "Bijv. Analyse API docs & SDK patterns"
  - [ ] Character limit: max 200 characters
  - [ ] Character counter showing "X/200"
  - [ ] Helper text: "(Max 200 char - voor context)"
  - [ ] Field marked as optional in label
  - [ ] Auto-suggest based on recently analyzed repos (nice-to-have)
- **Technical Notes**: Description is used for project context, not required

### Feature 4: Project Type Selection
- **Description**: Radio button group to select project type
- **Acceptance Criteria**:
  - [ ] Three options: Repository (Git), Files, Manual
  - [ ] Radio button styling matches design system
  - [ ] Default selection based on user history (if available)
  - [ ] Selection persists in form state
  - [ ] Clear visual indication of selected option
  - [ ] Type determines which Step 2 variant to show
- **Technical Notes**:
  ```typescript
  type ProjectType = 'repository' | 'files' | 'manual';

  // Default based on persona (from Sprint PC6, but prepare logic)
  const getDefaultType = (persona: PersonaType): ProjectType => {
    // All personas default to 'repository' for now
    return 'repository';
  };
  ```

### Feature 5: Form Validation & Navigation
- **Description**: Validate Step 1 and enable navigation to Step 2
- **Acceptance Criteria**:
  - [ ] "Volgende" button disabled until form is valid
  - [ ] Validation runs on blur and on submit attempt
  - [ ] Form data saved to context/store on "Volgende"
  - [ ] "Annuleren" shows confirmation if form has changes
  - [ ] Loading state while validating name
  - [ ] Navigate to appropriate Step 2 based on type selection
- **Technical Notes**:
  ```typescript
  // Step 1 validation schema (zod)
  const step1Schema = z.object({
    name: z.string().min(3).max(50),
    description: z.string().max(200).optional(),
    type: z.enum(['repository', 'files', 'manual'])
  });
  ```

### Feature 6: API Endpoint - Check Duplicate Name
- **Description**: Backend endpoint to check if project name already exists
- **Acceptance Criteria**:
  - [ ] `GET /api/projects/check-name?name={name}&orgId={orgId}`
  - [ ] Returns `{ exists: boolean, suggestion?: string }`
  - [ ] Case-insensitive comparison
  - [ ] Scoped to organization
  - [ ] Response time < 200ms
- **Technical Notes**:
  ```typescript
  // Response type
  interface CheckNameResponse {
    exists: boolean;
    suggestion?: string; // Only if exists=true
  }
  ```

## Technical Considerations
- Use react-hook-form with zod for form management
- Debounce name validation API calls (300ms)
- Store form state in context for persistence across steps
- Consider accessibility: proper labels, aria attributes, focus management
- Modal should trap focus when open

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Modal opens from "New Project" button
- [ ] Form validation working correctly
- [ ] API endpoint tested and responding
- [ ] Navigation to Step 2 works based on type
- [ ] Unit tests for validation logic
- [ ] Component renders correctly on mobile

## Notes
- This is the entry point for all three persona flows
- Step 1 is identical for Alex, Maya, and Sam personas
- The type selection determines which Step 2 variant loads
- Keep the UI clean and simple - this step should take ~30 seconds
