# Collaboration Features 🎉

Your app now has **real-time collaboration** powered by Liveblocks!

## How It Works

### 1. **Automatic Room Creation**
- When you first open the app, a unique room ID is automatically generated
- The room ID is added to the URL (e.g., `http://localhost:5173/?room=abc123`)

### 2. **Share with Others**
- Click the **"Share Link"** button in the top-right corner
- The full URL (including room ID) will be copied to your clipboard
- Send this link to anyone you want to collaborate with

### 3. **Real-Time Features**
- **Live Cursors**: See other users' mouse cursors moving in real-time
- **User Count**: See how many people are actively viewing the board
- **Automatic Sync**: All users in the same room see the same content

### 4. **Multiple Sessions**
- Open multiple browser tabs/windows with different room IDs
- Each room is independent with its own set of collaborators

## Usage

1. **Start the server**:
   ```bash
   npm run dev
   ```

2. **Open in browser**: http://localhost:5173/

3. **Share the link**: Click "Share Link" and send to collaborators

4. **Collaborate**: Everyone with the link will join the same room and see each other's cursors!

## Testing Locally

To test collaboration on your own computer:
1. Copy the URL from your browser (including the `?room=...` part)
2. Open a new browser window or incognito window
3. Paste the URL
4. You'll see your cursor from the first window in the second one!

## Next Steps

You can extend this with:
- **Shared sticky notes** that sync across users
- **Live text editing** on notes
- **Presence indicators** showing who's editing what
- **User avatars** and names
- **Undo/redo** functionality
- **Comments and reactions**

All of these are possible with Liveblocks' Storage and Presence APIs!
