import base64
import subprocess

script_content = open(r'c:\Users\SCODEVN\Downloads\ERP_V2\create_admin_mongo.py', 'r').read()
encoded = base64.b64encode(script_content.encode('utf-8')).decode('utf-8')

print("Step 1: Uploading script...")
subprocess.run('plink -ssh root@91.99.161.14 -pw "Kh@chuy11@@" -batch "rm -f /root/admin_script_b64.txt"', shell=True)

chunk_size = 50
for i in range(0, len(encoded), chunk_size):
    chunk = encoded[i:i+chunk_size]
    cmd = f'plink -ssh root@91.99.161.14 -pw "Kh@chuy11@@" -batch "echo -n {chunk} >> /root/admin_script_b64.txt"'
    subprocess.run(cmd, shell=True)

print("Step 2: Decoding and running...")
subprocess.run('plink -ssh root@91.99.161.14 -pw "Kh@chuy11@@" -batch "base64 -d /root/admin_script_b64.txt > /home/clp/htdocs/erp_v2/backend/create_admin_mongo.py && cd /home/clp/htdocs/erp_v2/backend && source ../venv/bin/activate && python3 create_admin_mongo.py"', shell=True)
