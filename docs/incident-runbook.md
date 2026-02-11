# Kijko Incident Response Runbook

## 1. Classification

| Severity | Description | Response Time | Example |
|----------|-------------|---------------|---------|
| SEV-1 | Data breach / complete outage | 15 min | Database leak, auth bypass |
| SEV-2 | Major feature broken | 1 hour | Payments failing, AI queries down |
| SEV-3 | Minor issue | 4 hours | Slow queries, UI glitch |

## 2. Data Breach Response (GDPR Art. 33-34)

### Timeline: 72 Hours Max

```
T+0h    Breach detected
        └─ Isolate affected systems
        └─ Preserve evidence (logs, access records)

T+1h    Initial assessment
        └─ What data? How many users? How did it happen?
        └─ Notify engineering lead

T+4h    Containment
        └─ Rotate affected credentials
        └─ Patch vulnerability
        └─ Deploy fix

T+24h   Impact report
        └─ Full scope of breach documented
        └─ List of affected users compiled

T+48h   Prepare AP notification
        └─ Draft notification for Autoriteit Persoonsgegevens

T+72h   DEADLINE: Notify AP
        └─ Submit to autoriteitpersoonsgegevens.nl
        └─ If high risk to individuals: notify affected users
```

### AP Notification Must Include (Art. 33.3)

1. Nature of the breach (what data, how many records/users)
2. Contact details of DPO or contact point
3. Likely consequences of the breach
4. Measures taken or proposed to address the breach

### User Notification Required If (Art. 34)

- Breach likely results in high risk to rights and freedoms
- Unless data was encrypted/anonymized or risk is mitigated

## 3. Service Outage Response

```bash
# 1. Check service health
curl https://api.kijko.nl/health
curl https://api.kijko.nl/health/ready

# 2. Check Docker containers
docker compose ps
docker compose logs --tail=100 api

# 3. Check database
psql -h localhost -p 6543 -U postgres.f3785d7e46355517 -d postgres -c "SELECT 1"

# 4. Check Keycloak
curl https://auth.kijko.nl/realms/kijko/.well-known/openid-configuration

# 5. Restart services
docker compose restart api
docker compose restart keycloak
```

## 4. Credential Rotation

### Supabase Keys

```bash
# Generate new JWT secret
openssl rand -hex 32

# Update in supabase-selfhost/.env:
# JWT_SECRET=<new>
# Regenerate ANON_KEY and SERVICE_ROLE_KEY with new secret

# Update in Kijko-MVP/server/.env
# Restart services
```

### Stripe Keys

1. Go to Stripe Dashboard > Developers > API Keys
2. Roll the secret key
3. Update `STRIPE_SECRET_KEY` in server/.env
4. Update webhook signing secret
5. Restart backend

## 5. Communication Templates

### Internal (Zulip)

```
🔴 INCIDENT: [brief description]
Severity: SEV-[1/2/3]
Status: [investigating/identified/monitoring/resolved]
Impact: [who/what is affected]
Next update: [time]
```

### User Notification (if required)

```
Beste [naam],

Wij informeren u dat op [datum] een beveiligingsincident heeft plaatsgevonden
waarbij [type gegevens] mogelijk zijn blootgesteld.

Getroffen gegevens: [lijst]
Maatregelen genomen: [lijst]
Wat u kunt doen: [acties]

Onze excuses voor het ongemak. Neem contact op via privacy@kijko.nl bij vragen.

Met vriendelijke groet,
Kijko B.V.
```

## 6. Post-Incident

- [ ] Root cause analysis (RCA) document within 5 business days
- [ ] Timeline of events documented
- [ ] Preventive measures identified and ticketed
- [ ] Runbook updated if needed
- [ ] Team retrospective scheduled
