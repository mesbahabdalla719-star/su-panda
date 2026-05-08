# Publishing Guide: Clean Reset to GitHub

Follow these steps to wipe your current Git history and publish a fresh, clean version of Su Panda to your GitHub repository.

---

## Step 1: Clean Local Git
Run these commands in the terminal to remove old history and start fresh:

1.  **Remove existing Git folder**:
    ```bash
    rm -rf .git
    ```

2.  **Initialize a new Git repository**:
    ```bash
    git init
    ```

3.  **Add all files**:
    ```bash
    git add .
    ```

4.  **Create your first commit**:
    ```bash
    git commit -m "Initial clean release v1.0"
    ```

5.  **Set the branch to main**:
    ```bash
    git branch -M main
    ```

---

## Step 2: Push to GitHub (Force)
Replace the URL with your actual repository URL if it's different:

1.  **Connect to GitHub**:
    ```bash
    git remote add origin https://github.com/mesbahabdalla719-star/su-panda.git
    ```

2.  **Force push to overwrite history**:
    *Warning: This will replace everything currently on GitHub with your local code.*
    ```bash
    git push -u -f origin main
    ```

---

## Step 3: Verify Deployment
1.  Go to **Vercel** or **Firebase App Hosting**.
2.  The build should trigger automatically.
3.  Ensure your **Environment Variables** (Firebase Keys) are still set in your hosting provider's dashboard.
4.  Once live, log in and use the **Admin Menu** to seed the 100 dishes.
