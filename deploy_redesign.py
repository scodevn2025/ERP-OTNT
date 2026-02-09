import subprocess
import os
import base64

files = [
    (r"backend\server.py", "/home/clp/htdocs/erp_v2/backend/server.py"),
    (r"backend\seed_premium_data.py", "/home/clp/htdocs/erp_v2/backend/seed_premium_data.py"),
    (r"frontend\src\lib\api.js", "/home/clp/htdocs/erp_v2/frontend/src/lib/api.js"),
    (r"frontend\src\contexts\StoreContext.js", "/home/clp/htdocs/erp_v2/frontend/src/contexts/StoreContext.js"),
    (r"frontend\src\App.js", "/home/clp/htdocs/erp_v2/frontend/src/App.js"),
    (r"frontend\src\components\layout\StoreLayout.jsx", "/home/clp/htdocs/erp_v2/frontend/src/components/layout/StoreLayout.jsx"),
    (r"frontend\src\pages\store\HomePage.jsx", "/home/clp/htdocs/erp_v2/frontend/src/pages/store/HomePage.jsx"),
    (r"frontend\src\components\layout\AdminSidebar.jsx", "/home/clp/htdocs/erp_v2/frontend/src/components/layout/AdminSidebar.jsx"),
    (r"frontend\src\pages\admin\StoreSettingsPage.jsx", "/home/clp/htdocs/erp_v2/frontend/src/pages/admin/StoreSettingsPage.jsx"),
    (r"frontend\public\banners\banner_x50_ultra.png", "/home/clp/htdocs/erp_v2/frontend/public/banners/banner_x50_ultra.png"),
    (r"frontend\public\banners\banner_h16_pro_steam.png", "/home/clp/htdocs/erp_v2/frontend/public/banners/banner_h16_pro_steam.png"),
    (r"frontend\public\banners\banner_smart_home_lifestyle.png", "/home/clp/htdocs/erp_v2/frontend/public/banners/banner_smart_home_lifestyle.png")
]
base = r"c:\Users\SCODEVN\Downloads\ERP_V2"

print("Starting direct deployment...")
# Ensure remote directories exist
subprocess.run('plink -ssh root@91.99.161.14 -pw "Kh@chuy11@@" -batch "mkdir -p /home/clp/htdocs/erp_v2/frontend/public/banners/"', shell=True)

for loc, rem in files:
    lp = os.path.join(base, loc)
    if not os.path.exists(lp):
        print(f"Skipping missing file: {lp}")
        continue
        
    print(f"Uploading {loc} -> {rem}")
    try:
        with open(lp, 'rb') as f:
            content = f.read()
        b64 = base64.b64encode(content).decode('ascii')
        
        # Use simpler approach if content is large: write to temp file chunked
        # But for these react files (10-20KB), command line length limit (8191 on cmd, distinct on plink/bash) might be hit?
        # Linux max arg is huge. Windows cmd max command length is 8191.
        # 16KB base64 is way larger than 8191 characters.
        # MUST USE CHUNKING script or 'type file | plink'
        
        # New approach: Use the python script I made earlier or just 'type | plink' logic.
        # But 'type' in subprocess with pipe is best.
        
        # Let's write a remote python script to write the file, and pass content via stdin?
        # Or just use the existing upload_admin_script logic.
        
        # We will iterate chunks and append to remote file.
        CHUNK_SIZE = 4000 # Increased for efficiency on Windows CMD
        
        # 1. Clear file
        subprocess.run(f'plink -ssh root@91.99.161.14 -pw "Kh@chuy11@@" -batch "echo -n > {rem}.b64"', shell=True)
        
        for i in range(0, len(b64), CHUNK_SIZE):
            chunk = b64[i:i+CHUNK_SIZE]
            # echo -n to append without newline
            cmd = f'plink -ssh root@91.99.161.14 -pw "Kh@chuy11@@" -batch "echo -n {chunk} >> {rem}.b64"'
            subprocess.run(cmd, shell=True)
            
        # Decode
        subprocess.run(f'plink -ssh root@91.99.161.14 -pw "Kh@chuy11@@" -batch "base64 -d {rem}.b64 > {rem} && rm {rem}.b64"', shell=True)
        print("Success.")
        
    except Exception as e:
        print(f"Error uploading {loc}: {e}")

print("Building frontend on server...")
subprocess.run('plink -ssh root@91.99.161.14 -pw "Kh@chuy11@@" -batch "cd /home/clp/htdocs/erp_v2/frontend && npm run build"', shell=True)
print("Restarting backend...")
subprocess.run('plink -ssh root@91.99.161.14 -pw "Kh@chuy11@@" -batch "systemctl restart erp-backend"', shell=True)
print("Seeding premium data...")
subprocess.run('plink -ssh root@91.99.161.14 -pw "Kh@chuy11@@" -batch "python3 /home/clp/htdocs/erp_v2/backend/seed_premium_data.py"', shell=True)
print("Deployment Complete.")
