#!/bin/bash

# Mediastream chunk upload test (based on official example)
# Usage:
#   TOKEN=xxxxx FILE=./path/to/video.mp4 ./scripts/mediastream_chunk_test.sh

set -euo pipefail

TOKEN="${TOKEN:-}"
PLATFORM_BASE_URL="${PLATFORM_BASE_URL:-https://platform.mediastre.am/api}"

FILE="${FILE:-}"
TMP_PATH="${PWD}/tmp"
CHUNK_SIZE="${CHUNK_SIZE:-10485760}" # 10MB

if [ -z "$TOKEN" ]; then
  echo "ERROR: TOKEN env var is required"
  exit 1
fi

if [ -z "$FILE" ]; then
  echo "ERROR: FILE env var is required (absolute or relative path to mp4)"
  exit 1
fi

if [ ! -f "$FILE" ]; then
  echo "ERROR: FILE not found: $FILE"
  exit 1
fi

FILE_NAME=$(basename "$FILE")
FILE_SIZE=$(ls -l "$FILE" | awk '{print $5}')

mkdir -p "$TMP_PATH" 2>/dev/null

echo "Splitting file into 10MB chunks..."
split -a 5 -b "$CHUNK_SIZE" "$FILE" "${TMP_PATH}/${FILE_NAME}."

echo "Requesting upload token..."
RESP=$(curl -s -H "X-Api-Token:${TOKEN}" "${PLATFORM_BASE_URL}/media/upload?file_name=${FILE_NAME}&size=${FILE_SIZE}")

UPLOAD_PATH=$(printf '%s' "$RESP" | python3 -c 'import json,sys; 
data=json.loads(sys.stdin.read()); 
print(data.get("data",{}).get("server",""))' 2>/dev/null || true)
echo "UPLOAD_PATH: ${UPLOAD_PATH}"

if [ "${UPLOAD_PATH}" = "null" ] || [ -z "${UPLOAD_PATH}" ]; then
  echo "ERROR CREATING UPLOAD TOKEN. API RESPONSE: ${RESP}"
  exit 1
fi

CHUNKS=$(ls "$TMP_PATH" | grep "${FILE_NAME}" | sort)
CURRENT_CHUNK=0

for chunk in $CHUNKS; do
  CURRENT_CHUNK=$((CURRENT_CHUNK + 1))
  echo "UPLOADING ${chunk} (Number ${CURRENT_CHUNK})"

  echo "CHECKING CHUNK ${CURRENT_CHUNK}..."
  HEAD_RESP=$(curl -s -I --connect-timeout 10 --max-time 30 "${UPLOAD_PATH}?resumableChunkNumber=${CURRENT_CHUNK}" || true)
  echo "HEAD RESPONSE:"
  echo "$HEAD_RESP"
  MUST_UPLOAD=$(printf '%s' "$HEAD_RESP" | grep -E 'HTTP/.* 204' | wc -l | tr -d '[:space:]')
  if [ "${MUST_UPLOAD}" = "1" ]; then
    echo "POSTING CHUNK ${CURRENT_CHUNK}..."
    HTTP_CODE=$(curl -s -o /tmp/mediastream_chunk_resp.txt -w "%{http_code}" \
      --connect-timeout 10 --max-time 120 \
      -H "Expect:" \
      -X POST "${UPLOAD_PATH}?resumableChunkNumber=${CURRENT_CHUNK}" \
      -F "file=@${TMP_PATH}/${chunk}" -F "name=${FILE_NAME}" || true)
    UPLOAD_RESPONSE=$(cat /tmp/mediastream_chunk_resp.txt 2>/dev/null || true)
    echo "CHUNK ${CURRENT_CHUNK} UPLOAD HTTP: ${HTTP_CODE}"
    echo "CHUNK ${CURRENT_CHUNK} UPLOAD RESPONSE: ${UPLOAD_RESPONSE}"
  else
    echo "CHUNK ${CURRENT_CHUNK} ALREADY EXISTS IN SERVER - SKIPPING"
  fi
done

echo "DONE UPLOADING ${FILE_NAME}"

echo "Cleaning temp chunks..."
find "$TMP_PATH" -name "${FILE_NAME}*" -delete

NAME_PART=$(echo "$UPLOAD_PATH" | awk -F. '{print $NF}')
echo "WAITING FOR MEDIA CREATION. NAME_PART=${NAME_PART}"

while true; do
  MEDIAS_RESP=$(curl -s -H "X-Api-Token:${TOKEN}" "${PLATFORM_BASE_URL}/media?title-rule=starts_with&title=${NAME_PART}&all=true")
  MEDIA_ID=$(printf '%s' "$MEDIAS_RESP" | python3 -c 'import json,sys;
data=json.loads(sys.stdin.read());
items=data.get("data") or [];
print(items[0].get("_id","") if isinstance(items,list) and items else "")' 2>/dev/null || true)
  if [ "${MEDIA_ID}" = "null" ] || [ -z "${MEDIA_ID}" ]; then
    echo "Media not created yet, waiting 10s..."
    sleep 10
  else
    break
  fi
done

echo "MEDIA CREATED. ID=${MEDIA_ID}"
