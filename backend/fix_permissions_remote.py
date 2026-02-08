import paramiko
import time

def run_remote_commands():
    host = "91.99.161.14"
    user = "root"
    password = "Kh@chuy11@@"
    
    commands = [
        "sudo -u postgres psql -d erpotnt2026 -c 'ALTER SCHEMA public OWNER TO otnt_user;'",
        "sudo -u postgres psql -d erpotnt2026 -c 'GRANT ALL ON SCHEMA public TO otnt_user;'",
        "sudo -u postgres psql -d erpotnt2026 -c 'GRANT ALL PRIVILEGES ON DATABASE erpotnt2026 TO otnt_user;'",
        "sudo -u postgres psql -d erpotnt2026 -c 'GRANT ALL ON ALL TABLES IN SCHEMA public TO otnt_user;'",
        "sudo -u postgres psql -d erpotnt2026 -c 'GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO otnt_user;'"
    ]
    
    try:
        print(f"Connecting to {host} as {user}...")
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(host, username=user, password=password)
        
        for cmd in commands:
            print(f"Executing: {cmd}")
            stdin, stdout, stderr = ssh.exec_command(cmd)
            out = stdout.read().decode()
            err = stderr.read().decode()
            if out: print(f"Output: {out.strip()}")
            if err: print(f"Error: {err.strip()}")
            
        ssh.close()
        print("Done!")
        
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    run_remote_commands()
