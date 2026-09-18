#!/bin/bash
# Comprehensive admin API verification for C-SPEK MOTORS
# Exercises every admin endpoint end-to-end.
BASE="http://localhost:3000"
JAR=/tmp/cspek-test-cookies.txt
PASS=0; FAIL=0

login() {
  curl -s -c "$JAR" -X POST "$BASE/api/auth/login" \
    -H "Content-Type: application/json" -H "Origin: $BASE" \
    -d '{"email":"admin@cspekmotors.com","password":"Cspek@2026"}' -o /dev/null
}

check() { # name, expected_substring, actual_response
  local name="$1" expect="$2" resp="$3"
  if echo "$resp" | rg -q "$expect"; then
    PASS=$((PASS+1)); echo "PASS: $name"
  else
    FAIL=$((FAIL+1)); echo "FAIL: $name — expected [$expect] got: $(echo "$resp" | head -c 200)"
  fi
}

echo "════ 1. AUTH ════"
login
check "login" '"success":true' "$(curl -s -b "$JAR" "$BASE/api/auth/me")"
check "me returns admin" '"role":"SUPER_ADMIN"' "$(curl -s -b "$JAR" "$BASE/api/auth/me")"

echo "════ 2. DASHBOARD ════"
check "dashboard stats" '"stats"' "$(curl -s -b "$JAR" "$BASE/api/admin/dashboard")"

echo "════ 3. CATEGORIES CRUD ════"
CATS=$(curl -s -b "$JAR" "$BASE/api/admin/categories")
check "categories list" '"success":true' "$CATS"
NEWCAT=$(curl -s -b "$JAR" -X POST "$BASE/api/admin/categories" -H "Content-Type: application/json" -H "Origin: $BASE" -d '{"name":"Test Category T1","description":"temp"}')
check "category create" '"name":"Test Category T1"' "$NEWCAT"
CATID=$(echo "$NEWCAT" | rg -o '"id":"[a-z0-9]+"' | head -1 | cut -d'"' -f4)
check "category update" '"name":"Test Category Renamed"' "$(curl -s -b "$JAR" -X PUT "$BASE/api/admin/categories/$CATID" -H "Content-Type: application/json" -H "Origin: $BASE" -d '{"name":"Test Category Renamed"}')"
check "category delete" '"success":true' "$(curl -s -b "$JAR" -X DELETE "$BASE/api/admin/categories/$CATID" -H "Origin: $BASE")"

echo "════ 4. VEHICLES CRUD ════"
SUVID=$(curl -s -b "$JAR" "$BASE/api/admin/categories" | rg -o '\{"id":"[a-z0-9]+","name":"SUVs"' | rg -o '[a-z0-9]{25,}' | head -1)
NEWVEH=$(curl -s -b "$JAR" -X POST "$BASE/api/admin/vehicles" -H "Content-Type: application/json" -H "Origin: $BASE" -d "{\"title\":\"Test Ride Alpha\",\"brand\":\"Toyota\",\"model\":\"Hilux\",\"year\":2023,\"categoryId\":\"$SUVID\",\"condition\":\"USED\",\"status\":\"AVAILABLE\",\"description\":\"Test vehicle\"}")
check "vehicle create" '"title":"Test Ride Alpha"' "$NEWVEH"
VEHID=$(echo "$NEWVEH" | rg -o '"id":"[a-z0-9]{25,}"' | head -1 | cut -d'"' -f4)
check "vehicle update" '"title":"Test Ride Beta"' "$(curl -s -b "$JAR" -X PUT "$BASE/api/admin/vehicles/$VEHID" -H "Content-Type: application/json" -H "Origin: $BASE" -d '{"title":"Test Ride Beta","status":"RESERVED"}')"
check "vehicle detail" '"success":true' "$(curl -s -b "$JAR" "$BASE/api/admin/vehicles/$VEHID")"

echo "════ 5. MEDIA UPLOAD (category target) ════"
UP=$(curl -s -b "$JAR" -X POST "$BASE/api/admin/media/upload" -H "Origin: $BASE" -F "categoryId=$SUVID" -F "files=@uploads/seed/cat-suvs-3.jpg;type=image/jpeg")
check "media upload" '"success":true' "$UP"
MEDIAID=$(echo "$UP" | rg -o '"id":"[a-z0-9]{25,}"' | head -1 | cut -d'"' -f4)

echo "════ 6. MEDIA PATCH (primary + reorder) ════"
check "media set primary" '"isPrimary":true' "$(curl -s -b "$JAR" -X PATCH "$BASE/api/admin/media/$MEDIAID" -H "Content-Type: application/json" -H "Origin: $BASE" -d '{"isPrimary":true,"sortOrder":1}')"

echo "════ 7. MEDIA LIST + DELETE ════"
check "media list" '"categories"' "$(curl -s -b "$JAR" "$BASE/api/admin/media")"
check "media delete" '"success":true' "$(curl -s -b "$JAR" -X DELETE "$BASE/api/admin/media/$MEDIAID" -H "Origin: $BASE")"

echo "════ 8. AI DETECT ════"
check "ai detect SUV" '"categoryName":"SUVs"' "$(curl -s -b "$JAR" -X POST "$BASE/api/admin/media/detect" -H "Origin: $BASE" -F "file=@uploads/seed/lexus-1.jpg;type=image/jpeg")"

echo "════ 9. VEHICLE DELETE ════"
check "vehicle delete" '"success":true' "$(curl -s -b "$JAR" -X DELETE "$BASE/api/admin/vehicles/$VEHID" -H "Origin: $BASE")"

echo "════ 10. ENQUIRIES ════"
check "enquiries list" '"success":true' "$(curl -s -b "$JAR" "$BASE/api/admin/enquiries")"

echo "════ 11. CONTACT MESSAGES ════"
check "messages list" '"success":true' "$(curl -s -b "$JAR" "$BASE/api/admin/contact-messages")"

echo "════ 12. USERS ════"
check "users list" '"success":true' "$(curl -s -b "$JAR" "$BASE/api/admin/users")"

echo "════ 13. AUDIT LOGS ════"
check "audit-logs list" '"success":true' "$(curl -s -b "$JAR" "$BASE/api/admin/audit-logs")"

echo "════ 14. SETTINGS ════"
SET=$(curl -s -b "$JAR" "$BASE/api/admin/settings")
check "settings get" '"success":true' "$SET"
check "settings phone present" '08039552546' "$SET"
check "settings put" '"success":true' "$(curl -s -b "$JAR" -X PUT "$BASE/api/admin/settings" -H "Content-Type: application/json" -H "Origin: $BASE" -d '{"phoneSecondary":"09074884438"}')"

echo "════ 15. PUBLIC SITE SMOKE ════"
for p in / /vehicles /about /contact; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$p")
  check "public $p" "200" "$code"
done

echo ""
echo "══════════════════════════"
echo "RESULT: $PASS passed, $FAIL failed"
rm -f "$JAR"
