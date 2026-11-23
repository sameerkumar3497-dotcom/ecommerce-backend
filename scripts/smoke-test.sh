#!/usr/bin/env bash
# End-to-end smoke test for the API.
# 1. Start the server:               npm run dev
# 2. In another terminal, run:       npm run smoke

BASE_URL="${BASE_URL:-http://localhost:3000}"
EMAIL="smoke$(date +%s)@example.com"
ROLE_EMAIL="smokerole$(date +%s)@example.com"
PASSWORD="SmokeTest123"
ADMIN_EMAIL="${SMOKE_ADMIN_EMAIL:-admin@example.com}"
ADMIN_PASSWORD="${SMOKE_ADMIN_PASSWORD:-AdminPass123}"

PASS=0
FAIL=0
STATUS=""
RESPONSE=""

# Sends a request and sets STATUS and RESPONSE.
# Usage: request METHOD PATH [JSON_BODY] [ACCESS_TOKEN]
request() {
  local method="$1" path="$2" body="${3:-}" token="${4:-}"
  local args=(-s -X "$method" "$BASE_URL$path" -H "Content-Type: application/json" -w $'\n%{http_code}')
  if [ -n "$token" ]; then args+=(-H "Authorization: Bearer $token"); fi
  if [ -n "$body" ]; then args+=(-d "$body"); fi
  local out
  out=$(curl "${args[@]}")
  STATUS="${out##*$'\n'}"
  RESPONSE="${out%$'\n'*}"
}

# Compares the last STATUS with what we expect.
check() {
  if [ "$STATUS" = "$2" ]; then
    echo "PASS  $1 ($STATUS)"
    PASS=$((PASS + 1))
  else
    echo "FAIL  $1 (expected $2, got $STATUS)"
    echo "      $RESPONSE"
    FAIL=$((FAIL + 1))
  fi
}

# Checks that the last RESPONSE contains some text.
check_contains() {
  if echo "$RESPONSE" | grep -q "$2"; then
    echo "PASS  $1"
    PASS=$((PASS + 1))
  else
    echo "FAIL  $1"
    echo "      $RESPONSE"
    FAIL=$((FAIL + 1))
  fi
}

# Reads one field from JSON piped into it.
get_field() {
  node -e "let s='';process.stdin.on('data',c=>s+=c).on('end',()=>{try{const v=JSON.parse(s)['$1'];console.log(v===undefined?'':v)}catch(e){console.log('')}})"
}

creds() { echo "{\"email\":\"$1\",\"password\":\"$2\"}"; }
token_body() { echo "{\"refreshToken\":\"$1\"}"; }

# Make sure the server is up before testing
if ! curl -s -o /dev/null "$BASE_URL/health"; then
  echo "Server is not running at $BASE_URL. Start it with: npm run dev"
  exit 1
fi

echo "Smoke test against $BASE_URL"
echo

# --- Basics ---
request GET /health;  check "health check" 200
request GET /nope;    check "unknown route returns JSON 404" 404

# --- Register ---
request POST /auth/register '{}'
check "register: empty body is rejected" 400
request POST /auth/register "{\"name\":\"Smoke Test\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}"
check "register: valid user" 201
request POST /auth/register "{\"name\":\"Smoke Test\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}"
check "register: duplicate email" 409
request POST /auth/register "{\"name\":\"Role Test\",\"email\":\"$ROLE_EMAIL\",\"password\":\"$PASSWORD\",\"role\":\"ADMIN\"}"
check "register: extra role field is ignored" 201
check_contains "register: new user is a CUSTOMER" '"role":"CUSTOMER"'

# --- Login ---
request POST /auth/login '{}'
check "login: empty body is rejected" 400
request POST /auth/login "$(creds "$EMAIL" "WrongPass123")"
check "login: wrong password" 401
request POST /auth/login "$(creds "nobody$EMAIL" "$PASSWORD")"
check "login: unknown email" 401
request POST /auth/login "$(creds "$EMAIL" "$PASSWORD")"
check "login: valid credentials" 200
ACCESS=$(echo "$RESPONSE" | get_field accessToken)
REFRESH=$(echo "$RESPONSE" | get_field refreshToken)

# --- Protected routes ---
request GET /auth/me;                         check "me: no token" 401
request GET /auth/me "" "not-a-real-token";   check "me: invalid token" 401
request GET /auth/me "" "$ACCESS";            check "me: valid token" 200
request GET /admin/ping;                      check "admin route: no token" 401
request GET /admin/ping "" "$ACCESS";         check "admin route: customer is forbidden" 403

# --- Admin (needs: npm run seed:admin) ---
request POST /auth/login "$(creds "$ADMIN_EMAIL" "$ADMIN_PASSWORD")"
if [ "$STATUS" = "200" ]; then
  check "admin: login" 200
  ADMIN_ACCESS=$(echo "$RESPONSE" | get_field accessToken)
  request GET /admin/ping "" "$ADMIN_ACCESS"
  check "admin route: admin is allowed" 200
else
  echo "SKIP  admin tests (could not log in as $ADMIN_EMAIL, run: npm run seed:admin)"
fi

# --- Refresh token rotation ---
request POST /auth/refresh '{}'
check "refresh: empty body is rejected" 400
request POST /auth/refresh "$(token_body "$REFRESH")"
check "refresh: valid token rotates" 200
NEW_REFRESH=$(echo "$RESPONSE" | get_field refreshToken)
request POST /auth/refresh "$(token_body "$REFRESH")"
check "refresh: reusing the old token is rejected" 401
request POST /auth/refresh "$(token_body "$NEW_REFRESH")"
check "refresh: reuse revoked the whole session family" 401

# --- Logout ---
request POST /auth/login "$(creds "$EMAIL" "$PASSWORD")"
check "login again" 200
REFRESH=$(echo "$RESPONSE" | get_field refreshToken)
request POST /auth/logout "$(token_body "$REFRESH")"
check "logout" 200
request POST /auth/refresh "$(token_body "$REFRESH")"
check "refresh after logout is rejected" 401

# --- Logout from all devices ---
request POST /auth/login "$(creds "$EMAIL" "$PASSWORD")"
check "login again (second time)" 200
ACCESS=$(echo "$RESPONSE" | get_field accessToken)
REFRESH=$(echo "$RESPONSE" | get_field refreshToken)
request POST /auth/logout-all "" "$ACCESS"
check "logout-all" 200
request POST /auth/refresh "$(token_body "$REFRESH")"
check "refresh after logout-all is rejected" 401

echo
echo "Passed: $PASS   Failed: $FAIL"
[ "$FAIL" -eq 0 ]