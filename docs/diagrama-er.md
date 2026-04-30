---
title: Diagrama Entidad-Relación (ER) - Auth Service
---

## Entidades principales

### User
- id (PK)
- email (unique)
- password
- first_name
- last_name
- is_active
- is_staff
- is_superuser
- date_joined
- last_login

## Diagrama ER (Mermaid)

```mermaid
erDiagram
    USER {
        int id PK
        string email "unique"
        string password
        string first_name
        string last_name
        boolean is_active
        boolean is_staff
        boolean is_superuser
        datetime date_joined
        datetime last_login
    }
```

Si se agregan más entidades (roles, perfiles, etc.), este diagrama se puede ampliar fácilmente.
