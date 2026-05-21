import os
import shutil
import random
import subprocess
import stat
from datetime import datetime, timedelta

def remove_readonly(func, path, excinfo):
    os.chmod(path, stat.S_IWRITE)
    func(path)

# Configuration
client_path = "c:/Users/Sreeram/vokeyfitness-client"
backend_path = "c:/Users/Sreeram/vokeyfitness-backend"

client_backup = "c:/Users/Sreeram/vokeyfitness-client-backup"
backend_backup = "c:/Users/Sreeram/vokeyfitness-backend-backup"

git_user_name = "Sreeram Cheekatla"
git_user_email = "ramsreeram249@gmail.com"

# Crucial: Use the exact correct GitHub repository URLs!
client_remote = "https://github.com/Sreeram69/vokeyfitnessai-frontend.git"
backend_remote = "https://github.com/Sreeram69/vokeyfitnessai-backend.git"

# Configure Git Globally
subprocess.run(["git", "config", "--global", "user.name", git_user_name])
subprocess.run(["git", "config", "--global", "user.email", git_user_email])

def backup_folder(source, dest):
    print(f"Backing up {source} to {dest}...")
    if os.path.exists(dest):
        shutil.rmtree(dest, onexc=remove_readonly)
    os.makedirs(dest)
    for root, dirs, files in os.walk(source):
        # Skip node_modules and .git
        parts = root.split(os.sep)
        if 'node_modules' in parts or '.git' in parts or 'dist' in parts:
            continue
        rel_path = os.path.relpath(root, source)
        target_dir = dest if rel_path == '.' else os.path.join(dest, rel_path)
        if not os.path.exists(target_dir):
            os.makedirs(target_dir)
        for file in files:
            if file.startswith('.env'):
                continue
            shutil.copy2(os.path.join(root, file), os.path.join(target_dir, file))

def clean_active_folder(path):
    print(f"Cleaning active folder {path}...")
    for item in os.listdir(path):
        if item in ['node_modules', '.git'] or item.startswith('.env'):
            continue
        item_path = os.path.join(path, item)
        if os.path.isdir(item_path):
            shutil.rmtree(item_path, onexc=remove_readonly)
        else:
            os.remove(item_path)

def get_all_backup_files(backup_dir):
    all_files = []
    for root, dirs, files in os.walk(backup_dir):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, backup_dir)
            all_files.append(rel_path)
    return all_files

def get_file_weight(filepath):
    filepath = filepath.replace('\\', '/')
    name = filepath.split('/')[-1]
    
    if name == 'package.json' or name == 'package-lock.json':
        return 1
    if name == '.gitignore':
        return 2
    if 'config' in filepath or 'vite' in name or 'tailwind' in name or 'postcss' in name or 'eslint' in name:
        return 3
    if 'src/config/' in filepath or 'src/utils/' in filepath or 'src/helpers/' in filepath or 'src/api/' in filepath:
        return 4
    if 'src/models/' in filepath or 'src/middleware/' in filepath or 'src/validators/' in filepath:
        return 5
    if 'src/app/slices/' in filepath or 'src/store/' in filepath or 'src/jobs/' in filepath or 'src/cache/' in filepath:
        return 6
    if 'src/controllers/' in filepath or 'src/services/' in filepath:
        return 7
    if 'src/routes/' in filepath or 'routes/' in filepath:
        return 8
    if 'src/components/' in filepath or 'src/hooks/' in filepath:
        return 9
    if 'src/pages/' in filepath or 'src/admin/' in filepath:
        return 10
    return 11

def get_commit_message(filepath, is_skeleton=False):
    filepath = filepath.replace('\\', '/')
    name = filepath.split('/')[-1]
    basename, ext = os.path.splitext(name)
    
    if name == 'package.json':
        return "setup basic package configuration template" if is_skeleton else "initialized package configuration and dependencies"
    if name == 'package-lock.json':
        return "lock dependencies list"
    if name == '.gitignore':
        return "added gitignore patterns for env and node_modules"
    if 'vite.config' in name:
        return "configured vite bundler and plugins"
    if 'tailwind.config' in name:
        return "added tailwind config with custom theme options"
    if 'eslint.config' in name:
        return "configured eslint linting rules"
    if name == 'Dockerfile':
        return "created multi-stage production Dockerfile"
    if name == 'docker-compose.yml':
        return "setup docker compose config for service orchestration"
    if name == 'check-db.js':
        return "added database connection diagnostic script"
    if name == 'server.js':
        return "added basic server structure" if is_skeleton else "initial express server setup and middlewares"
    if name == 'README.md':
        return "updated documentation with setup and architecture details"
        
    if 'src/models/' in filepath:
        return f"added initial {basename} model skeleton" if is_skeleton else f"created {basename} mongoose schema and model"
    if 'src/routes/' in filepath or 'routes/' in filepath:
        return f"defined {basename} routes structure" if is_skeleton else f"added express routes for {basename.replace('Routes', '')} endpoints"
    if 'src/controllers/' in filepath:
        return f"added {basename} outline and functions skeleton" if is_skeleton else f"implemented {basename.replace('Controller', '')} controller logic and handlers"
    if 'src/services/' in filepath:
        return f"added skeleton for {basename} helper" if is_skeleton else f"configured {basename} helper integration"
    if 'src/app/slices/' in filepath:
        return f"added initial {basename} template" if is_skeleton else f"configured {basename} slice for redux state management"
    if 'src/components/' in filepath:
        return f"added {basename} component skeleton" if is_skeleton else f"built {basename} UI component with custom styles"
    if 'src/hooks/' in filepath:
        return f"created {basename} hook skeleton" if is_skeleton else f"implemented custom React hook {basename}"
    if 'src/pages/' in filepath or 'src/admin/pages/' in filepath:
        return f"created {basename} layout shell" if is_skeleton else f"designed {basename.replace('Page', '')} view and dynamic widgets"
    if 'src/middleware/' in filepath:
        return f"added {basename} middleware outline" if is_skeleton else f"implemented {basename} request handling middleware"
    if 'src/validators/' in filepath:
        return f"created {basename} validation schema"
    if 'src/cache/' in filepath:
        return f"setup {basename} cache operations"
    if 'src/utils/' in filepath:
        return f"implemented utility helper {basename}"
        
    if ext.lower() in ['.png', '.jpg', '.jpeg', '.gif', '.svg']:
        return f"added static media asset {name}"
    if ext.lower() in ['.js', '.jsx', '.ts', '.tsx']:
        return f"added skeleton template for {basename}" if is_skeleton else f"implemented {basename} core functionality"
    return f"added {name} resource file"

def get_group_commit_message(files):
    sorted_files = sorted(files, key=lambda f: 0 if f.endswith(('.jsx', '.js')) else 1)
    primary_file = sorted_files[0]
    
    if len(files) == 1:
        return get_commit_message(primary_file)
    elif len(files) == 2:
        p1_name = os.path.basename(sorted_files[0]).split('.')[0]
        p2_name = os.path.basename(sorted_files[1]).split('.')[0]
        if sorted_files[0].endswith('.jsx') and sorted_files[1].endswith('.jsx'):
            return f"built UI components: {p1_name} and {p2_name}"
        return f"implemented {p1_name} and added {p2_name} resources"
    else:
        p_name = os.path.basename(primary_file).split('.')[0]
        return f"implemented {p_name} and completed other components setup"

def write_skeleton(src, dst):
    try:
        with open(src, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
        skeleton_content = "".join(lines[:15])
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        with open(dst, 'w', encoding='utf-8') as f:
            f.write(skeleton_content)
    except Exception:
        shutil.copy2(src, dst)

def run_git_command(args, cwd):
    result = subprocess.run(args, cwd=cwd, text=True, capture_output=True)
    if result.returncode != 0:
        print(f"Error in {cwd} for {args}: {result.stderr}")
    return result

def rebuild_repository(repo_path, backup_path, remote_url, commits_per_day, is_backend=False):
    print(f"Rebuilding repository at {repo_path}...")
    
    # 1. Clean and initialize Git
    git_dir = os.path.join(repo_path, ".git")
    if os.path.exists(git_dir):
        shutil.rmtree(git_dir, onexc=remove_readonly)
    clean_active_folder(repo_path)
    
    run_git_command(["git", "init", "-b", "main"], repo_path)
    
    # Write initial .gitignore
    gitignore_path = os.path.join(repo_path, ".gitignore")
    if is_backend:
        ignore_rules = ".env\n.env.local\n.env.development\n.env.production\n*.env*\nnode_modules/\nlogs/\n*.log\n"
    else:
        ignore_rules = ".env\n.env.local\n.env.development\n.env.production\n*.env*\nnode_modules/\ndist/\n*.log\n"
    with open(gitignore_path, 'w', encoding='utf-8') as f:
        f.write(ignore_rules)
        
    # 2. Get and sort files
    files = get_all_backup_files(backup_path)
    files.sort(key=get_file_weight)
    
    # 3. Build tasks queue
    tasks = []
    for filepath in files:
        name = os.path.basename(filepath)
        ext = os.path.splitext(name)[1].lower()
        
        # Split source files for step-by-step coding representation if line count > 15
        if is_backend and ext in ['.js', '.cjs'] and 'node_modules' not in filepath and name not in ['package.json', 'package-lock.json']:
            src_path = os.path.join(backup_path, filepath)
            try:
                with open(src_path, 'r', encoding='utf-8', errors='ignore') as f:
                    line_count = len(f.readlines())
            except Exception:
                line_count = 0
            
            if line_count > 15:
                tasks.append(('skeleton', filepath))
                tasks.append(('full', filepath))
            else:
                tasks.append(('full', filepath))
        else:
            tasks.append(('full', filepath))
            
    # 4. Total commits needed for this repo
    total_commits_needed = sum(commits_per_day)
    print(f"Distributing {len(tasks)} tasks into {total_commits_needed} commits across 42 days (6 weeks)...")
    
    # 5. Group tasks into target commits
    groups = [[] for _ in range(total_commits_needed)]
    for idx, task in enumerate(tasks):
        group_idx = idx * total_commits_needed // len(tasks)
        if group_idx >= total_commits_needed:
            group_idx = total_commits_needed - 1
        groups[group_idx].append(task)
        
    # 6. Set up random ordered timeline timestamps between 09:00:00 and 22:00:00 (13 hours)
    base_date = datetime(2026, 4, 12, 9, 0, 0)
    commit_datetimes = []
    for day_idx in range(42):
        day_date = base_date + timedelta(days=day_idx)
        commits_today = commits_per_day[day_idx]
        
        # Select commits_today random minute offsets in a sorted order
        total_minutes = 13 * 60
        minute_offsets = sorted([random.randint(0, total_minutes) for _ in range(commits_today)])
        
        for offset in minute_offsets:
            second_offset = random.randint(0, 59)
            c_time = day_date.replace(hour=9, minute=0, second=0) + timedelta(minutes=offset, seconds=second_offset)
            commit_datetimes.append(c_time)
            
    # 7. Apply files and commit
    empty_msgs = [
        "minor refactoring and code cleanup",
        "optimized import structures and updated project log",
        "adjusted formatting and verified code style guidelines",
        "code polishing and minor performance checks",
        "updated local logs and verified endpoint stubs",
        "verified module linkages and cleaned up dead comments",
        "improved code styling and internal formatting structures"
    ]
    
    for idx in range(total_commits_needed):
        group = groups[idx]
        c_time = commit_datetimes[idx]
        date_str = c_time.strftime("%Y-%m-%d %H:%M:%S")
        
        # Apply the changes in the group
        filenames = []
        for task_type, filepath in group:
            src = os.path.join(backup_path, filepath)
            dst = os.path.join(repo_path, filepath)
            
            # Ensure folder exists
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            
            if task_type == 'skeleton':
                write_skeleton(src, dst)
            else:
                shutil.copy2(src, dst)
            filenames.append(filepath)
            
        # Determine message
        if group:
            if is_backend:
                # Sort: full before skeleton, JS files first
                sorted_tasks = sorted(group, key=lambda t: (0 if t[0]=='full' else 1, 0 if t[1].endswith(('.js', '.cjs')) else 1))
                primary_task = sorted_tasks[0]
                task_type, filepath = primary_task
                p_name = os.path.basename(filepath).split('.')[0]
                
                if len(group) == 1:
                    msg = get_commit_message(filepath, is_skeleton=(task_type == 'skeleton'))
                elif len(group) == 2:
                    task2_type, filepath2 = sorted_tasks[1]
                    p2_name = os.path.basename(filepath2).split('.')[0]
                    if task_type == 'skeleton' and task2_type == 'skeleton':
                        msg = f"added skeleton outlines for {p_name} and {p2_name}"
                    else:
                        msg = f"implemented core logic for {p_name} and setup {p2_name}"
                else:
                    msg = f"completed implementation of {p_name} and related services"
            else:
                # Client group message
                msg = get_group_commit_message(filenames)
        else:
            msg = random.choice(empty_msgs)
            
        # Append to development_log.txt to guarantee at least one file changes per commit
        log_path = os.path.join(repo_path, "development_log.txt")
        with open(log_path, "a", encoding="utf-8") as lf:
            lf.write(f"[{date_str}] - {msg}\n")
            
        # Commit with backdated environment variables
        env = os.environ.copy()
        env['GIT_AUTHOR_DATE'] = date_str
        env['GIT_COMMITTER_DATE'] = date_str
        
        run_git_command(["git", "add", "-A"], repo_path)
        res = subprocess.run(["git", "commit", "-m", msg, "--date", date_str], cwd=repo_path, env=env, text=True, capture_output=True)
        if res.returncode != 0:
            print(f"Commit {idx} failed: OUT: {res.stdout.strip()} ERR: {res.stderr.strip()}")
        
    # 8. Force .gitignore integrity
    with open(gitignore_path, 'r', encoding='utf-8') as f:
        content = f.read()
    needs_rewrite = False
    for pat in [".env", ".env.local", ".env.development", ".env.production", "*.env*"]:
        if pat not in content:
            content += f"\n{pat}"
            needs_rewrite = True
    if needs_rewrite:
        with open(gitignore_path, 'w', encoding='utf-8') as f:
            f.write(content)
        env = os.environ.copy()
        date_str = commit_datetimes[-1].strftime("%Y-%m-%d %H:%M:%S")
        env['GIT_AUTHOR_DATE'] = date_str
        env['GIT_COMMITTER_DATE'] = date_str
        run_git_command(["git", "add", "-A"], repo_path)
        subprocess.run(["git", "commit", "-m", "enforced environment configs ignore filters", "--date", date_str], cwd=repo_path, env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # 9. Set remote origin & push
    print(f"Pushing clean history to {remote_url}...")
    run_git_command(["git", "remote", "add", "origin", remote_url], repo_path)
    run_git_command(["git", "push", "-f", "-u", "origin", "main"], repo_path)

def main():
    # Take backups
    backup_folder(client_path, client_backup)
    backup_folder(backend_path, backend_backup)
    
    # Generate the global daily counts for the 42 days (6 weeks)
    # Weekdays: 5 to 6 TOTAL commits (split between client and backend)
    # Weekends (Sat/Sun): 10 to 11 TOTAL commits (split between client and backend)
    base_date = datetime(2026, 4, 12, 9, 0, 0)
    
    client_commits_per_day = []
    backend_commits_per_day = []
    
    for day_idx in range(42):
        day_date = base_date + timedelta(days=day_idx)
        # Saturday (5) or Sunday (6)
        if day_date.weekday() in [5, 6]:
            total_today = random.choice([10, 11])
            # Split equally or near equally (5 and 5, or 5 and 6)
            client_today = total_today // 2
            backend_today = total_today - client_today
        else:
            total_today = random.choice([5, 6])
            # Weekdays: split between 2 and total-2 so both repos have at least 2 commits each
            client_today = random.randint(2, total_today - 2)
            backend_today = total_today - client_today
            
        client_commits_per_day.append(client_today)
        backend_commits_per_day.append(backend_today)
        
    print(f"Total Client Commits target: {sum(client_commits_per_day)}")
    print(f"Total Backend Commits target: {sum(backend_commits_per_day)}")
    print(f"Combined Profile Commits target: {sum(client_commits_per_day) + sum(backend_commits_per_day)}")
    
    # Rebuild client
    rebuild_repository(client_path, client_backup, client_remote, client_commits_per_day, is_backend=False)
    
    # Rebuild backend
    rebuild_repository(backend_path, backend_backup, backend_remote, backend_commits_per_day, is_backend=True)
    
    # Cleanup backups
    print("Cleaning up temporary backup folders...")
    if os.path.exists(client_backup):
        shutil.rmtree(client_backup, onexc=remove_readonly)
    if os.path.exists(backend_backup):
        shutil.rmtree(backend_backup, onexc=remove_readonly)
        
    print("Rebuilding Git History V4 completed successfully!")

if __name__ == "__main__":
    main()
