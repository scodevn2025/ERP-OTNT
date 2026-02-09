import subprocess
import os
import sys
from dotenv import load_dotenv

# Load env from backend/.env
env_path = os.path.join(os.getcwd(), 'backend', '.env')
load_dotenv(env_path)

HOST = os.getenv("DEPLOY_HOST")
USER = os.getenv("DEPLOY_USER")
PASS = os.getenv("DEPLOY_PASS")
REMOTE_PATH = "/home/clp/htdocs/erp_v2"

if not all([HOST, USER, PASS]):
    print("Error: DEPLOY_HOST, DEPLOY_USER, or DEPLOY_PASS not found in backend/.env")
    sys.exit(1)

# List of specific files to sync (to avoid syncing node_modules etc.)
# We could also use 'synchronize' but being explicit is safer/faster for small changes.
files_to_sync = [
    (r"backend/server.py", f"{REMOTE_PATH}/backend/server.py"),
    (r"backend/seed_premium_data.py", f"{REMOTE_PATH}/backend/seed_premium_data.py"),
    (r"backend/routers/admin.py", f"{REMOTE_PATH}/backend/routers/admin.py"),
    (r"backend/seed_user.py", f"{REMOTE_PATH}/backend/seed_user.py"),
    (r"frontend/src/lib/api.js", f"{REMOTE_PATH}/frontend/src/lib/api.js"),
    (r"frontend/src/contexts/StoreContext.js", f"{REMOTE_PATH}/frontend/src/contexts/StoreContext.js"),
    (r"frontend/src/App.js", f"{REMOTE_PATH}/frontend/src/App.js"),
    (r"frontend/src/components/layout/StoreLayout.jsx", f"{REMOTE_PATH}/frontend/src/components/layout/StoreLayout.jsx"),
    (r"frontend/src/pages/store/HomePage.jsx", f"{REMOTE_PATH}/frontend/src/pages/store/HomePage.jsx"),
    (r"frontend/src/components/layout/AdminSidebar.jsx", f"{REMOTE_PATH}/frontend/src/components/layout/AdminSidebar.jsx"),
    (r"frontend/src/pages/admin/StoreSettingsPage.jsx", f"{REMOTE_PATH}/frontend/src/pages/admin/StoreSettingsPage.jsx"),
    (r"frontend/src/pages/admin/BlogsManagementPage.jsx", f"{REMOTE_PATH}/frontend/src/pages/admin/BlogsManagementPage.jsx"),
    (r"frontend/src/pages/admin/BlogEditorPage.jsx", f"{REMOTE_PATH}/frontend/src/pages/admin/BlogEditorPage.jsx"),
    (r"frontend/src/pages/admin/UsersManagementPage.jsx", f"{REMOTE_PATH}/frontend/src/pages/admin/UsersManagementPage.jsx"),
    (r"frontend/src/pages/store/BlogDetailPage.jsx", f"{REMOTE_PATH}/frontend/src/pages/store/BlogDetailPage.jsx"),
    (r"frontend/package.json", f"{REMOTE_PATH}/frontend/package.json"),
    (r"frontend/public/banners/", f"{REMOTE_PATH}/frontend/public/banners/"),
]

def run_winscp():
    print(f"--- Starting High-Speed Deployment to {HOST} ---")
    
    # Create WinSCP script
    script_content = [
        "option batch abort",
        "option confirm off",
        f"open sftp://{USER}:{PASS}@{HOST}/ -hostkey=*",
    ]
    
    for local, remote in files_to_sync:
        local_abs = os.path.abspath(local)
        if os.path.isdir(local_abs):
            script_content.append(f"put -nopreservetime -nopermissions \"{local_abs}\\*\" \"{remote}\"")
        else:
            if os.path.exists(local_abs):
                script_content.append(f"put -nopreservetime -nopermissions \"{local_abs}\" \"{remote}\"")
            else:
                print(f"Warning: Local file not found: {local_abs}")
    
    script_content.append("exit")
    
    with open("winscp_script.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(script_content))
    
    # Run WinSCP
    print("Uploading files via WinSCP...")
    # Try common WinSCP paths or just rely on PATH
    winscp_cmd = "winscp.com" # Should be in path if installed correctly for CLI
    result = subprocess.run([winscp_cmd, "/script=winscp_script.txt"], capture_output=True, text=True)
    
    if result.returncode != 0:
        print("WinSCP Upload Failed:")
        print(result.stdout)
        print(result.stderr)
        return False
    
    print("Upload successful.")
    return True

def run_remote_commands():
    print("--- Running Remote Build & Restart Commands ---")
    
    commands = [
        f"cd {REMOTE_PATH}/frontend && npm install && npm run build",
        f"python3 -m pip install -r {REMOTE_PATH}/backend/requirements.txt",
        "systemctl restart erp-backend",
        f"python3 {REMOTE_PATH}/backend/seed_premium_data.py"
    ]
    
    for cmd in commands:
        print(f"Executing: {cmd}")
        # Using plink for remote commands
        plink_cmd = f'plink -ssh {USER}@{HOST} -pw "{PASS}" -batch "{cmd}"'
        res = subprocess.run(plink_cmd, shell=True, capture_output=True, text=True)
        if res.stdout: print(res.stdout)
        if res.stderr: print(res.stderr)
    
    print("Remote commands completed.")

if __name__ == "__main__":
    if run_winscp():
        run_remote_commands()
        # Cleanup temp winscp script
        if os.path.exists("winscp_script.txt"):
            os.remove("winscp_script.txt")
        print("\nDeployment Complete!")
