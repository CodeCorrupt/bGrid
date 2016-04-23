#!/bin/bash
data="{\"message\" : \"Echo this!\"}"
curl -s -H "Content-Type: application/json" -X POST -d "$data" "http://bgrid-codecorrupt.c9users.io/api/echo"  | python -m json.tool
