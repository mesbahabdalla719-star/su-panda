# Publishing Guide: GitHub Management

Follow these steps to manage your Su Panda repository on GitHub.

---

## Method A: Regular Update (Pushing Changes)
Use this method when you have made changes to the code and want to sync them to GitHub.

1.  **Stage your changes**:
    ```bash
    git add .
    ```

2.  **Commit your changes**:
    ```bash
    git commit -m "Describe your changes here (e.g., Updated testimonials)"
    ```

3.  **Push to GitHub**:
    ```bash
    git push
    ```

---

## Method B: Clean Reset (Start from Zero)
Use this method only if you want to wipe your entire Git history and start fresh.

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

6.  **Connect to GitHub**:
    *(Replace with your actual URL if it changed)*
    ```bash
    git remote add origin https://github.com/mesbahabdalla719-star/su-panda.git
    ```

7.  **Force push to overwrite history**:
    *Warning: This will replace everything currently on GitHub.*
    ```bash
    git push -u -f origin main
    ```

---

## Step 3: Verify Deployment
1.  Go to **Vercel** or **Firebase App Hosting**.
2.  The build should trigger automatically.
3.  Ensure your **Environment Variables** (Firebase Keys) are still set.
4.  Ensure **supanda-liard.vercel.app** is in your Firebase **Authorized Domains**.
