#!/bin/bash
# ============================================================
# C-SPEK MOTORS LTD — Full admin feature test suite
# Exercises every API end-to-end with a real session cookie.
# Run: bash scripts/test-admin-features.sh
# ============================================================
set -u
BASE="http://localhost:3000"
JAR="/tmp/cspek-test-cookies.txt"
ORIGIN_H='-H Origin:http://localhost:3000 -H Sec-Fetch-Site:same-origin'
PASS=0; FAIL=0

check() { # $1 name, $2 expected_substr, $3 actual
  if echo "$3" | grep -q "$2"; then PASS=$((PASS+1)); echo "  ✓ $1";
  else FAIL=$((FAIL+1)); echo "  ✗ $1  → got: $(echo "$3" | head -c 220)"; fi
}

api() { # $1 method, $2 path, $3 [json body]
  local m="$1" p="$2" b="${3:-}"
  if [ -n "$b" ]; then
    curl -s -b "$JAR" -c "$JAR" -X "$m" "$BASE$p" -H "Content-Type: application/json" $ORIGIN_H -d "$b" --max-time 60
  else
    curl -s -b "$JAR" -c "$JAR" -X "$m" "$BASE$p" $ORIGIN_H --max-time 60
  fi
}

echo "— AUTH —"
R=$(curl -s -c "$JAR" -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" $ORIGIN_H -d '{"email":"admin@cspekmotors.com","password":"Cspek@2026"}')
check "login (Cspek@2026)" '"success":true' "$R"
R=$(api GET /api/auth/me); check "auth/me returns admin" 'System Administrator' "$R"

echo "— DASHBOARD —"
R=$(api GET /api/admin/dashboard); check "dashboard stats" '"success":true' "$R"

echo "— CATEGORIES —"
R=$(api GET /api/admin/categories); check "list categories" '"success":true' "$R"
CATID=$(echo "$R" | python3 -c "import json,sys; d=json.load(sys.stdin)['data']; print([c for c in d if c['slug']=='cars'][0]['id'])")
R=$(api POST /api/admin/categories '{"name":"QA Test Category","description":"temp test","isActive":true,"sortOrder":99}')
check "create category" '"name":"QA Test Category"' "$R"
QACAT=$(echo "$R" | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['id'])")
R=$(api PUT "/api/admin/categories/$QACAT" '{"name":"QA Test Category Renamed"}'); check "update category" 'Renamed' "$R"
R=$(api DELETE "/api/admin/categories/$QACAT"); check "delete category" '"success":true' "$R"

echo "— VEHICLES —"
R=$(api GET "/api/admin/vehicles"); check "list vehicles" '"success":true' "$R"
R=$(api POST /api/admin/vehicles "{\"title\":\"QA Test Vehicle 2024\",\"brand\":\"Toyota\",\"model\":\"QA\",\"year\":2024,\"categoryId\":\"$CATID\",\"price\":9999999,\"currency\":\"NGN\",\"condition\":\"NEW\",\"status\":\"AVAILABLE\",\"shortDescription\":\"QA short\",\"description\":\"QA desc\",\"specifications\":[{\"label\":\"Engine\",\"value\":\"2.0L\"}],\"isFeatured\":false,\"isPublished\":true,\"seoTitle\":\"QA SEO\",\"seoDescription\":\"QA SEO desc\",\"seoKeywords\":\"qa,test\"}")
check "create vehicle (full fields)" '"title":"QA Test Vehicle 2024"' "$R"
QAVID=$(echo "$R" | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['id'])")
QASLUG=$(echo "$R" | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['slug'])")
R=$(api PUT "/api/admin/vehicles/$QAVID" '{"status":"RESERVED","price":8888888}'); check "update vehicle" '"status":"RESERVED"' "$R"
R=$(curl -s "$BASE/api/vehicles/$QASLUG"); check "public detail OK" '"success":true' "$R"
LEAK=$(echo "$R" | python3 -c "
import json,sys
d=json.load(sys.stdin)['data']
leak = ('price' in json.dumps(d)) or ('specifications' in json.dumps(d))
print('LEAK' if leak else 'CLEAN')")
check "public API hides price/specifications" 'CLEAN' "$LEAK"

echo "— MEDIA —"
R=$(curl -s -b "$JAR" -X POST "$BASE/api/admin/media/upload" $ORIGIN_H -F "files=@/home/z/my-project/uploads/seed/cat-cars-1.jpg;type=image/jpeg" -F "vehicleId=$QAVID" -F "caption=QA test photo" --max-time 60)
check "upload image for vehicle" '"success":true' "$R"
MID=$(echo "$R" | python3 -c "import json,sys; print(json.load(sys.stdin)['data'][0]['id'])")
MURL=$(echo "$R" | python3 -c "import json,sys; print(json.load(sys.stdin)['data'][0]['url'])")
R=$(api PATCH "/api/admin/media/$MID" '{"caption":"QA updated caption","isPrimary":true}'); check "update media caption/primary" 'QA updated caption' "$R"
R=$(curl -s -o /dev/null -w "%{http_code}:%{content_type}" "$BASE$MURL"); check "file served via /api/files" '200:image/jpeg' "$R"
R=$(api DELETE "/api/admin/media/$MID"); check "delete media" '"success":true' "$R"
R=$(curl -s -b "$JAR" -X POST "$BASE/api/admin/media/upload" $ORIGIN_H -F "files=@/home/z/my-project/public/og-image.png;type=image/png" -F "unlinked=true" --max-time 60)
check "upload unlinked site asset" '"success":true' "$R"
SITEURL=$(echo "$R" | python3 -c "import json,sys; print(json.load(sys.stdin)['data'][0]['url'])")
SITEFILE=$(echo "$SITEURL" | sed 's|/api/files/||')
rm -f "/home/z/my-project/uploads/$(echo $SITEFILE | tr ':' '/')"
rm -f "/home/z/my-project/uploads/site/$(basename "$SITEURL")"

echo "— ENQUIRIES —"
R=$(curl -s -b "$JAR" -X POST "$BASE/api/enquiries" $ORIGIN_H -F "vehicleId=$QAVID" -F "customerName=QA Tester" -F "email=qa@test.com" -F "phone=08011122233" -F "message=QA enquiry message for testing" --max-time 60)
check "public enquiry submit (multipart)" '"success":true' "$R"
QAEID=$(echo "$R" | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['enquiry']['id'])")
WA=$(echo "$R" | python3 -c "import json,sys; print('wa.me' in json.load(sys.stdin)['data']['whatsappUrl'])")
check "enquiry returns WhatsApp deep link" 'True' "$WA"
R=$(api GET /api/admin/enquiries); check "list enquiries" '"success":true' "$R"
R=$(api PUT "/api/admin/enquiries/$QAEID" '{"status":"CONTACTED"}'); check "update enquiry status" '"CONTACTED"' "$R"

echo "— CONTACT MESSAGES —"
R=$(api POST /api/contact '{"name":"QA Sender","email":"qa@test.com","phone":"08011122233","subject":"QA subject","message":"QA contact message body"}')
check "public contact submit" '"success":true' "$R"
R=$(api GET "/api/admin/contact-messages")
QAMID=$(echo "$R" | python3 -c "
import json,sys
d=json.load(sys.stdin)['data']
items=d['items'] if isinstance(d,dict) and 'items' in d else d
print([m for m in items if m.get('email')=='qa@test.com'][0]['id'])")
R=$(api GET /api/admin/contact-messages); check "list contact messages" '"success":true' "$R"
R=$(api PUT "/api/admin/contact-messages/$QAMID" '{"status":"READ"}'); check "update message status" '"READ"' "$R"

echo "— ADMIN USERS —"
# Remove any leftover QA user from a previous run (old guard bug could not delete it)
LEFT=$(api GET /api/admin/users | python3 -c "
import json,sys
d=json.load(sys.stdin)['data']
items=d['items'] if isinstance(d,dict) and 'items' in d else d
m=[u for u in items if u.get('email')=='qa-admin@test.com']
print(m[0]['id'] if m else '')")
if [ -n "$LEFT" ]; then R=$(api DELETE "/api/admin/users/$LEFT"); check "cleanup leftover QA user (guard fix verified)" '"success":true' "$R"; fi
R=$(api GET /api/admin/users); check "list users" '"success":true' "$R"
R=$(api POST /api/admin/users '{"name":"QA Admin","email":"qa-admin@test.com","password":"QaAdmin@2026","role":"ADMIN"}')
check "create admin user" '"email":"qa-admin@test.com"' "$R"
QAUID=$(echo "$R" | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['id'])")
R=$(api PUT "/api/admin/users/$QAUID" '{"role":"SUPER_ADMIN","isActive":false}'); check "update user" '"isActive":false' "$R"
R=$(api DELETE "/api/admin/users/$QAUID"); check "delete inactive super admin (guard allows)" '"success":true' "$R"
MAINID=$(api GET /api/admin/users | python3 -c "import json,sys; d=json.load(sys.stdin)['data']; items=d['items'] if isinstance(d,dict) and 'items' in d else d; print(items[0]['id'])")
R=$(api DELETE "/api/admin/users/$MAINID"); check "delete own account blocked" 'cannot delete your own account' "$R"

echo "— SETTINGS & AUDIT —"
R=$(api GET /api/admin/settings); check "admin settings GET" '"success":true' "$R"
R=$(api GET /api/admin/audit-logs); check "audit logs list" '"success":true' "$R"
HASAUDIT=$(echo "$R" | python3 -c "
import json,sys
d=json.load(sys.stdin)['data']
items=d['items'] if isinstance(d,dict) and 'items' in d else d
acts={a['action'] for a in items}
print('YES' if {'LOGIN','UPLOAD','UPDATE'} & acts else 'NO')")
check "audit captured LOGIN/UPLOAD/UPDATE" 'YES' "$HASAUDIT"

echo "— SEO & FILES —"
for p in /sitemap.xml /robots.txt; do
  C=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$p"); check "GET $p → 200" "200" "$C"
done

echo "— CLEANUP TEST DATA —"
R=$(api DELETE "/api/admin/vehicles/$QAVID"); check "delete QA vehicle" '"success":true' "$R"
R=$(api DELETE "/api/admin/enquiries/$QAEID"); check "delete QA enquiry" '"success":true' "$R"
R=$(api DELETE "/api/admin/contact-messages/$QAMID"); check "delete QA message" '"success":true' "$R"

echo "— LOGOUT / GUARD —"
R=$(api POST /api/auth/logout); check "logout" '"success":true' "$R"
R=$(api GET /api/auth/me); check "me after logout → 401" '"error"' "$R"
R=$(curl -s "$BASE/api/admin/vehicles"); check "unauthenticated admin API blocked" '"error"' "$R"

echo ""
echo "======================================"
echo "RESULT: $PASS passed, $FAIL failed"
echo "======================================"
exit $FAIL
