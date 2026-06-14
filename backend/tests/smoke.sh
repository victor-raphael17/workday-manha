#!/usr/bin/env bash
#
# End-to-end smoke test for the CA Pharmacy API.
#
# Sales tests have been commented, cause back end for it has been removed
#
# Usage:  API=http://localhost:8080 ./backend/tests/smoke.sh
set -euo pipefail

API="${API:-http://localhost:8080}"
PASS=0
FAIL=0

green() { printf '\033[32m%s\033[0m\n' "$1"; }
red()   { printf '\033[31m%s\033[0m\n' "$1"; }

assert_eq() {
  local label="$1" expected="$2" actual="$3"
  if [[ "$expected" == "$actual" ]]; then
    green "  PASS  $label (= $actual)"
    PASS=$((PASS + 1))
  else
    red   "  FAIL  $label (expected $expected, got $actual)"
    FAIL=$((FAIL + 1))
  fi
}

# GET helpers ---------------------------------------------------------------
on_hand() {
  local value
  value=$(curl -s "$API/api/medications/$1" -H "Authorization: Bearer $TOKEN" \
    | jq -e -r '.data.on_hand') || {
      echo "Invalid API response for medication $1" >&2
      return 1
  }
  if ! [[ "$value" =~ ^[0-9]+$ ]]; then
    echo "on_hand is not numeric: $value" >&2
    return 1
  fi
  echo "$value"
}
    
status_code() {
  local method="$1" path="$2" body="${3:-}"
  local args=(-s -o /dev/null -w '%{http_code}' -X "$method" "$API$path")
  if [[ -n "${TOKEN:-}" ]]; then
    args+=(-H "Authorization: Bearer $TOKEN")
  fi
  if [[ -n "$body" ]]; then
    args+=(-H 'Content-Type: application/json' -d "$body")
  fi
  curl "${args[@]}"
}

echo "== Health =="
assert_eq "GET /health is healthy" "healthy" "$(curl -s "$API/health" | jq -r '.status')"

echo "== Authentication: login, me, logout =="
# Wrong password is rejected (401).
assert_eq "bad credentials return 401" "401" \
  "$(status_code POST /api/auth/login '{"email":"jade@capharmacy.com","password":"nope"}')"
# Valid sign-in issues a bearer token.
TOKEN=$(curl -s -X POST "$API/api/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"jade@capharmacy.com","password":"password123"}' | jq -r '.data.token')
assert_eq "login issues a token" "true" "$([[ -n "$TOKEN" && "$TOKEN" != "null" ]] && echo true || echo false)"
# The token identifies the current user.
assert_eq "GET /me returns the user" "jade@capharmacy.com" \
  "$(curl -s "$API/api/auth/me" -H "Authorization: Bearer $TOKEN" | jq -r '.data.email')"
# A missing token is unauthorized.
assert_eq "GET /me without token is 401" "401" \
  "$(curl -s -o /dev/null -w '%{http_code}' "$API/api/auth/me")"
# Logout revokes the token.
curl -s -o /dev/null -X POST "$API/api/auth/logout" -H "Authorization: Bearer $TOKEN"
assert_eq "token is revoked after logout" "401" \
  "$(curl -s -o /dev/null -w '%{http_code}' "$API/api/auth/me" -H "Authorization: Bearer $TOKEN")"

# New token to continue testing

TOKEN=$(curl -s -X POST "$API/api/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"jade@capharmacy.com","password":"password123"}' | jq -r '.data.token')

# Pick a well-stocked, non-controlled medication (Paracetamol in the seed).
MED_ID=$(curl -s "$API/api/medications" -H "Authorization: Bearer $TOKEN" \
  | jq -r '[.data.data[] | select(.controlled==false and .on_hand>20 and .status=="in")][0].id')
echo "== Using medication id=$MED_ID =="

echo "== Receiving a purchase order adds stock =="
SUPPLIER_ID=$(curl -s "$API/api/suppliers" -H "Authorization: Bearer $TOKEN" | jq -r '.data[0].id')
BEFORE=$(on_hand "$MED_ID")
PO=$(curl -s -X POST "$API/api/purchase-orders" -H 'Content-Type: application/json' -H "Authorization: Bearer $TOKEN"\
  -d "{\"supplier_id\":$SUPPLIER_ID,\"items\":[{\"medication_id\":$MED_ID,\"units\":25,\"unit_cost\":4.5}]}")
  echo "$PO"
PO_ID=$(echo "$PO" | jq -r '.data.id')

# A new PO starts in 'draft'; advance it through the lifecycle before receiving.
for state in submitted transit received; do
  curl -s -X PATCH "$API/api/purchase-orders/$PO_ID/state" \
    -H 'Content-Type: application/json' -H "Authorization: Bearer $TOKEN" -d "{\"state\":\"$state\"}" >/dev/null
done
assert_eq "receiving adds 25 units" "$((BEFORE + 25))" "$(on_hand "$MED_ID")"

echo "== Receiving the same PO twice is guarded =="
CODE=$(status_code PATCH "/api/purchase-orders/$PO_ID/state" '{"state":"received"}')
assert_eq "double-receive rejected (422)" "422" "$CODE"


#Sales test (Commented because backend was removed)

# echo "== Sale draws stock down, void restores it =="
# BEFORE=$(on_hand "$MED_ID")
# SALE=$(curl -s -X POST "$API/api/sales" -H 'Content-Type: application/json' -H "Authorization: Bearer $TOKEN" \
#   -d "{\"payment_method\":\"card\",\"items\":[{\"medication_id\":$MED_ID,\"quantity\":3}]}")
# SALE_ID=$(echo "$SALE" | jq -r '.data.id')
# AFTER=$(on_hand "$MED_ID")
# assert_eq "stock decremented by 3" "$((BEFORE - 3))" "$AFTER"

# SUBTOTAL=$(echo "$SALE" | jq -r '.data.subtotal')
# TAX=$(echo "$SALE" | jq -r '.data.tax')
# TOTAL=$(echo "$SALE" | jq -r '.data.total')
# assert_eq "total = subtotal + tax" \
#   "$(jq -n "$SUBTOTAL + $TAX | .*100 | round / 100")" \
#   "$(jq -n "$TOTAL | .*100 | round / 100")"

# curl -s -X POST "$API/api/sales/$SALE_ID/void" >/dev/null
# assert_eq "void restores stock" "$BEFORE" "$(on_hand "$MED_ID")"

# echo "== Overselling is rejected (422) and leaves stock untouched =="
# BEFORE=$(on_hand "$MED_ID")
# CODE=$(status_code POST /api/sales \
#   "{\"items\":[{\"medication_id\":$MED_ID,\"quantity\":999999}]}")
# assert_eq "oversell returns 422" "422" "$CODE"
# assert_eq "stock unchanged after rejected sale" "$BEFORE" "$(on_hand "$MED_ID")"

echo "== Dispensing a prescription draws stock down =="
PATIENT_ID=$(curl -s "$API/api/patients" -H "Authorization: Bearer $TOKEN" | jq -r '.data.data[0].id')
BEFORE=$(on_hand "$MED_ID")
echo "BEFORE RX STOCK: $(on_hand "$MED_ID")"
RX=$(curl -s -X POST "$API/api/prescriptions" -H 'Content-Type: application/json' -H "Authorization: Bearer $TOKEN" \
  -d "{\"patient_id\":$PATIENT_ID,\"medication_id\":$MED_ID,\"quantity\":4,\"unit\":\"tabs\",\"prescriber\":\"Dr. Smoke\"}")
RX_ID=$(echo "$RX" | jq -r '.data.id')
for state in verifying ready dispensed; do
  curl -s -X PATCH "$API/api/prescriptions/$RX_ID/state" \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"state\":\"$state\"}" >/dev/null
done
assert_eq "dispensing decrements 4 units" "$((BEFORE - 4))" "$(on_hand "$MED_ID")"

echo
echo "================ $PASS passed, $FAIL failed ================"
[[ "$FAIL" -eq 0 ]]
