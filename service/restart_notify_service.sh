echo "stop service ..."
ps -ef | grep notify-service.js | grep -v grep | awk '{print $2}' | xargs kill -9
sleep 1
echo "start service ..."
nohup node notify-service.js >>notify-service.log 2>&1 &