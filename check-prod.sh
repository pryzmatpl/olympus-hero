#!/bin/bash
# One-liner to check production status
cd /nvme2/Workspace/olympus-hero && echo "=== Containers ===" && docker-compose ps && echo -e "\n=== Server Logs (last 30 lines) ===" && docker-compose logs --tail=30 server 2>&1 | grep -E "(error|Error|ERROR|crash|Crash|exception|Exception|POST|register|disconnect|502)" -i -A 2 -B 2 | tail -20 || docker-compose logs --tail=30 server && echo -e "\n=== Backend Health ===" && curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:9002/api/health 2>&1 && echo -e "\n=== Nginx Errors ===" && tail -10 /var/log/nginx/error.log 2>/dev/null | grep -E "(502|upstream|connect)" || echo "No nginx errors found"

