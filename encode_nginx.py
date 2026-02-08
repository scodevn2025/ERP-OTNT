import base64

conf = r"""server {
    listen 80;
    server_name erp.ongtrumnoitro.com;

    root /home/clp/htdocs/erp_v2/frontend/build;
    index index.html;

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
"""
encoded = base64.b64encode(conf.encode('utf-8')).decode('utf-8')
print(encoded)
