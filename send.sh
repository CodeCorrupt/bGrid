#!/bin/bash
for i in `seq 1 $1`;
do
    data="{\"name\" : \"job $i\",\"author\" : \"CodeCorrupt\",\"code\" : \"alert(\\\"Test #$i\\\"); return 1;\", \"numRedundancy\" : \"3\", \"dispatch\" : \"true\"}"
    echo "Posting job: $data"
    curl -s -H "Content-Type: application/json" -X POST -d "$data" "http://bgrid-codecorrupt.c9users.io/api/jobs/send"  | python -m json.tool
    echo
done  
