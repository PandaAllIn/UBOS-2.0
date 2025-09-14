# Obsidian

**Category**: productivity  
**Priority**: medium
**Research Model**: sonar-pro
**Confidence**: 95%
**Research Cost**: $0.0017
**Processing Time**: 17 seconds
**Generated**: 2025-09-12T18:25:38.850Z

---

Obsidian is a **local-first, Markdown-based knowledge management and note-taking tool** that enables users to build a personal knowledge base with powerful linking and graph visualization features. It is widely used for personal knowledge management (PKM), academic research, project management, and creative workflows[1][2][3][4].

---

## 1. **Overview & Purpose**

- **Obsidian** stores notes as plain-text Markdown files in a folder called a **vault**, giving users full control and ownership of their data[1][3].
- Its core philosophy is **linked thinking**: users create a network of interconnected notes using bi-directional links and visualize relationships with a graph database[1][3][4].
- Main use cases:
  - Personal knowledge management (“second brain”)
  - Academic research and literature reviews
  - Project and task management
  - Creative writing and idea development
  - Meeting notes and daily logs[2][3]

---

## 2. **Installation & Setup**

### **Windows**
1. Download the installer from the official site.
2. Run the installer and follow prompts.
3. Launch Obsidian and create/open a vault.

### **macOS**
1. Download the `.dmg` file from the official site.
2. Drag Obsidian to Applications.
3. Open Obsidian and create/open a vault.

### **Linux**
1. Download the AppImage or `.deb` package.
2. For AppImage: Make executable and run.
3. For `.deb`: Install via `sudo dpkg -i obsidian-x.y.z.deb`.

### **Mobile (iOS/Android)**
1. Install from the App Store or Google Play.
2. Open the app and set up your vault.

---

## 3. **Core Features**

- **Markdown-based notes**: All notes are stored as `.md` files for portability and future-proofing[1][3][4].
- **Vaults**: A vault is a folder containing all notes, subfolders, and attachments[1].
- **Bi-directional linking**: Use `[[Note Title]]` to link notes; backlinks are automatically created[1][3][4].
- **Graph view**: Visualizes connections between notes as nodes and edges, revealing clusters and patterns[1][3][4].
- **Tags and folders**: Organize notes with tags (`#tag`) and folder hierarchy[2].
- **Backlinks pane**: Shows all notes linking to the current note[1][4].
- **Embeds and transclusions**: Embed entire notes or specific blocks using `![[Note Title]]`[1].
- **Plugin ecosystem**: Extend functionality with thousands of community plugins (e.g., task management, calendar, spaced repetition)[3][4].
- **Themes and customization**: Change appearance and layout with themes and CSS[4].
- **Offline operation**: All data is stored locally for privacy and reliability[3].
- **Web clipping**: Save web content directly into Obsidian[2].
- **PDF annotation**: Annotate PDFs within notes[2].
- **Kanban boards and diagrams**: Visualize workflows and processes[2].

---

## 4. **Usage Examples**

### **Basic Note Creation**
```markdown
# Meeting Notes
- Discussed project timeline
- Action items: [[Project Plan]], [[Budget]]
```

### **Linking Notes**
```markdown
See related topic: [[Knowledge Graphs]]
```

### **Embedding Notes**
```markdown
![[Project Plan]]
```

### **Tagging**
```markdown
#meeting #project
```

### **Dataview Plugin Example**
```markdown
table file.name, file.mtime
from "Projects"
where contains(tags, "active")
```
*(Lists all active project notes with last modified time.)*

---

## 5. **API Reference**

Obsidian does not have a public REST API, but developers can extend it via the **plugin API** (TypeScript/JavaScript):

### **Plugin API Highlights**
- `registerCommand`: Add custom commands to the command palette.
- `addRibbonIcon`: Add icons to the sidebar.
- `registerMarkdownCodeBlockProcessor`: Process custom code blocks in Markdown.
- `app.vault`: Access and manipulate files in the vault.
- `app.workspace`: Interact with panes and views.

### **CLI**
Obsidian does not provide a native CLI, but plugins like “Obsidian CLI” or community scripts can automate vault operations.

---

## 6. **Integration Guide**

- **Sync**: Use Obsidian Sync (paid) for encrypted multi-device synchronization[3].
- **Third-party sync**: Integrate with Dropbox, Google Drive, or iCloud by storing your vault in a synced folder.
- **Plugins**: Integrate with tools like Todoist, Google Calendar, Zotero (for academic references), and Git via plugins.
- **Web Clipping**: Use browser extensions or plugins to save web content directly to your vault[2].
- **PDF Annotation**: Annotate PDFs within notes using built-in or plugin features[2].
- **Kanban/Task Management**: Use plugins for Kanban boards, task lists, and project tracking[2].

---

## 7. **Configuration**

- **Settings**: Access via the gear icon; configure appearance, hotkeys, plugins, and core features.
- **Vault location**: Choose any folder on your device.
- **Authentication**: No login required for local use; Obsidian Sync requires an account.
- **Environment setup**: For plugin development, set up Node.js and TypeScript.

---

## 8. **Troubleshooting**

- **Notes not linking**: Ensure correct note titles and syntax (`[[Note Title]]`).
- **Graph not updating**: Reload the app or rebuild the graph from settings.
- **Sync issues**: Check internet connection, subscription status, and vault location.
- **Plugin errors**: Disable conflicting plugins, update to latest versions, or check plugin documentation.
- **Performance lag**: Reduce graph complexity, disable unused plugins, or split large vaults.

---

## 9. **Best Practices**

- **Atomic notes**: Keep notes focused on single topics for better linking.
- **Consistent naming**: Use clear, descriptive note titles.
- **Tagging and folders**: Combine tags and folders for flexible organization.
- **Regular review**: Use daily/weekly notes to review and connect ideas.
- **Leverage plugins**: Explore community plugins for automation, visualization, and integration.
- **Backup**: Regularly back up your vault folder.

---

## 10. **Resources**

- **Official documentation**: See the help section in the app or visit the official website.
- **Community forum**: Engage with other users for tips and troubleshooting.
- **Discord server**: Join for real-time discussion and support.
- **Tutorials**: Search YouTube and blogs for setup guides and advanced workflows.
- **Plugin directory**: Browse and install plugins from within the app or the official plugin marketplace.

---

Obsidian offers a **powerful, extensible platform for knowledge management** with privacy, customization, and a vibrant community at its core[1][2][3][4].

---

**Metadata**:
- Content Length: 6466 characters
- Tokens Used: 1,697
- Sources Found: 0

*Generated by UBOS 2.0 Enhanced Tool Documentation Agent*
*Powered by Perplexity Sonar API*
