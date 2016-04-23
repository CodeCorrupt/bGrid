for i in `seq 1 $1`;
do
    curl -s -X GET "http://bgrid-codecorrupt.c9users.io/api/jobs/remove" | python -m json.tool
done
