<div align="center">

# Colanode

**An all-in-one, open-source, and self-hosted collaboration platform that puts you in control of your data.**

</div>

## Overview

Colanode is a local-first, open-source platform for seamless collaboration. It combines the flexibility of online teamwork with the privacy and security of self-hosted data. Whether you’re chatting with teammates, documenting projects, managing databases, or organizing files, Colanode provides an integrated experience that works both online and offline.

**Key Features:**

- **Chat:** Communicate in real-time through direct messages or group chats.
- **Pages:** Create and edit rich-content documents, wikis, and notes using a Notion-style editor.
- **Databases:** Structure and query your content using customizable fields and views.
- **Files & Folders:** Manage and share files through attachments or dedicated folders.

## How It Works

At the core of Colanode is a powerful local-first architecture designed for speed, reliability, and privacy:

1. **Local Data Model:**  
   Everything in Colanode is stored as a “node.” This includes messages, pages, databases, records, folders, files, users, and more. All nodes are initially saved in a local SQLite database within the desktop app.

2. **Transactions & Offline Support:**  
   Changes—such as sending a message or updating a page—are recorded as transactions in the local database. Because all reads occur locally, the platform remains fast and fully functional even without an internet connection.

3. **Synchronization with a Central Server:**  
   A background service automatically syncs all local transactions to a server using CRDT (Conflict-Free Replicated Data Types). This ensures that edits and updates made from multiple devices remain consistent. Only data to which a user has permission is synced to their device, ensuring privacy and reducing unnecessary data transfer.

4. **Local-First Collaboration:**  
   With Colanode, you can connect to multiple servers from a single desktop client. Host the server anywhere you choose and maintain full control over your data. This flexible, decentralized approach empowers teams to securely collaborate across various environments.

## Why Colanode?

- **Open Source:** Colanode’s code is fully open source, ensuring transparency and the ability to audit or customize the platform to your needs.
- **Local-First & Offline-Ready:** Don’t let internet outages slow you down. Work offline, and let Colanode handle synchronization behind the scenes when you’re back online.
- **Scalable & Modular:** Easily adapt Colanode for small teams or large organizations. Its modular architecture and extensible design allow it to grow with you.
- **Privacy & Security:** Self-hosting gives you ultimate control over your data. Keep your information private, secure, and governed by your own policies.

## Getting started

The easiest way to try Colanode is to [download the desktop app](https://colanode.com/downloads) from the official website and sign in to one of Colanode’s provided cloud servers. Enjoy a generous free tier for personal use, and explore the platform’s features without any upfront commitment.

## Tech Stack

- **Desktop App:**

  - [Electron](https://www.electronjs.org/)
  - [Vite](https://vitejs.dev/)
  - [React](https://reactjs.org/)
  - [TypeScript](https://www.typescriptlang.org/)

- **Server:**

  - [Node.js](https://nodejs.org/)
  - [Express](https://expressjs.com/)
  - [TypeScript](https://www.typescriptlang.org/)

- **Database & Storage:**
  - [PostgreSQL](https://www.postgresql.org/) for structured data
  - [Redis](https://redis.io/) for caching and message queues
  - S3-compatible storage (e.g., [MinIO](https://min.io/)) for files
