# Customer Portal — BFF API

Base URL: `http://localhost:3003`

All routes require customer context (auth cookies or dev `LATEEN_CUSTOMER_ID`).

## Auth

### POST /api/auth/login

```json
{ "username": "string", "password": "string", "rememberMe": true }
```

Response: `{ "user": { "id", "email", "customerId", ... } }`  
Sets httpOnly cookies.

### POST /api/auth/logout

Clears cookies, revokes refresh token.

### POST /api/auth/refresh

Rotates access/refresh cookies.

### GET /api/auth/me

Returns `{ user, customer }`.

## Data

### GET /api/dashboard

Returns dashboard aggregation (projects, orders, quotations, invoices counts + activity).

### GET /api/projects

Query `?id=` for single project. Returns `{ projects }` or `{ project }`.

### GET /api/orders

Returns `{ orders }` or `{ order }` with `?id=`.

### GET /api/quotations

Returns `{ quotations }`.  
**POST** `{ "quotationId", "action": "approve"|"reject" }`.

### GET /api/invoices

Returns `{ invoices }`.

### GET /api/files

Returns `{ files }`.  
**POST** multipart upload.

### GET /api/messages

Returns `{ messages }`.

### GET /api/notifications

Returns `{ notifications }`.

### GET /api/profile

Returns `{ customer, user }`.

### POST /api/assistant

```json
{ "message": "What is my order status?" }
```

Returns `{ reply, disclaimer }`.

### GET /api/approvals

Returns `{ approvals, production }`.

### GET /api/production

Returns `{ production }`.
