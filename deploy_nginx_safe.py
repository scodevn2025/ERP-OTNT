import base64
import subprocess

remote_script = r"""
with open('/etc/nginx/sites-available/erp-otnt', 'w') as f:
    f.write(r'''
server {
    listen 80;
    server_name erp.ongtrumnoitro.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name erp.ongtrumnoitro.com;

    root /home/clp/htdocs/erp_v2/frontend/build;
    index index.html;

    ssl_certificate /etc/letsencrypt/live/erp.ongtrumnoitro.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/erp.ongtrumnoitro.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
''')
"""

encoded = base64.b64encode(remote_script.encode('utf-8')).decode('utf-8')

print("Step 1: Cleaning up old files...")
subprocess.run('plink -ssh root@91.99.161.14 -pw "Kh@chuy11@@" -batch "rm -f /root/script_b64.txt"', shell=True)

print("Step 2: Uploading chunks...")
chunk_size = 50
for i in range(0, len(encoded), chunk_size):
    chunk = encoded[i:i+chunk_size]
    # Check OS to handle quoting correctly if needed, but for now assuming execution from standard shell
    cmd = f'plink -ssh root@91.99.161.14 -pw "Kh@chuy11@@" -batch "echo -n {chunk} >> /root/script_b64.txt"'
    subprocess.run(cmd, shell=True)

print("Step 3: Decoding and applying config...")
subprocess.run('plink -ssh root@91.99.161.14 -pw "Kh@chuy11@@" -batch "base64 -d /root/script_b64.txt > /root/create_final_conf.py && python3 /root/create_final_conf.py && rm -f /etc/nginx/sites-enabled/default.conf && nginx -t && systemctl reload nginx"', shell=True)
print("Done.")
