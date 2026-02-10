# Plan 01-04 Summary: Keycloak Auth Middleware & Endpoints

## Status: COMPLETE ✅

## What Was Done

### Task 1: Keycloak Service & JWT Middleware — COMPLETE

**`server/app/services/keycloak.py` — KeycloakService class:**
- OIDC discovery endpoint fetch with endpoint auto-population
- JWKS key management: 1-hour TTL cache, auto-refresh on validation failure
- JWT validation: RS256, issuer, audience, expiry checks
- Claim extraction: sub, org_id, email, roles (with Keycloak-specific nesting)
- User operations: register_user, authenticate, refresh_token, logout
- OAuth: get_oauth_redirect_url (Google, GitHub via IdP brokering), exchange_code
- Admin token via client_credentials grant for user management

**`server/app/middleware/auth.py` — FastAPI dependencies:**
| Dependency | Purpose | Sets RLS? |
|------------|---------|-----------|
| `get_current_user` | Lightweight JWT validation | No |
| `require_auth` | JWT validation + RLS context injection | Yes |
| `get_optional_user` | Returns None if no token | No |
| `require_role(roles)` | Role-based access control | Yes (via require_auth) |
| `get_user_profile` | Claims → UserProfile model | Yes (via require_auth) |

**`server/app/models/auth.py` — Request/Response models:**
- LoginRequest (EmailStr + password min 8)
- SignupRequest (email, password, first_name, last_name)
- TokenResponse (access_token, refresh_token, token_type, expires_in)
- RefreshRequest, OAuthCallbackRequest, OAuthRedirectResponse

### Task 2: Auth Router & Tests — COMPLETE

**`server/app/routers/auth.py` — 7 endpoints wired into main app:**
| Endpoint | Method | Auth | Status |
|----------|--------|------|--------|
| `/api/v1/auth/signup` | POST | Public | 201 + tokens |
| `/api/v1/auth/login` | POST | Public | 200 + tokens |
| `/api/v1/auth/refresh` | POST | Public | 200 + new tokens |
| `/api/v1/auth/logout` | POST | Public | 204 |
| `/api/v1/auth/me` | GET | Protected | 200 + UserProfile |
| `/api/v1/auth/oauth/{provider}` | GET | Public | 200 + redirect URL |
| `/api/v1/auth/oauth/callback` | POST | Public | 200 + tokens |

**`server/app/main.py` updated:**
- Auth router included with API prefix
- OIDC discovery triggered at startup (non-blocking)
- Keycloak HTTP client closed on shutdown

**`server/tests/test_auth.py` — 18 tests, ALL PASSING:**
- TestAuthEndpoints (10): endpoint routing, mocked login/signup/refresh/logout, OAuth
- TestProtectedEndpoints (4): unauthenticated 401, authenticated 200, expired 401, health public
- TestAuthValidation (4): email format, password length, missing fields, name length

## Key Design Decisions
1. **OIDC Discovery first** — endpoints populated from discovery document, with fallback defaults
2. **JWKS rotation handling** — on validation failure, refresh keys once before rejecting token
3. **Dual auth levels** — `get_current_user` (lightweight) vs `require_auth` (sets RLS)
4. **OAuth via IdP brokering** — uses `kc_idp_hint` parameter to skip Keycloak login form
5. **Auto-login after signup** — register_user calls authenticate internally

## Dependencies Added
- `email-validator>=2.0.0` — for Pydantic EmailStr validation

## Commit
`aadcc39` — feat(01-04): add Keycloak auth middleware, endpoints, and tests
