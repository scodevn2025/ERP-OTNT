import subprocess
import os

base_dir = r"c:\Users\SCODEVN\Downloads\ERP_V2"
deploy_dir = os.path.join(base_dir, "deploy", "nginx")
os.makedirs(deploy_dir, exist_ok=True)

def download_file(remote_path, local_path):
    print(f"Downloading {remote_path} -> {local_path}...")
    cmd = f'plink -ssh root@91.99.161.14 -pw "Kh@chuy11@@" -batch "cat {remote_path}"'
    try:
        # Use simple run with stdout pipe
        result = subprocess.run(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        content = result.stdout.decode('utf-8', errors='ignore') # Decode with ignore to be safe
        
        # Plink might include unexpected output if not careful, but 'cat' usually clean with -batch
        # However, check if file content looks valid (not empty)
        if len(content) < 10:
            print(f"Warning: Content too short for {local_path}")
            
        with open(local_path, "w", encoding='utf-8') as f:
            f.write(content)
        print("Success.")
    except Exception as e:
        print(f"Error downloading {remote_path}: {e}")

# 1. Download server.py (Fix hash password)
download_file("/home/clp/htdocs/erp_v2/backend/server.py", os.path.join(base_dir, "backend", "server.py"))

# 2. Download admin script
download_file("/home/clp/htdocs/erp_v2/backend/create_admin_mongo.py", os.path.join(base_dir, "backend", "create_admin_mongo.py"))

# 3. Download nginx config (Backup/Sync)
download_file("/etc/nginx/sites-available/erp-otnt.conf", os.path.join(deploy_dir, "erp-otnt.conf"))

# 4. Download frontend .env (Sync API URL)
download_file("/home/clp/htdocs/erp_v2/frontend/.env", os.path.join(base_dir, "frontend", ".env"))
